// Wi-Fi station with reconnect, mDNS, and a fallback hotspot.
// IP assignment: DHCP by default; reserve an address for this board's MAC on the
// DHCP server (Meraki). USE_STATIC_IP in config.h is the on-board alternative.
#pragma once
#include <WiFi.h>
#include <ESPmDNS.h>
#include "config.h"
#include "secrets.h"

class Net {
public:
  void begin() {
    // XIAO ESP32-C6 RF switch: WIFI_ENABLE low enables it, WIFI_ANT_CONFIG picks the antenna
    pinMode(WIFI_ENABLE, OUTPUT);
    digitalWrite(WIFI_ENABLE, LOW);
    pinMode(WIFI_ANT_CONFIG, OUTPUT);
    digitalWrite(WIFI_ANT_CONFIG, USE_EXTERNAL_ANTENNA ? HIGH : LOW);

    WiFi.persistent(false);
    WiFi.mode(WIFI_STA);
    WiFi.setHostname(HOSTNAME);
    WiFi.setSleep(false);
    if (USE_STATIC_IP) {
      WiFi.config(STATIC_IP, STATIC_GATEWAY, STATIC_SUBNET, STATIC_DNS);
    }
    Serial.printf("MAC address: %s  (reserve an IP for this MAC on the DHCP server)\n",
                  WiFi.macAddress().c_str());
    connect();
    bootedAt = millis();
  }

  void tick(uint32_t now) {
    bool up = WiFi.status() == WL_CONNECTED;

    if (up && !wasUp) {
      lastUp = now;
      Serial.printf("Wi-Fi connected. IP %s  RSSI %d dBm  %s\n",
                    WiFi.localIP().toString().c_str(), WiFi.RSSI(),
                    USE_STATIC_IP ? "(static)" : "(DHCP)");
      if (!mdnsStarted && MDNS.begin(HOSTNAME)) {
        MDNS.addService("http", "tcp", HTTP_PORT);
        mdnsStarted = true;
      }
    } else if (!up && wasUp) {
      Serial.println("Wi-Fi lost");
    }
    wasUp = up;
    if (up) lastUp = now;

    if (!up && now - lastAttempt >= WIFI_RETRY_MS) connect();

    // Fallback hotspot after a long outage; drop it once Wi-Fi has been back a while.
    uint32_t downSince = lastUp ? lastUp : bootedAt;
    if (!apOn && !up && now - downSince >= FALLBACK_AP_AFTER_MS) startAp();
    if (apOn && up && now - lastApCheck >= 30000) {
      lastApCheck = now;
      stopAp();
    }
  }

  bool connected() const { return WiFi.status() == WL_CONNECTED; }
  bool apActive() const { return apOn; }

private:
  bool wasUp = false, apOn = false, mdnsStarted = false;
  uint32_t lastAttempt = 0, lastUp = 0, bootedAt = 0, lastApCheck = 0;

  void connect() {
    lastAttempt = millis();
    Serial.printf("Connecting to Wi-Fi \"%s\"...\n", WIFI_SSID);
    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  }

  void startAp() {
    WiFi.mode(WIFI_AP_STA);   // keep retrying the main network while the hotspot runs
    apOn = WiFi.softAP(FALLBACK_AP_SSID, AP_PASSWORD);
    Serial.printf("Fallback hotspot %s: %s at %s\n", FALLBACK_AP_SSID,
                  apOn ? "on" : "FAILED", WiFi.softAPIP().toString().c_str());
  }

  void stopAp() {
    WiFi.softAPdisconnect(true);
    WiFi.mode(WIFI_STA);
    apOn = false;
    Serial.println("Wi-Fi back; fallback hotspot off");
  }
};
