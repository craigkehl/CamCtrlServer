/*
 * WiFi Test for XIAO ESP32-C6
 * UPDATE WiFi credentials below before uploading
 */

#include <WiFi.h>

// UPDATE THESE WITH YOUR WIFI CREDENTIALS
const char* ssid = "";
const char* password = "";

void setup() {
  Serial.begin(115200);
  delay(2000);

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
    Serial.print("Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\n\n✗ FAILED - Could not connect");
    Serial.println("Check SSID, password, and that router is 2.4GHz");
  }
}

void loop() {
  delay(5000);
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Connected - IP: ");
    Serial.print(WiFi.localIP());
    Serial.print(" - RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("Disconnected - reconnecting...");
    WiFi.begin(ssid, password);
  }
}
