// Debounced push buttons to GND with short-press and long-press events.
// Long press fires once, while still held, at LONG_PRESS_MS.
#pragma once
#include <Arduino.h>
#include "config.h"

enum class Press : uint8_t { None, Short, Long };

class Button {
public:
  explicit Button(uint8_t pin) : pin(pin) {}

  void begin() { pinMode(pin, INPUT_PULLUP); }

  Press poll(uint32_t now) {
    bool raw = digitalRead(pin) == LOW;
    if (raw != lastRaw) { lastRaw = raw; changedAt = now; }
    if (now - changedAt < DEBOUNCE_MS || raw == down) {
      if (down && !longFired && now - downAt >= LONG_PRESS_MS) {
        longFired = true;
        return Press::Long;
      }
      return Press::None;
    }
    down = raw;
    if (down) { downAt = now; longFired = false; return Press::None; }
    return longFired ? Press::None : Press::Short;   // released before long press
  }

private:
  uint8_t  pin;
  bool     lastRaw = false, down = false, longFired = false;
  uint32_t changedAt = 0, downAt = 0;
};
