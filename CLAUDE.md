# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CamCtrlServer is a Node.js/TypeScript Express server that provides HTTP API endpoints to control:
- **PTZ Camera** via Visca protocol. Two cameras are in scope:
  - **Clear Touch RL500** (SKU `CTS-RL500-4K20`, a rebrand of the ValueHD VHD-VX752A) — the **primary/current** camera, controlled via **Visca over IP** (UDP). This is what the live code path drives.
  - **Lumens VC-A51s** — the owner's **previous** camera, still on hand and still intended for use as a **second camera**, controlled via **Visca over serial (RS-232/RS-422)**. The serial/RS-422 scaffolding is deliberately retained for this purpose — see [Serial Port Details](#serial-port-details).
- **Projector** (ViewSonic LS831WU) via **PJLink** (TCP 4352). In production the PJLink endpoint is the **podium controller** (an ESP32-C6 at `192.168.108.3`) that translates PJLink to RS-232; the projector's own network port is unplugged (defective). See [Projector](#projector-pjlink--podium-controller).
- **Video switcher** (Extron IN1808) via SIS over Telnet: `src/util/extronPort.ts`, routes under `/api/switcher`
- **OBS Studio** via WebSocket (obs-websocket-js v5)

**Note**: Look up hardware capabilities under the *ValueHD VHD-VX752A* model number, not the Clear Touch name. The Visca command set in `src/Models/PTZCamera.ts` is generic Sony Visca and works against both cameras — only the transport differs.

Works in tandem with a separate React frontend: https://github.com/craigkehl/ts-cam-app

## Build & Development Commands

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npx tsc

# Run in development mode (uses nodemon)
npm run dev

# Run production build
npm start
# or
node dist/app.js
```

**Note**: There are no tests configured (`npm test` will fail with "no test specified").

## Architecture

### Three-Layer Pattern

The codebase follows a Model-Controller-Route pattern for each subsystem:

```
src/
├── Models/          # Protocol command builders (Visca, OBS, Projector)
├── Controllers/     # HTTP request handlers, writes to serial/websocket
├── routes/          # Express route definitions
├── util/            # Transports: comport.ts (projector), projPJLinkPort.ts, extronPort.ts, TCP wrappers
├── tools/           # Standalone dev tools (projSerialProbe.ts), not used by the server
└── data/            # Static data (camera presets)
```

### Request Flow

1. HTTP request hits a route (e.g., `GET /api/preset/:presetId`)
2. Route calls controller function (e.g., `recallPresetId`)
3. Controller uses Model to build protocol command (e.g., `ptzCamera.presetGet()`)
4. Controller writes command to appropriate communication channel:
   - Camera: UDP datagram via `dgram` (Visca over IP) — see `sendUdpCommand()` in `src/Controllers/ptzCamera.ts`
   - Projector: `projPort.write()` / `writeAndRead()`, PJLink text commands, connect-per-command (`src/util/projPJLinkPort.ts`)
   - OBS: `obs.call()` (WebSocket)

### Key Subsystems

**PTZ Camera (Visca Protocol)**
- Model: `src/Models/PTZCamera.ts` - Builds Visca byte arrays for camera control
- Visca commands are hex byte arrays (e.g., `[0x81, 0x01, 0x04, 0x3f, 0x02, presetId, 0xff]`)
- Controls: presets, zoom, focus, pan/tilt with variable speed
- The Model is **transport-agnostic** — it returns a plain byte array. The Controller decides how to deliver it.
- **Current transport (Clear Touch RL500): Visca over IP.** `src/Controllers/ptzCamera.ts` opens a `dgram` UDP socket per command and prepends the 8-byte Visca-over-IP header (payload type `0x0100`, payload length, incrementing sequence number) before the Visca bytes. Default target `192.168.108.200:52381`, overridden by `CAM_IP_ADDRESS` / `CAM_PORT`.
- **Second camera (Lumens VC-A51s): Visca over serial (RS-232/RS-422).** Not wired into the live request path today; the serial approach and pinouts are preserved under `esp32-camera-test/`. See [Serial Port Details](#serial-port-details).

**OBS Studio (WebSocket)**
- Model: `src/Models/Obs.ts` - Wraps obs-websocket-js client
- Connects on startup to OBS WebSocket server
- Handles scene changes and listens for OBS events
- Uses async/await for WebSocket calls

### Projector (PJLink → podium controller)

```
ts_cam_app2 ──HTTP /api/proj/*──► CamCtrlServer ──PJLink :4352──► podium controller (XIAO ESP32-C6, 192.168.108.3) ──RS-232──► LS831WU
```

- Server side: `src/Models/ProjectorPJLink.ts` (text commands) + `src/util/projPJLinkPort.ts` (connect-per-command, MD5 auth). `comport.ts` selects it.
- **The server doesn't know the controller exists**: the controller emulates a PJLink projector (`podium-controller/PjlinkServer.h`). Pointing `PROJ_PJLINK_HOST` back at a real projector needs no code change.
- The controller **requires a PJLink password**. If `PROJ_PJLINK_PASSWORD` is missing or wrong, it replies `PJLINK ERRA`, and `getStatus` misleadingly reports `"power":"off"` (it treats unparseable replies as off).
- PJLink `INPT` returns `ERR3` from the controller (input switching not ported to RS-232 yet), so status shows `source: "unknown"`.
- `src/Models/Projector.ts` is the **RS-232 byte command table**. The server no longer uses it, but it's the reference the firmware's `ProjectorLink.h` was ported from.
- `comport.ts` keeps two commented-out alternatives: Option A, the raw ESP32 bridge (`projTcpPort.ts`, Phase 0 test firmware), and Option B, projector direct TCP (`projDirectPort.ts`, port 5000 refused).
- `HAS_PROJECTOR` appears in older `.env` templates but **is not read by the code**.

### Podium controller firmware (`podium-controller/`)

Arduino sketch for the Seeed XIAO ESP32-C6 + HiLetgo MAX3232 module. Design and decisions: `docs/projector-controller-plan.md`. Bench results and wiring: `docs/phase-0-bench-test.md`.

- Board `esp32:esp32:XIAO_ESP32C6`, **USB CDC On Boot: Enabled**. Compile/upload with the IDE's bundled `arduino-cli` (`/Applications/Arduino IDE.app/Contents/Resources/app/lib/backend/resources/arduino-cli`).
- Ports: **4352** PJLink (server), **80** phone page + JSON API (`GET /api/status`; POSTs need `X-Api-Key`).
- `ProjectorLink.h` is the **only** code that touches the UART: one command in flight, replies framed by length (`6 + len`) with checksum. Reply types: `05` status data, `03` accepted, `00` refused (usually "already in that state"; not a link error).
- `power-status` is binary (`01`/`00`) and flips immediately; the laser projector reports no warming/cooling. Power-on is retried for up to 2 min if refused, instead of fixed timers.
- Wiring: **D6 → module TXD, D7 → module RXD** (HiLetgo labels are MCU-side), 3V3 → VCC (never 5V), straight-through DB9 to the projector, 9600 baud.
- IP: DHCP with a Meraki reservation for MAC `58:E6:C5:11:CD:A0` at `.3`. `USE_STATIC_IP` in `config.h` is the fallback.
- `Serial.setTxTimeoutMs(0)` must stay: without it, logging blocks for seconds when USB is attached to a computer that isn't reading the port.
- Debug without the IDE: `node dist/tools/projSerialProbe.js <power-status|blank-on|…> <host>` talks to the Phase 0 bridge sketch (`esp32-projector-bridge/`, TCP 8888), not to the controller.

### Secrets

Every ESP32 sketch reads credentials from a **gitignored `secrets.h`** (template: `secrets.example.h` beside it). Never hard-code Wi-Fi passwords, API keys, or PJLink passwords in sketches or docs. Server secrets stay in `.env` (also gitignored).

## Configuration

Environment configuration is platform-specific:
- **Windows**: Copy `.env.windows` to `.env`
- **macOS**: Copy `.env.macos` to `.env`

### Critical Environment Variables

```bash
# Camera control - Clear Touch RL500 (primary), Visca over IP
CAM_CONTROL=IP                  # Documents intent; not currently read by the code
CAM_IP_ADDRESS=192.168.108.88   # macOS template; Windows template uses 192.168.108.200
CAM_PORT=52381                  # Standard Visca-over-IP UDP port

# Projector - PJLink to the podium controller (live path)
PROJ_PJLINK_HOST=192.168.108.3  # Code default is also .3
PROJ_PJLINK_PORT=4352
PROJ_PJLINK_PASSWORD=           # Required: PJLINK_PASSWORD from podium-controller/secrets.h

# Extron IN1808 switcher
EXTRON_HOST=192.168.108.19      # Code default

# Legacy/alternate projector transports (unused by the live path)
# PROJ_DIRECT_HOST / PROJ_DIRECT_PORT       # projDirectPort.ts (projector TCP 5000)
# PROJ_TCP_HOST / PROJ_TCP_PORT             # projTcpPort.ts → esp32-projector-bridge (TCP 8888)
# PROJ_SERIAL_PORT                          # original local serial port

# OBS WebSocket
OBS_ADDRESS=ws://localhost:4455 # Read by src/Models/Obs.ts
OBS_PASSWORD=                   # Optional
```

**Gotcha**: The camera defaults in `src/Controllers/ptzCamera.ts` are `192.168.108.200:52381`. If `CAM_IP_ADDRESS` is absent from `.env`, the server silently targets `.200` — not the RL500's `.88`. Check `.env` before assuming which camera is being addressed.

## Serial Port Details

**There are two cameras and two control transports. Serial is not dead code.**

- **Clear Touch RL500 (primary)** — Visca over IP. No serial port involved. Handled entirely in `src/Controllers/ptzCamera.ts` via `dgram`; there is no `camPort` and no serial dependency in the live camera path.
- **Lumens VC-A51s (second camera)** — Visca over serial, RS-232 out of the host, converted to **RS-422** to reach the camera over a long cable run. 9600 baud, 8N1. The owner still has this camera and still intends to use it, so **the serial/RS-422 material is intentionally retained**:
  - `esp32-camera-test/` — Arduino sketch, wiring, and `PINOUT.md` for driving the VC-A51s over Visca serial via an ESP32 + MAX3232 (TTL↔RS-232) converter. This is the active reference for bringing the VC-A51s back online.
  - `podium-controller/` — a working, bench-proven ESP32-C6 + MAX3232 RS-232 implementation (for the projector). Its UART/queue design is the best starting point for a VC-A51s controller.
  - The old Node `SerialPort` template (`ICommunicationsPort`, port construction at 9600 8N1) was **removed from `comport.ts` in `1a03d5f`**. Recover it with `git show e3c9163:src/util/comport.ts`.

**Do not remove the `esp32-camera-test/` directory or the commented-out transport options in `comport.ts`.** Both are deliberately preserved.

**Caveats if you re-enable serial:**
- The `serialport` package is **not** in `package.json` dependencies — it was removed. Reinstall it before uncommenting anything that imports it.
- The camera's serial code was deleted outright when the camera moved to UDP; reconstruct it from git history (commit `594734a`, "replace camera serial port with dgram UDP") or from the ESP32 sketch.
- The historical serial settings (9600 baud, 8N1) were hardcoded in `comport.ts`, not in .env.

## API Endpoints

Server runs on port 4000.

**PTZ Camera** (prefix: `/api`)
- `GET /preset/:presetId` - Recall camera preset (0-15)
- `POST /preset` - Store current position to preset
- `GET /zoom/:speed` - Zoom camera (negative=wide, positive=tele, 0=stop)
- `GET /move?pan=X&tilt=Y` - Pan/tilt with variable speed

**OBS Studio** (prefix: `/api`)
- Defined in `src/routes/obs.ts`

**Projector** (prefix: `/api/proj`, `src/routes/projector.ts`)
- `GET /status` - `{power, source, blank}` via PJLink queries
- `GET /config` - configured PJLink host/port
- `GET /power/:on|off|status`, `GET /blank/:on|off`, `GET /source/:hdmi|roku`
- `GET /remote-key/*`, `GET /volume/*` - return 501 (not available over PJLink Class 1)

**Video switcher** (prefix: `/api/switcher`)
- Defined in `src/routes/switcher.ts`

## Common Development Tasks

### Adding a New Camera Command

1. Add Visca command bytes to `src/Models/PTZCamera.ts`
2. Create method that builds the command array with `cmdBase` and `cmdEnd`
3. Add controller function in `src/Controllers/ptzCamera.ts` that passes the byte array to `sendUdpCommand()`
4. Add route in `src/routes/ptzCamera.ts`
5. Rebuild with `npx tsc`

### Changing Projector Transport

Edit `src/util/comport.ts`: exactly one transport should be constructed, because `projTcpPort.ts` and `projDirectPort.ts` connect (and retry forever) as soon as they're imported. Note `src/Controllers/projector.ts` sends PJLink strings; the RS-232 byte transports would need it switched back to the byte-based `Projector.ts` model.

### Changing Projector Behavior (firmware)

Edit `podium-controller/` and upload. Keep handlers enqueue-only (only `ProjectorLink` touches the UART), and keep `PjlinkServer` replies compatible with `src/util/projPJLinkPort.ts`.

### Adding OBS Commands

1. Add method to `src/Models/Obs.ts` using `obs.call()` with appropriate OBS WebSocket request
2. Create controller in `src/Controllers/obs.ts`
3. Add route in `src/routes/obs.ts`

## TypeScript Compilation

- Source: `src/**/*.ts`
- Output: `dist/**/*.js`
- Target: ES6, CommonJS modules
- Strict mode enabled
- Always rebuild after changing TypeScript files: `npx tsc`
