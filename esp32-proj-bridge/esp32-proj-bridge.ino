/**
 * ESP32 WiFi-to-Serial Bridge for Projector Control
 *
 * Hardware:
 *   - ESP32 DevKit (KeeYees / ESP-WROOM-32 with CP2102)
 *   - "Ultra Compact RS232 to TTL Converter with Female DB9" (SP3232E)
 *     plugged into the projector's DB9 serial port
 *
 * Wiring:
 *   ESP32 3.3V      -> SP3232E VCC   (sets logic level to 3.3V)
 *   ESP32 GND       -> SP3232E GND
 *   ESP32 GPIO17    -> SP3232E RX    ("Logic In"  pin)
 *   ESP32 GPIO16    <- SP3232E TX    ("Logic Out" pin)
 *   SP3232E DB9 female connector plugs directly into projector
 *
 * Setup:
 *   1. Install ESP32 board support in Arduino IDE:
 *      File > Preferences > Additional Boards Manager URLs:
 *      https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
 *      Then: Tools > Board > Boards Manager > search "esp32" > install
 *   2. Select board: Tools > Board > ESP32 Arduino > "ESP32 Dev Module"
 *   3. Fill in WIFI_SSID and WIFI_PASSWORD below
 *   4. Upload, then open Serial Monitor at 115200 baud to find the assigned IP
 *   5. Set PROJ_TCP_HOST to that IP in the server's .env file
 */

#include <WiFi.h>
#include "esp_wifi.h"
#include <stdint.h>

// --- Configuration (edit these) ---
const char*    WIFI_SSID     = "Liahona";
const char*    WIFI_PASSWORD = "alma3738";
const uint16_t TCP_PORT      = 8888;

// UART2 pins
const int  UART_RX_PIN = 16;
const int  UART_TX_PIN = 17;
const long PROJ_BAUD   = 9600;
// -----------------------------------

WiFiServer server(TCP_PORT);
WiFiClient client;

void setup() {
  Serial.begin(115200);
  delay(100);

  // Open projector serial on UART2
  Serial2.begin(PROJ_BAUD, SERIAL_8N1, UART_RX_PIN, UART_TX_PIN);

  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.disconnect(true);
  delay(200);
  esp_wifi_set_ps(WIFI_PS_NONE);

  // Disable PMF — can trigger AUTH_EXPIRE on some managed APs
  wifi_config_t conf;
  esp_wifi_get_config(WIFI_IF_STA, &conf);
  conf.sta.threshold.authmode = WIFI_AUTH_WPA2_PSK;
  conf.sta.pmf_cfg.capable    = false;
  conf.sta.pmf_cfg.required   = false;
  esp_wifi_set_config(WIFI_IF_STA, &conf);

  // Scan for all APs with matching SSID and pick the strongest 2.4GHz one.
  // Multi-AP environments (like managed church networks) often have 5GHz APs
  // with the same SSID — ESP32 is 2.4GHz only and AUTH_EXPIRE if it tries 5GHz.
  Serial.println("Scanning for best 2.4GHz AP...");
  int numNetworks = WiFi.scanNetworks();
  int   bestRSSI  = -999;
  uint8_t bestBSSID[6] = {0};
  int   bestChannel = 0;
  bool  foundAP   = false;

  for (int i = 0; i < numNetworks; i++) {
    if (WiFi.SSID(i) == WIFI_SSID) {
      int ch = WiFi.channel(i);
      if (ch >= 1 && ch <= 14) {  // 2.4GHz channels only
        int rssi = WiFi.RSSI(i);
        Serial.printf("  Found 2.4GHz AP ch=%d RSSI=%d BSSID=%s\n", ch, rssi, WiFi.BSSIDstr(i).c_str());
        if (rssi > bestRSSI) {
          bestRSSI    = rssi;
          bestChannel = ch;
          memcpy(bestBSSID, WiFi.BSSID(i), 6);
          foundAP = true;
        }
      }
    }
  }
  WiFi.scanDelete();

  // Pass connect=false so WiFi.begin() sets credentials but doesn't connect yet —
  // this lets us apply PMF/auth config AFTER WiFi.begin() sets its own config,
  // preventing our settings from being overwritten
  if (foundAP) {
    Serial.printf("Connecting to BSSID %02x:%02x:%02x:%02x:%02x:%02x ch=%d RSSI=%d\n",
      bestBSSID[0], bestBSSID[1], bestBSSID[2], bestBSSID[3], bestBSSID[4], bestBSSID[5],
      bestChannel, bestRSSI);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD, bestChannel, bestBSSID, false);
  } else {
    Serial.println("No 2.4GHz AP found, trying without BSSID hint...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD, 0, nullptr, false);
  }

  // Now override config AFTER WiFi.begin() has written its own — disable PMF and
  // force 802.11b/g only (no 802.11n) for maximum compatibility with managed APs
  esp_wifi_get_config(WIFI_IF_STA, &conf);
  conf.sta.threshold.authmode = WIFI_AUTH_WPA2_PSK;
  conf.sta.pmf_cfg.capable    = false;
  conf.sta.pmf_cfg.required   = false;
  esp_wifi_set_config(WIFI_IF_STA, &conf);
  esp_wifi_set_protocol(WIFI_IF_STA, WIFI_PROTOCOL_11B | WIFI_PROTOCOL_11G);
  WiFi.setAutoReconnect(false);
  esp_wifi_connect();

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (++attempts > 120) {
      Serial.println("\nFailed to connect. Restarting...");
      ESP.restart();
    }
    // Manually retry every 10 seconds since auto-reconnect is disabled
    if (attempts % 20 == 0) {
      Serial.println("\nRetrying...");
      esp_wifi_disconnect();
      delay(1000);
      esp_wifi_connect();
    }
  }

  Serial.println();
  Serial.print("Connected! IP address: ");
  Serial.println(WiFi.localIP());

  server.begin();
  Serial.printf("TCP server listening on port %d\n", TCP_PORT);
}

void loop() {
  // Accept new connection if none active
  if (!client || !client.connected()) {
    WiFiClient incoming = server.available();
    if (incoming) {
      client = incoming;
      Serial.print("Server connected from: ");
      Serial.println(client.remoteIP());
    }
  }

  // Forward TCP -> Serial2 (server commands to projector)
  if (client && client.connected() && client.available()) {
    while (client.available()) {
      Serial2.write((uint8_t)client.read());
    }
  }

  // Forward Serial2 -> TCP (projector responses back to server)
  if (Serial2.available()) {
    if (client && client.connected()) {
      while (Serial2.available()) {
        client.write((uint8_t)Serial2.read());
      }
    } else {
      // No client — drain and discard
      while (Serial2.available()) Serial2.read();
    }
  }

  // Clean up disconnected client
  if (client && !client.connected()) {
    Serial.println("Server disconnected.");
    client.stop();
  }
}
