// Copy this file to secrets.h (gitignored) and fill in real values.
#pragma once

#define WIFI_SSID     "your-ssid"
#define WIFI_PASSWORD "your-password"

// Required on every POST to the controller (header: X-Api-Key).
// Used by the phone page and any HTTP client. Use a long random string.
#define API_KEY       "change-me"

// PJLink password CamCtrlServer uses (its PROJ_PJLINK_PASSWORD). 32 chars max.
// Leave empty ("") to disable PJLink authentication (not recommended on a public network).
#define PJLINK_PASSWORD "change-me"

// Fallback hotspot password (8+ characters), used only when Wi-Fi is unavailable.
#define AP_PASSWORD   "change-me-too"
