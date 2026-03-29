# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CamCtrlServer is a Node.js/TypeScript Express server that provides REST API control for church AV equipment:
- PTZ camera (Lumens VC-A51s) via Visca protocol
- OBS Studio via WebSocket
- Projector via RS-232 serial

Works with a separate React frontend (https://github.com/craigkehl/ts-cam-app) for user control.

## Development Commands

**Build and run:**
```bash
# Compile TypeScript (src/ -> dist/)
npx tsc

# Development with auto-reload
npm run dev

# Production (requires compilation first)
npm start
```

**Environment setup:**
- Copy `.env.macos` or `.env.windows` to `.env` depending on platform
- Configure serial ports and OBS WebSocket address
- Server runs on port 4000

## Architecture

### MVC-like Pattern

**Models** (src/Models/): Define device communication protocols
- `PTZCamera.ts`: Visca protocol command builder for pan/tilt/zoom/preset operations
- `Obs.ts`: OBS WebSocket connection and scene control
- `Projector.ts`: Projector serial command builder for power/source/volume/remote control

**Controllers** (src/Controllers/): Business logic for device operations
- `ptzCamera.ts`: Camera command handlers with Socket-based IP communication (port 52381)
- `obs.ts`: OBS scene switching and event handling
- `projector.ts`: Projector command execution via serial

**Routes** (src/routes/): Express endpoint definitions
- `ptzCamera.ts`: `/api/preset/:id`, `/api/zoom/:speed`, `/api/move`
- `obs.ts`: OBS scene routes
- `projector.ts`: `/api/proj/*` endpoints

### Communication Layers

**Camera Control Transition:**
The codebase is transitioning from serial to IP-based camera control (see ipVisca branch):
- Original: RS-232 serial via SerialPort
- Current: TCP Socket connection to camera at 192.168.1.93:52381
- Connection management: Reconnects if socket not writable before each command

**OBS Control:**
- WebSocket connection via obs-websocket-js (v5)
- Default: `ws://localhost:4455` (configurable via OBS_ADDRESS env var)
- Listens for scene change events and responds to scene switch requests

**Projector Control:**
- RS-232 serial via SerialPort library
- Port configured in PROJ_SERIAL_PORT env var (e.g., `/dev/tty.usbserial-1210`)
- 9600 baud, 8 data bits, no parity, 1 stop bit

## Key Technical Details

**Visca Protocol Implementation:**
- Commands built as byte arrays: `[0x81, 0x01, ...command bytes..., 0xFF]`
- Variable speed pan/tilt: `moveVarSpeed(xRate, yRate)` where rates are 0x00-0x18
- Zoom with variable speed: positive = tele, negative = wide, 0 = stop
- Presets numbered 0-15, recalled with `presetGet(n)`

**Camera Preset Positions:**
Defined in `src/data/presetList.ts` with human-readable names:
- Stage positions (All Stage, Center Stage, Left/Right Stage)
- Podium views (Low/Med/Wide Podium)
- Specific targets (Piano, Conductor, Organ, Audience)

**OBS Integration:**
- Connects on server startup, reconnects automatically
- Scene changes propagate through `onSceneChange` callback
- Uses RPC-based communication (obs-websocket v5 protocol)

**Express API:**
- CORS enabled for cross-origin requests
- JSON body parsing enabled
- All routes prefixed with `/api` (except projector uses `/api/proj`)

## Configuration Files

**tsconfig.json:**
- Target: ES6
- Module: CommonJS
- Root: ./src, Output: ./dist
- Strict type checking enabled

**.env variables:**
- `CAM_CONTROL`: "SERIAL" or "IP"
- `CAM_SERIAL_PORT`: Serial device path (if using serial)
- `PROJ_SERIAL_PORT`: Projector serial device path
- `HAS_PROJECTOR`: Enable/disable projector functionality
- `OBS_ADDRESS`: OBS WebSocket URL
- `OBS_PASSWORD`: OBS WebSocket password (if configured)
- `OBS_PATH`: Path to OBS executable (macOS)

## Common Patterns

**Adding new camera commands:**
1. Add command bytes to PTZCamera model's `cmd` object
2. Create method in PTZCamera that returns command array with base/end bytes
3. Add controller function that builds command and writes to socket
4. Add route in ptzCamera router

**Socket connection handling:**
Every controller function checks `camPort.writable` and reconnects if needed before writing commands. This handles dropped connections transparently.

**Error handling:**
Write callbacks check for errors and log to console. API responses return 200/201 status with success messages.
