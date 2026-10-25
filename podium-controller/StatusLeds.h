// SK6812/WS2812 pixel chain driven by the ESP32 RMT peripheral (no library needed;
// same timing the core uses for its on-board RGB LED).
#pragma once
#include <Arduino.h>
#include "config.h"
#include "ProjectorLink.h"
#include "Scenes.h"

struct Rgb { uint8_t r, g, b; };

class StatusLeds {
public:
  bool begin() {
    ok = rmtInit(PIN_LEDS, RMT_TX_MODE, RMT_MEM_NUM_BLOCKS_1, 10000000);   // 100 ns ticks
    return ok;
  }

  void flashAck() { flashUntil = millis() + 120; }          // white blink: press accepted
  void flashHoldHint() { hintUntil = millis() + 1500; }      // OFF tapped: "hold to turn off"

  void render(const ProjectorLink& p, const Scenes& s, uint32_t now) {
    if (!ok || now - lastRender < 40) return;
    lastRender = now;

    bool slow = (now / 500) % 2;   // 1 Hz
    bool fast = (now / 125) % 2;   // 4 Hz
    Rgb px[LED_COUNT];

    // Power pixel
    if (!p.linkOk)                              px[LED_POWER] = fast ? Rgb{255, 0, 0} : Rgb{0, 0, 0};
    else if (p.powerOnPending() || p.inTransition()) px[LED_POWER] = slow ? Rgb{255, 120, 0} : Rgb{0, 0, 0};
    else if (p.power == Power::On)              px[LED_POWER] = {0, 255, 0};
    else if (p.power == Power::Off)             px[LED_POWER] = {60, 0, 0};
    else                                        px[LED_POWER] = {0, 0, 0};
    if ((int32_t)(hintUntil - now) > 0)         px[LED_POWER] = fast ? Rgb{255, 0, 0} : Rgb{60, 0, 0};

    // Blank and preset pixels
    px[LED_BLANK]  = (p.blank == Tri::Yes) ? Rgb{0, 0, 255} : Rgb{0, 0, 0};
    px[LED_PRESET] = s.isNormal() ? Rgb{0, 0, 0} : Rgb{160, 0, 255};

    if ((int32_t)(flashUntil - now) > 0) {
      for (auto& c : px) c = {255, 255, 255};
    }
    write(px);
  }

private:
  bool ok = false;
  uint32_t lastRender = 0, flashUntil = 0, hintUntil = 0;

  void write(const Rgb* px) {
    rmt_data_t bits[LED_COUNT * 24];
    size_t i = 0;
    for (uint8_t n = 0; n < LED_COUNT; n++) {
      uint8_t grb[3] = { scale(px[n].g), scale(px[n].r), scale(px[n].b) };   // pixels expect GRB
      for (uint8_t c = 0; c < 3; c++) {
        for (int8_t b = 7; b >= 0; b--) {
          bool one = grb[c] & (1 << b);
          bits[i].level0 = 1; bits[i].duration0 = one ? 8 : 4;
          bits[i].level1 = 0; bits[i].duration1 = one ? 4 : 8;
          i++;
        }
      }
    }
    rmtWrite(PIN_LEDS, bits, i, RMT_WAIT_FOR_EVER);
  }

  static uint8_t scale(uint8_t v) { return (uint16_t)v * LED_BRIGHTNESS / 255; }
};
