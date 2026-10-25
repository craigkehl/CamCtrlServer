/*
 * ESP32-C6 Projector Serial-to-TCP Bridge (Phase 0 test firmware)
 * Hardware: Seeed Studio XIAO ESP32-C6 + MAX3232 RS-232/TTL module
 *
 * Wiring (XIAO label → module TTL side):
 *   D6 (GPIO16, UART TX) -> module RXD / "TTL in"
 *   D7 (GPIO17, UART RX) <- module TXD / "TTL out"
 *   3V3                  -> module VCC   (3.3 V, not 5 V)
 *   GND                  -> module GND
 *   Module DB9           -> projector DB9 (or RJ45→DB9 adapter on the cat5e run)
 *
 * On the C6, D6/D7 are GPIO16/17. Older docs in this repo listed GPIO21/20,
 * which is the XIAO ESP32-C3 mapping, so serial went out on the wrong pins.
 * Use the D6/D7 constants from the board variant, never raw GPIO numbers.
 *
 * Setup:
 *   1. Copy secrets.example.h to secrets.h and fill in WIFI_SSID / WIFI_PASSWORD
 *   2. Board: "XIAO_ESP32C6" (esp32 core 3.x), USB CDC On Boot: Enabled
 *   3. Set PROJ_BAUD to match the projector's RS-232 baud setting
 *   4. Upload, open Serial Monitor at 115200 to read the MAC and IP
 *   5. Probe from CamCtrlServer: npx tsc && node dist/tools/projSerialProbe.js
 */

#include <WiFi.h>
#include "secrets.h"   // WIFI_SSID, WIFI_PASSWORD (gitignored; see secrets.example.h)

// --- Configuration ---
const long     PROJ_BAUD            = 9600;  // must match the projector's menu setting
const uint16_t TCP_PORT             = 8888;
const bool     USE_EXTERNAL_ANTENNA = false; // true if the board sits in a metal podium
const uint32_t WIFI_RETRY_MS        = 10000;
// ---------------------

WiFiServer server(TCP_PORT);
WiFiClient client;
uint32_t lastWifiAttempt = 0;

// Print a burst of bytes as one hex line, e.g. "TCP->RS232: 06 14 00 04 00 34 11 00 00 5d"
void logBytes(const char* label, const uint8_t* buf, size_t len) {
  Serial.print(label);
  for (size_t i = 0; i < len; i++) {
    Serial.printf(" %02x", buf[i]);
  }
  Serial.println();
}

void selectAntenna() {
  // XIAO ESP32-C6 RF switch: WIFI_ENABLE low enables it, WIFI_ANT_CONFIG picks the antenna
  pinMode(WIFI_ENABLE, OUTPUT);
  digitalWrite(WIFI_ENABLE, LOW);
  pinMode(WIFI_ANT_CONFIG, OUTPUT);
  digitalWrite(WIFI_ANT_CONFIG, USE_EXTERNAL_ANTENNA ? HIGH : LOW);
}

void connectWifi() {
  Serial.printf("Connecting to Wi-Fi \"%s\"...\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  lastWifiAttempt = millis();
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\nESP32-C6 Projector Bridge starting");

  // UART1 on D7 (RX) / D6 (TX). UART0 stays free; USB CDC is the console.
  Serial1.begin(PROJ_BAUD, SERIAL_8N1, D7, D6);
  Serial.printf("Serial1: %ld baud 8N1, RX=D7 (GPIO%d), TX=D6 (GPIO%d)\n", PROJ_BAUD, D7, D6);

  selectAntenna();
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);  // modem sleep adds latency and drops on some managed APs
  Serial.print("MAC address: ");
  Serial.println(WiFi.macAddress());

  connectWifi();
  server.begin();
}

void maintainWifi() {
  static bool wasConnected = false;
  bool connected = WiFi.status() == WL_CONNECTED;

  if (connected && !wasConnected) {
    Serial.print("Wi-Fi connected. IP: ");
    Serial.print(WiFi.localIP());
    Serial.printf("  RSSI: %d dBm  TCP port: %u\n", WiFi.RSSI(), TCP_PORT);
  } else if (!connected && wasConnected) {
    Serial.println("Wi-Fi lost");
  }
  wasConnected = connected;

  if (!connected && millis() - lastWifiAttempt > WIFI_RETRY_MS) {
    WiFi.disconnect();
    connectWifi();
  }
}

void acceptClient() {
  WiFiClient incoming = server.accept();
  if (!incoming) return;

  // A new connection replaces the old one. If CamCtrlServer restarted, its
  // old socket may be half-open; refusing newcomers would lock it out.
  if (client && client.connected()) {
    Serial.println("Replacing previous client");
    client.stop();
  }
  client = incoming;
  client.setNoDelay(true);
  Serial.print("Client connected from ");
  Serial.println(client.remoteIP());
}

void loop() {
  maintainWifi();
  acceptClient();

  uint8_t buf[64];

  // TCP -> projector
  if (client && client.connected()) {
    int n = client.read(buf, sizeof(buf));
    if (n > 0) {
      Serial1.write(buf, n);
      logBytes("TCP->RS232:", buf, n);
    }
  }

  // Projector -> TCP (dropped if nobody is connected, but still logged)
  int avail = Serial1.available();
  if (avail > 0) {
    int n = Serial1.readBytes(buf, min(avail, (int)sizeof(buf)));
    logBytes("RS232->TCP:", buf, n);
    if (client && client.connected()) {
      client.write(buf, n);
    }
  }

  delay(1);
}
