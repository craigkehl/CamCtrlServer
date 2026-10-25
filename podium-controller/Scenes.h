// Room scenes. PRESET button and /api/scene both go through here.
// Lighting is a stub until Phase 5 (Zigbee switches via a second C6 on Serial0).
#pragma once
#include <Arduino.h>

struct Scene {
  const char* name;
  uint8_t lightsMask;    // which of the 7 circuits this scene sets
  uint8_t lightsValues;  // on/off for those circuits (bit n = circuit n+1)
};

// Edit in Phase 5 once circuits are inventoried. "normal" must stay first.
static const Scene SCENES[] = {
  { "normal",       0x7F, 0x7F },   // all 7 circuits on
  { "presentation", 0x7F, 0x7C },   // placeholder: front two circuits off
};
static const uint8_t SCENE_COUNT = sizeof(SCENES) / sizeof(SCENES[0]);

class LightingDriver {
public:
  bool installed() const { return false; }
  void setCircuits(uint8_t mask, uint8_t values) {
    Serial.printf("[lights] (not installed) would set mask=0x%02x values=0x%02x\n", mask, values);
  }
};

class Scenes {
public:
  uint8_t current = 0;   // index into SCENES

  const char* currentName() const { return SCENES[current].name; }
  bool isNormal() const { return current == 0; }

  bool apply(const char* name) {
    for (uint8_t i = 0; i < SCENE_COUNT; i++) {
      if (strcmp(SCENES[i].name, name) == 0) { applyIndex(i); return true; }
    }
    return false;
  }

  void toggle() { applyIndex(isNormal() ? 1 : 0); }
  void normal() { applyIndex(0); }

  LightingDriver lighting;

private:
  void applyIndex(uint8_t i) {
    current = i;
    lighting.setCircuits(SCENES[i].lightsMask, SCENES[i].lightsValues);
    Serial.printf("[scene] %s\n", SCENES[i].name);
  }
};
