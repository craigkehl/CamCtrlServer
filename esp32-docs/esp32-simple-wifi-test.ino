/*
 * Simple WiFi Test for XIAO ESP32-C6
 *
 * Upload this first to verify:
 * 1. Board uploads successfully
 * 2. WiFi credentials are correct
 * 3. ESP32-C6 can connect to your network
 *
 * After this works, upload the full projector bridge sketch.
 */

#include <WiFi.h>

// UPDATE THESE
const char* ssid = "";
const char* password = "";

void setup() {
  // USB Serial for output
  Serial.begin(115200);
  delay(2000);  // Wait for Serial Monitor to open

  Serial.println("\n\n=== XIAO ESP32-C6 WiFi Test ===");
  Serial.print("Connecting to: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n\n✓ SUCCESS!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal Strength (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    Serial.print("MAC Address: ");
    Serial.println(WiFi.macAddress());
  } else {
    Serial.println("\n\n✗ FAILED");
    Serial.println("Could not connect to WiFi");
    Serial.println("Check:");
    Serial.println("  - SSID is correct");
    Serial.println("  - Password is correct");
    Serial.println("  - Router is 2.4GHz (ESP32-C6 doesn't support 5GHz)");
  }
}

void loop() {
  // Show WiFi status every 5 seconds
  delay(5000);

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Still connected - IP: ");
    Serial.print(WiFi.localIP());
    Serial.print(" - RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("WiFi disconnected - reconnecting...");
    WiFi.begin(ssid, password);
  }
}
