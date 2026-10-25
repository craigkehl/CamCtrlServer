/*
 * Podium controller for the ViewSonic LS831WU (Phases 1–2 of docs/projector-controller-plan.md)
 * Hardware: Seeed XIAO ESP32-C6 + HiLetgo MAX3232 module (RS-232) + buttons + SK6812 pixels
 *
 * The controller is the only thing that talks to the projector. Buttons work with no
 * network at all. Phones use the HTTP API (WebApi.h); CamCtrlServer uses PJLink (PjlinkServer.h).
 *
 * Setup:
 *   1. Copy secrets.example.h to secrets.h and fill in Wi-Fi, API key, hotspot password
 *   2. Board: XIAO_ESP32C6 (esp32 core 3.x), USB CDC On Boot: Enabled
 *   3. Upload; Serial Monitor at 115200 shows the MAC. Reserve an IP for that MAC
 *      on the DHCP server (Meraki).
 *   4. CamCtrlServer .env: PROJ_PJLINK_HOST=<that IP>, PROJ_PJLINK_PASSWORD=<PJLINK_PASSWORD>.
 *      No server code changes: this board answers PJLink on port 4352.
 */
#include <esp_task_wdt.h>
#include "config.h"
#include "secrets.h"
#include "ProjectorLink.h"
#include "Scenes.h"
#include "Buttons.h"
#include "StatusLeds.h"
#include "Net.h"
#include "WebApi.h"
#include "PjlinkServer.h"

ProjectorLink projector;
Scenes        scenes;
StatusLeds    leds;
Net           net;
WebApi        web(projector, scenes, net);
PjlinkServer  pjlink(projector);

Button btnOn(PIN_BTN_ON), btnOff(PIN_BTN_OFF), btnBlank(PIN_BTN_BLANK), btnPreset(PIN_BTN_PRESET);

void startWatchdog() {
  esp_task_wdt_config_t cfg = {
    .timeout_ms = WATCHDOG_TIMEOUT_MS,
    .idle_core_mask = 0,
    .trigger_panic = true,   // reboot; buttons and LEDs are back within ~2 s
  };
  if (esp_task_wdt_init(&cfg) == ESP_ERR_INVALID_STATE) esp_task_wdt_reconfigure(&cfg);
  esp_task_wdt_add(NULL);
}

void handleButtons(uint32_t now) {
  switch (btnOn.poll(now)) {
    case Press::Short: case Press::Long: projector.requestPowerOn(); leds.flashAck(); break;
    default: break;
  }
  switch (btnOff.poll(now)) {
    case Press::Short: leds.flashHoldHint(); break;               // must hold to turn off
    case Press::Long:  projector.requestPowerOff(); leds.flashAck(); break;
    default: break;
  }
  if (btnBlank.poll(now) == Press::Short) { projector.requestBlankToggle(); leds.flashAck(); }
  switch (btnPreset.poll(now)) {
    case Press::Short: scenes.toggle(); leds.flashAck(); break;
    case Press::Long:  scenes.normal(); leds.flashAck(); break;   // guaranteed "back to normal"
    default: break;
  }
}

void setup() {
  Serial.begin(115200);
  // Never block on log output. With USB attached to a computer that isn't reading
  // the port, each print otherwise waits for a timeout, stalling the whole loop
  // for seconds (found 2026-10-24: PJLink requests timed out).
  Serial.setTxTimeoutMs(0);
  delay(500);
  Serial.printf("\n%s starting\n", FIRMWARE_VERSION);

  btnOn.begin(); btnOff.begin(); btnBlank.begin(); btnPreset.begin();
  if (!leds.begin()) Serial.println("LED chain init failed (continuing without LEDs)");
  projector.begin();   // buttons + projector work before Wi-Fi is up
  net.begin();
  web.begin();
  pjlink.begin();
  startWatchdog();
}

void loop() {
  uint32_t now = millis();
  handleButtons(now);
  projector.tick();
  net.tick(now);
  web.tick();
  pjlink.tick(now);
  leds.render(projector, scenes, now);
  esp_task_wdt_reset();
  delay(1);
}
