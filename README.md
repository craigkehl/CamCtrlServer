# CamCtrlServer
Camera, Projector, and OBS Studio Controller

<p>This server enables control of a Visca camera system <a href="https://www.mylumens.com/Download/VC-A51S_DataSheet_English(LEI)-2017-0921.pdf">(Lumens VC-A51s)</a>, a ViewSonic LS831WU projector, and <a href="https://github.com/obs-websocket-community-projects/obs-websocket-js/tree/v4">WebSocket control</a> of <a href="https://obsproject.com/">OBS Studio</a>.</p>

Together with the <a href="https://github.com/craigkehl/ts-cam-app">React frontend</a> the user can:

- **Camera**
  - Recall preset positions
  - Variable speed zoom
  - Variable speed pan and tilt
- **Projector**
  - Power on/off
  - Blank (mute video + audio)
  - Switch input source (HDMI / Roku)
  - Query status (power, source, blank)
- **OBS Studio**
  - Recall scenes

## Projector Control

### Active: PJLink (direct IP)

The projector is controlled via PJLink Class 1 over TCP (port 4352) directly to the ViewSonic LS831WU.

| Env var | Default | Description |
|---|---|---|
| `PROJ_PJLINK_HOST` | `192.168.108.11` | Projector IP |
| `PROJ_PJLINK_PORT` | `4352` | PJLink port |

**API endpoints:**

| Method | Path | Description |
|---|---|---|
| GET | `/projector/status` | Power state, active source, blank state |
| GET | `/projector/power/:cmd` | `on`, `off`, `status` |
| GET | `/projector/blank/:cmd` | `on`, `off` |
| GET | `/projector/source/:cmd` | `hdmi`, `roku` |

> Volume and remote key endpoints exist but return 501 — PJLink Class 1 does not support them.

### Future: RS-232 via ESP32 bridge

For features PJLink doesn't reach (volume, calibration, menu navigation), an ESP32-C6 + MAX3232 bridge is available. See the commented options in [`src/util/comport.ts`](src/util/comport.ts) and the Arduino sketch in [`esp32-projector-bridge/`](esp32-projector-bridge/).

The ESP32 is assigned `192.168.108.18` (DHCP reservation by MAC) and listens on TCP port `8888`.

## Hardware Setup

A PC hosts Zoom, OBS, and both the Node.js and React servers. Camera serial communications are extended from the PC to the camera location using an <a href="https://www.amazon.com/gp/product/B08CGXBSTF">RS-232 to RS-422 serial port converter</a>.
