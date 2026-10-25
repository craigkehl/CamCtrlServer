/*
 * ESP32 VISCA Camera Test - Lumens VC-A51s
 *
 * Tests serial connection to Lumens VC-A51s camera via TTL-to-RS232 converter
 * Performs a simple movement pattern: Right -> Up -> Left -> Down
 *
 * Wiring Diagram:
 *
 * ESP32-WROOM-32D         MAX3232           Camera 8-Pin mini-DIN
 *                      TTL Side │ RS-232        ───────
 *                               │              1 2
 * GND  ───────────── GND       │   GND  ─────  3 4  5
 * 3.3V ───────────── VCC       │   VCC         6 7 8
 * GPIO16 (TX) ──────  T_IN     │  T_OUT ───── Pin 3 (Camera RX)
 * GPIO17 (RX) ──────  R_OUT    │  R_IN  ───── Pin 7 (Camera TX)
 *
 * Camera 8-pin DIN Pinout (VERIFIED):
 *   Pin 3: RXD (Camera receives from ESP32)
 *   Pin 4: GND
 *   Pin 7: TXD (Camera transmits to ESP32)
 *
 * Serial Settings: 9600 baud, 8N1
 * Protocol: VISCA
 * Camera Address: 1 (0x81 in commands)
 *
 * VISCA Protocol:
 * Command format: [0x81, 0x01] [0x06, 0x01] [pan_speed] [tilt_speed] [pan_dir] [tilt_dir] [0xFF]
 * Pan direction: 0x01=left, 0x02=right, 0x03=stop
 * Tilt direction: 0x01=down, 0x02=up, 0x03=stop
 * Pan speed range: 0x01 to 0x18 (1-24 decimal)
 * Tilt speed range: 0x01 to 0x14 (1-20 decimal)
 */

#define RX_PIN 17
#define TX_PIN 16
#define LED_PIN 2
#define MOVE_DURATION 4000  // Duration of each movement in milliseconds
#define PAN_SPEED 0x18      // Pan speed: 24 decimal (MAXIMUM per original code)
#define TILT_SPEED 0x14     // Tilt speed: 20 decimal (MAXIMUM per original code)

// VISCA command structure for pan/tilt
// Format: [0x81, 0x01, 0x06, 0x01] [pan_speed] [tilt_speed] [pan_dir] [tilt_dir] [0xFF]
const byte CMD_PAN_RIGHT[] = {0x81, 0x01, 0x06, 0x01, PAN_SPEED, 0x00, 0x02, 0x03, 0xFF};
const byte CMD_TILT_UP[]   = {0x81, 0x01, 0x06, 0x01, 0x00, TILT_SPEED, 0x03, 0x02, 0xFF};
const byte CMD_PAN_LEFT[]  = {0x81, 0x01, 0x06, 0x01, PAN_SPEED, 0x00, 0x01, 0x03, 0xFF};
const byte CMD_TILT_DOWN[] = {0x81, 0x01, 0x06, 0x01, 0x00, TILT_SPEED, 0x03, 0x01, 0xFF};
const byte CMD_STOP[]      = {0x81, 0x01, 0x06, 0x01, 0x00, 0x00, 0x03, 0x03, 0xFF};

// Simple test command to check if camera responds
const byte CMD_POWER_INQUIRY[] = {0x81, 0x09, 0x04, 0x00, 0xFF};

// Interface Clear - resets VISCA interface
const byte CMD_IF_CLEAR[] = {0x88, 0x01, 0x00, 0x01, 0xFF};

// Address Set - broadcast to all cameras
const byte CMD_ADDRESS_SET[] = {0x88, 0x30, 0x01, 0xFF};

// Zoom commands
const byte CMD_ZOOM_WIDE[] = {0x81, 0x01, 0x04, 0x07, 0x03, 0xFF};  // Zoom out (wide)
const byte CMD_ZOOM_STOP[] = {0x81, 0x01, 0x04, 0x07, 0x00, 0xFF};  // Stop zoom

void setup() {
  // Initialize debug serial port at 115200 to match Serial Monitor
  Serial.begin(115200);
  while (!Serial) {
    ; // Wait for serial port to connect
  }

  // Initialize camera serial port (Serial2 on GPIO 16/17) at 9600 for camera
  Serial2.begin(9600, SERIAL_8N1, RX_PIN, TX_PIN);

  // Initialize LED
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.println("===================================");
  Serial.println("ESP32 VISCA Camera Test");
  Serial.println("Lumens VC-A51s PTZ Camera");
  Serial.println("===================================");
  Serial.print("Camera Port: Serial2 (RX=GPIO");
  Serial.print(RX_PIN);
  Serial.print(", TX=GPIO");
  Serial.print(TX_PIN);
  Serial.println(")");
  Serial.println("Baud Rate: 9600, 8N1");
  Serial.println("Pan Speed: 0x18 (24 decimal - MAXIMUM)");
  Serial.println("Tilt Speed: 0x14 (20 decimal - MAXIMUM)");
  Serial.println("Movement Duration: 4 seconds each");
  Serial.println("===================================\n");

  delay(2000);  // Give camera time to initialize

  Serial.println("Initializing camera VISCA interface...");

  // Clear any junk in receive buffer
  while (Serial2.available() > 0) {
    Serial2.read();
  }

  // Step 1: Address Set (broadcast)
  Serial.println("1. Sending Address Set (broadcast):");
  sendViscaCommand(CMD_ADDRESS_SET, sizeof(CMD_ADDRESS_SET));
  delay(500);

  // Step 2: IF Clear
  Serial.println("2. Sending IF_Clear:");
  sendViscaCommand(CMD_IF_CLEAR, sizeof(CMD_IF_CLEAR));
  delay(500);

  // Step 3: Power Inquiry to test
  Serial.println("3. Testing camera connection with power inquiry:");
  sendViscaCommand(CMD_POWER_INQUIRY, sizeof(CMD_POWER_INQUIRY));
  delay(500);

  // Step 4: Zoom all the way out (wide angle makes movement appear faster)
  Serial.println("4. Zooming out to wide angle...");
  sendViscaCommand(CMD_ZOOM_WIDE, sizeof(CMD_ZOOM_WIDE));
  delay(3000);  // Give camera time to zoom out completely
  sendViscaCommand(CMD_ZOOM_STOP, sizeof(CMD_ZOOM_STOP));
  delay(500);

  Serial.println("\nStarting test sequence...\n");
}

void loop() {
  static int loopCount = 0;
  loopCount++;

  Serial.println("===========================================");
  Serial.print(">>> LOOP ITERATION #");
  Serial.println(loopCount);
  Serial.println("===========================================");

  // Test sequence: Right -> Up -> Left -> Down

  // 1. Pan Right
  Serial.println("\n>>> Pan RIGHT");
  sendViscaCommand(CMD_PAN_RIGHT, sizeof(CMD_PAN_RIGHT));
  Serial.println("  Blinking LED...");
  blinkLED(2);
  Serial.print("  Moving for ");
  Serial.print(MOVE_DURATION / 1000);
  Serial.println(" seconds...");
  delay(MOVE_DURATION);
  stopCamera();
  Serial.println("  Waiting 1 second...\n");
  delay(1000);

  // 2. Tilt Up
  Serial.println(">>> Tilt UP");
  sendViscaCommand(CMD_TILT_UP, sizeof(CMD_TILT_UP));
  Serial.println("  Blinking LED...");
  blinkLED(2);
  Serial.print("  Moving for ");
  Serial.print(MOVE_DURATION / 1000);
  Serial.println(" seconds...");
  delay(MOVE_DURATION);
  stopCamera();
  Serial.println("  Waiting 1 second...\n");
  delay(1000);

  // 3. Pan Left
  Serial.println(">>> Pan LEFT");
  sendViscaCommand(CMD_PAN_LEFT, sizeof(CMD_PAN_LEFT));
  Serial.println("  Blinking LED...");
  blinkLED(2);
  Serial.print("  Moving for ");
  Serial.print(MOVE_DURATION / 1000);
  Serial.println(" seconds...");
  delay(MOVE_DURATION);
  stopCamera();
  Serial.println("  Waiting 1 second...\n");
  delay(1000);

  // 4. Tilt Down
  Serial.println(">>> Tilt DOWN");
  sendViscaCommand(CMD_TILT_DOWN, sizeof(CMD_TILT_DOWN));
  Serial.println("  Blinking LED...");
  blinkLED(2);
  Serial.print("  Moving for ");
  Serial.print(MOVE_DURATION / 1000);
  Serial.println(" seconds...");
  delay(MOVE_DURATION);
  stopCamera();
  Serial.println("  Waiting 1 second...\n");
  delay(1000);

  // Wait before next cycle
  Serial.println("--- Cycle complete. Waiting 5 seconds before next cycle ---\n");

  // Clear any remaining data in receive buffer to prevent overflow
  while (Serial2.available() > 0) {
    Serial2.read();
  }

  delay(5000);
}

void sendViscaCommand(const byte* cmd, int len) {
  // Print command to Serial Monitor for debugging
  Serial.print("  Sent: ");
  for (int i = 0; i < len; i++) {
    if (cmd[i] < 0x10) Serial.print("0");
    Serial.print(cmd[i], HEX);
    Serial.print(" ");
  }
  Serial.println();

  // Write command to camera
  Serial2.write(cmd, len);
  Serial2.flush();  // Wait for transmission to complete

  // Check for any response from camera
  delay(100);  // Give camera time to respond
  if (Serial2.available() > 0) {
    Serial.print("  Response: ");
    int count = 0;
    while (Serial2.available() > 0 && count < 20) {  // Limit to 20 bytes to prevent overflow
      byte b = Serial2.read();
      if (b < 0x10) Serial.print("0");
      Serial.print(b, HEX);
      Serial.print(" ");
      count++;
    }
    Serial.println();

    // Clear any remaining bytes in buffer
    while (Serial2.available() > 0) {
      Serial2.read();
    }
  }
}

void stopCamera() {
  Serial.println("  STOP");
  sendViscaCommand(CMD_STOP, sizeof(CMD_STOP));
}

void blinkLED(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(100);
    digitalWrite(LED_PIN, LOW);
    delay(100);
  }
}
