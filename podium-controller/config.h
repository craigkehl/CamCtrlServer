// Podium controller configuration. Not secret; secrets live in secrets.h.
#pragma once
#include <Arduino.h>

// ---------------------------------------------------------------------------
// Pins (XIAO ESP32-C6). Always use the D-constants, never raw GPIO numbers.
// ---------------------------------------------------------------------------
// HiLetgo MAX3232 modules label TTL pins from the MCU side: D6 → TXD, D7 → RXD.
#define PIN_PROJ_TX     D6
#define PIN_PROJ_RX     D7

// Buttons wire to GND (INPUT_PULLUP). Unconnected pins read "not pressed".
#define PIN_BTN_ON      D0
#define PIN_BTN_OFF     D1
#define PIN_BTN_BLANK   D2
#define PIN_BTN_PRESET  D3

// SK6812/WS2812 chain data (330 Ω series resistor). Pixel order below.
#define PIN_LEDS        D10
#define LED_COUNT       3
#define LED_POWER       0   // beside ON/OFF
#define LED_BLANK       1
#define LED_PRESET      2
#define LED_BRIGHTNESS  40  // 0–255; pixels are blinding at full power

// ---------------------------------------------------------------------------
// Projector link (ViewSonic LS831WU RS-232)
// ---------------------------------------------------------------------------
const uint32_t PROJ_BAUD              = 9600;   // must match the projector menu
const uint32_t REPLY_TIMEOUT_MS       = 500;    // bench replies arrive in ~15 ms
const uint32_t INTER_COMMAND_GAP_MS   = 50;
const uint8_t  LINK_FAILS_BEFORE_DOWN = 2;      // consecutive timeouts → link "no-response"

const uint32_t POLL_IDLE_MS           = 5000;   // background status poll
const uint32_t POLL_FAST_MS           = 1000;   // after a command…
const uint32_t POLL_FAST_WINDOW_MS    = 10000;  // …for this long

// Laser projector: no lamp cool-down is reported over RS-232, but the projector
// may still refuse power-on (reply 00) for a while after shutting down. Instead of
// guessing that window, keep retrying power-on until it's accepted or this expires.
const uint32_t POWER_ON_RETRY_MS      = 5000;
const uint32_t POWER_ON_WANTED_MS     = 120000;

// Cosmetic only: amber blink after a power change while the image settles.
const uint32_t POWER_TRANSITION_MS    = 15000;

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------
const uint32_t DEBOUNCE_MS            = 30;
const uint32_t LONG_PRESS_MS          = 2000;

// ---------------------------------------------------------------------------
// Network
// ---------------------------------------------------------------------------
// Default: DHCP. Reserve an address for this board's MAC (printed on boot and
// shown at /api/status) in the Meraki dashboard, so the IP never changes.
#define HOSTNAME              "podium-projector"   // also mDNS: podium-projector.local

// Optional: fixed IP set on the board itself. Only use an address the network
// admin has set aside; a DHCP reservation is preferred.
const bool      USE_STATIC_IP = false;
const IPAddress STATIC_IP     (192, 168, 108, 18);
const IPAddress STATIC_GATEWAY(192, 168, 108, 1);
const IPAddress STATIC_SUBNET (255, 255, 252, 0);
const IPAddress STATIC_DNS    (192, 168, 108, 1);

const bool     USE_EXTERNAL_ANTENNA  = false;   // compare RSSI both ways on site
const uint32_t WIFI_RETRY_MS         = 10000;
const uint32_t FALLBACK_AP_AFTER_MS  = 120000;  // no Wi-Fi for this long → own hotspot
#define FALLBACK_AP_SSID      "Projector-Ctrl"     // password: AP_PASSWORD in secrets.h

const uint16_t HTTP_PORT             = 80;
const uint16_t PJLINK_PORT           = 4352;    // CamCtrlServer talks PJLink here (see PjlinkServer.h)
const uint32_t PJLINK_CLIENT_TIMEOUT_MS = 3000;
const uint8_t  AUTH_FAILS_PER_MINUTE = 5;       // then 429 for the rest of the minute

const uint32_t WATCHDOG_TIMEOUT_MS   = 8000;

#define FIRMWARE_VERSION "podium-controller 0.1.0"
