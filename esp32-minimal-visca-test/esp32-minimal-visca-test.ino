/*
 * Minimal VISCA Test - Just pan right continuously
 *
 * This is the simplest possible test - just sends one command repeatedly.
 * If the camera works at all, you should see it pan right.
 */

#define RX_PIN 17
#define TX_PIN 16
#define LED_PIN 2

// IF Clear - reset VISCA interface (sent once at startup)
const byte CMD_IF_CLEAR[] = {0x88, 0x01, 0x00, 0x01, 0xFF};

// Pan Right continuously at slow speed
const byte CMD_PAN_RIGHT[] = {0x81, 0x01, 0x06, 0x01, 0x05, 0x05, 0x02, 0x03, 0xFF};

// Stop all movement
const byte CMD_STOP[] = {0x81, 0x01, 0x06, 0x01, 0x00, 0x00, 0x03, 0x03, 0xFF};

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, RX_PIN, TX_PIN);
  pinMode(LED_PIN, OUTPUT);

  delay(1000);
  Serial.println("\n\n=== MINIMAL VISCA TEST ===");
  Serial.println("This sketch sends:");
  Serial.println("  1. IF_Clear (once at startup)");
  Serial.println("  2. Pan Right command every 5 seconds");
  Serial.println("\nIf camera works, it should continuously pan right.");
  Serial.println("============================\n");

  // Clear receive buffer
  while (Serial2.available() > 0) {
    Serial2.read();
  }

  // Send IF Clear
  Serial.println("Sending IF_Clear...");
  sendCommand(CMD_IF_CLEAR, sizeof(CMD_IF_CLEAR));
  delay(1000);

  Serial.println("Starting loop...\n");
}

void loop() {
  static int count = 0;
  count++;

  digitalWrite(LED_PIN, HIGH);

  Serial.print("Attempt #");
  Serial.print(count);
  Serial.println(" - Sending Pan Right command:");
  sendCommand(CMD_PAN_RIGHT, sizeof(CMD_PAN_RIGHT));

  digitalWrite(LED_PIN, LOW);

  Serial.println("Waiting 5 seconds...\n");
  delay(5000);
}

void sendCommand(const byte* cmd, int len) {
  // Print command
  Serial.print("  TX: ");
  for (int i = 0; i < len; i++) {
    if (cmd[i] < 0x10) Serial.print("0");
    Serial.print(cmd[i], HEX);
    Serial.print(" ");
  }
  Serial.println();

  // Send to camera
  Serial2.write(cmd, len);
  Serial2.flush();

  // Check for response
  delay(200);
  if (Serial2.available() > 0) {
    Serial.print("  RX: ");
    while (Serial2.available() > 0) {
      byte b = Serial2.read();
      if (b < 0x10) Serial.print("0");
      Serial.print(b, HEX);
      Serial.print(" ");
    }
    Serial.println();
  } else {
    Serial.println("  RX: (no response)");
  }
}
