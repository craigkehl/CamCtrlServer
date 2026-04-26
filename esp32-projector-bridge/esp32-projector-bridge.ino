/*
 * ESP32-C6 Projector Serial-to-TCP Bridge
 * Hardware: Seeed Studio XIAO ESP32-C6
 *
 * Wiring:
 *   XIAO D6 (GPIO21) -> RS232-TTL module TX pin
 *   XIAO D7 (GPIO20) -> RS232-TTL module RX pin
 *   XIAO 3V3         -> RS232-TTL module VCC
 *   XIAO GND         -> RS232-TTL module GND
 *   RS232 module DB9 -> Projector DB9 port
 */

#include <WiFi.h>

// WiFi credentials - UPDATE THESE
const char* ssid = "";
const char* password = "";

// TCP server settings
const int tcpPort = 8888;  // Port to listen on
WiFiServer server(tcpPort);
WiFiClient client;

// Serial2 pins for XIAO ESP32-C6
#define RXD2 20  // D7 on XIAO
#define TXD2 21  // D6 on XIAO

void setup() {
  // USB Serial for debugging
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\nESP32-C6 Projector Bridge Starting...");

  // Initialize Serial2 for projector communication (9600 baud, 8N1)
  Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2);
  Serial.println("Serial2 initialized (9600 baud, pins RX=20/TX=21)");

  // Connect to WiFi
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("MAC address: ");
    Serial.println(WiFi.macAddress());
    Serial.print("IP address:  ");
    Serial.println(WiFi.localIP());
    Serial.print("TCP port:    ");
    Serial.println(tcpPort);
  } else {
    Serial.println("\nWiFi connection failed!");
    return;
  }

  // Start TCP server
  server.begin();
  Serial.println("TCP server started - ready for connections");
}

void loop() {
  // Check for new TCP client connections
  if (!client.connected()) {
    client = server.available();
    if (client) {
      Serial.println("New client connected");
    }
  }

  // Forward data from TCP client to Serial (projector)
  if (client.connected() && client.available()) {
    while (client.available()) {
      uint8_t byte = client.read();
      Serial2.write(byte);  // Send to projector
      Serial.print("TCP->Serial: 0x");
      Serial.println(byte, HEX);
    }
  }

  // Forward data from Serial (projector) to TCP client
  if (Serial2.available()) {
    if (client.connected()) {
      while (Serial2.available()) {
        uint8_t byte = Serial2.read();
        client.write(byte);  // Send to TCP client
        Serial.print("Serial->TCP: 0x");
        Serial.println(byte, HEX);
      }
    } else {
      // Discard serial data if no client connected
      Serial2.read();
    }
  }

  delay(1);  // Small delay for stability
}
