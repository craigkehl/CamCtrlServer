// HTTP API. Handlers only read state or enqueue intents; they never touch the UART.
//
//   GET  /                     phone control page
//   GET  /api/status           JSON state
//   POST /api/power/{on|off}
//   POST /api/blank/{on|off|toggle}
//   POST /api/scene/{name|toggle}
//
// POSTs require header X-Api-Key. Actions return 202: "queued", not "done";
// clients read the outcome from /api/status.
#pragma once
#include <WebServer.h>
#include <uri/UriBraces.h>
#include "config.h"
#include "secrets.h"
#include "ProjectorLink.h"
#include "Scenes.h"
#include "Net.h"
#include "PhonePage.h"

class WebApi {
public:
  WebApi(ProjectorLink& p, Scenes& s, Net& n) : server(HTTP_PORT), proj(p), scenes(s), net(n) {}

  void begin() {
    static const char* headers[] = {"X-Api-Key"};
    server.collectHeaders(headers, 1);

    server.on("/", HTTP_GET, [this] { server.send_P(200, "text/html", PHONE_PAGE); });
    server.on("/api/status", HTTP_GET, [this] { sendStatus(200); });
    server.on(UriBraces("/api/power/{}"), HTTP_POST, [this] { handlePower(); });
    server.on(UriBraces("/api/blank/{}"), HTTP_POST, [this] { handleBlank(); });
    server.on(UriBraces("/api/scene/{}"), HTTP_POST, [this] { handleScene(); });
    server.onNotFound([this] { server.send(404, "application/json", "{\"error\":\"not found\"}"); });
    server.begin();
  }

  void tick() { server.handleClient(); }

private:
  WebServer server;
  ProjectorLink& proj;
  Scenes& scenes;
  Net& net;
  uint32_t authWindowStart = 0;
  uint8_t authFails = 0;

  bool authorized() {
    uint32_t now = millis();
    if (now - authWindowStart >= 60000) { authWindowStart = now; authFails = 0; }
    if (authFails >= AUTH_FAILS_PER_MINUTE) {
      server.send(429, "application/json", "{\"error\":\"too many attempts, wait a minute\"}");
      return false;
    }
    if (constantTimeEquals(server.header("X-Api-Key"), API_KEY)) return true;
    authFails++;
    server.send(401, "application/json", "{\"error\":\"missing or wrong X-Api-Key\"}");
    return false;
  }

  static bool constantTimeEquals(const String& a, const char* b) {
    size_t lb = strlen(b);
    uint8_t diff = a.length() != lb;
    for (size_t i = 0; i < lb; i++) diff |= (i < a.length() ? a[i] : 0) ^ b[i];
    return diff == 0;
  }

  void handlePower() {
    if (!authorized()) return;
    String arg = server.pathArg(0);
    if (arg == "on") proj.requestPowerOn();
    else if (arg == "off") proj.requestPowerOff();
    else return badRequest("power: use on or off");
    sendStatus(202);
  }

  void handleBlank() {
    if (!authorized()) return;
    String arg = server.pathArg(0);
    if (arg == "on") proj.requestBlank(true);
    else if (arg == "off") proj.requestBlank(false);
    else if (arg == "toggle") proj.requestBlankToggle();
    else return badRequest("blank: use on, off, or toggle");
    sendStatus(202);
  }

  void handleScene() {
    if (!authorized()) return;
    String arg = server.pathArg(0);
    if (arg == "toggle") scenes.toggle();
    else if (!scenes.apply(arg.c_str())) return badRequest("unknown scene");
    sendStatus(202);
  }

  void badRequest(const char* msg) {
    server.send(400, "application/json", String("{\"error\":\"") + msg + "\"}");
  }

  void sendStatus(int code) {
    const char* power = proj.powerOnPending() ? "starting"
                      : proj.power == Power::On ? "on"
                      : proj.power == Power::Off ? "off" : "unknown";
    const char* blank = proj.blank == Tri::Yes ? "true" : proj.blank == Tri::No ? "false" : "null";
    char buf[512];
    snprintf(buf, sizeof(buf),
      "{\"power\":\"%s\",\"blank\":%s,\"transition\":%s,\"scene\":\"%s\","
      "\"link\":\"%s\",\"lastReplyAgoMs\":%lu,\"lighting\":\"%s\","
      "\"timeouts\":%lu,\"refusals\":%lu,\"badFrames\":%lu,"
      "\"wifiRssi\":%d,\"ip\":\"%s\",\"mac\":\"%s\",\"fallbackAp\":%s,"
      "\"uptimeS\":%lu,\"fw\":\"%s\"}",
      power, blank, proj.inTransition() ? "true" : "false", scenes.currentName(),
      proj.linkOk ? "ok" : "no-response",
      (unsigned long)(proj.lastReplyMs ? millis() - proj.lastReplyMs : 0),
      scenes.lighting.installed() ? "installed" : "not-installed",
      (unsigned long)proj.timeouts, (unsigned long)proj.refusals, (unsigned long)proj.badFrames,
      net.connected() ? WiFi.RSSI() : 0, WiFi.localIP().toString().c_str(),
      WiFi.macAddress().c_str(), net.apActive() ? "true" : "false",
      (unsigned long)(millis() / 1000), FIRMWARE_VERSION);
    server.send(code, "application/json", buf);
  }
};
