// PJLink Class 1 emulation on TCP 4352, so the existing CamCtrlServer
// (src/util/projPJLinkPort.ts) works unchanged: point PROJ_PJLINK_HOST at this
// board and set PROJ_PJLINK_PASSWORD to PJLINK_PASSWORD from secrets.h.
//
// Connect-per-command, matching projPJLinkPort.ts:
//   board → "PJLINK 1 <random>\r"   (or "PJLINK 0\r" when no password is set)
//   client → "<md5(random+password)>%1POWR 1\r"
//   board → "%1POWR=OK\r", then closes.
// Commands are queued on ProjectorLink like every other input; queries answer
// from the controller's polled state.
#pragma once
#include <WiFi.h>
#include <MD5Builder.h>
#include "config.h"
#include "secrets.h"
#include "ProjectorLink.h"

class PjlinkServer {
public:
  explicit PjlinkServer(ProjectorLink& p) : server(PJLINK_PORT), proj(p) {}

  void begin() { server.begin(); }

  void tick(uint32_t now) {
    if (!client || !client.connected()) {
      NetworkClient incoming = server.accept();
      if (!incoming) return;
      client = incoming;
      client.setNoDelay(true);
      deadline = now + PJLINK_CLIENT_TIMEOUT_MS;
      line = "";
      sendBanner();
      return;
    }

    while (client.available()) {
      char c = (char)client.read();
      if (c == '\r' || c == '\n') {
        if (line.length()) { handleLine(); closeClient(); }
        return;
      }
      if (line.length() < 200) line += c;
    }
    if ((int32_t)(deadline - now) <= 0) closeClient();
  }

private:
  WiFiServer    server;
  NetworkClient client;
  ProjectorLink& proj;
  String   line, challenge;
  uint32_t deadline = 0;

  static bool passwordSet() { return strlen(PJLINK_PASSWORD) > 0; }

  void sendBanner() {
    if (!passwordSet()) { client.print("PJLINK 0\r"); return; }
    char rnd[9];
    snprintf(rnd, sizeof(rnd), "%08lx", (unsigned long)esp_random());
    challenge = rnd;
    client.print("PJLINK 1 " + challenge + "\r");
  }

  void handleLine() {
    String cmd = line;
    if (passwordSet()) {
      MD5Builder md5;
      md5.begin();
      md5.add(challenge + PJLINK_PASSWORD);
      md5.calculate();
      if (cmd.length() < 32 || !cmd.substring(0, 32).equalsIgnoreCase(md5.toString())) {
        client.print("PJLINK ERRA\r");
        Serial.println("[pjlink] auth failed");
        return;
      }
      cmd = cmd.substring(32);
    }
    Serial.printf("[pjlink] %s\n", cmd.c_str());
    client.print(respond(cmd) + "\r");
  }

  // cmd looks like "%1POWR 1" or "%1AVMT ?"
  String respond(const String& cmd) {
    if (cmd.length() < 7 || !cmd.startsWith("%1")) return "%1ERR1";
    String body = cmd.substring(2, 6);
    String arg = cmd.substring(7);
    arg.trim();
    String head = "%1" + body + "=";

    if (body == "POWR") {
      if (arg == "?") return head + powerCode();
      if (arg == "1") { proj.requestPowerOn();  return head + "OK"; }
      if (arg == "0") { proj.requestPowerOff(); return head + "OK"; }
      return head + "ERR2";
    }
    if (body == "AVMT") {
      if (arg == "?") return head + (proj.blank == Tri::Yes ? "31" : "30");
      if (proj.power != Power::On) return head + "ERR3";   // projector ignores blank in standby
      if (arg == "31" || arg == "11") { proj.requestBlank(true);  return head + "OK"; }
      if (arg == "30" || arg == "10") { proj.requestBlank(false); return head + "OK"; }
      return head + "ERR2";
    }
    if (body == "INPT") return head + "ERR3";   // input switching not ported to RS-232 yet
    if (body == "ERST") return head + (proj.linkOk ? "000000" : "000002");
    if (body == "NAME") return head + HOSTNAME;
    if (body == "CLSS") return head + "1";
    return head + "ERR1";
  }

  // PJLink: 0 standby, 1 on, 2 cooling, 3 warming
  String powerCode() {
    if (proj.powerOnPending()) return "3";
    if (proj.power == Power::On) return proj.inTransition() ? "3" : "1";
    return "0";
  }

  void closeClient() {
    client.flush();
    client.stop();
    line = "";
  }
};
