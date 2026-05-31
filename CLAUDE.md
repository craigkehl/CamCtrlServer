# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CamCtrlServer is a Node.js/TypeScript Express server that provides HTTP API endpoints to control:
- **PTZ Camera** (Lumens VC-A51s) via Visca protocol over serial (RS-232/RS-422)
- **Projector** via serial commands
- **OBS Studio** via WebSocket (obs-websocket-js v5)

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
├── util/            # Serial port initialization (comport.ts)
└── data/            # Static data (camera presets)
```

### Request Flow

1. HTTP request hits a route (e.g., `GET /api/preset/:presetId`)
2. Route calls controller function (e.g., `recallPresetId`)
3. Controller uses Model to build protocol command (e.g., `ptzCamera.presetGet()`)
4. Controller writes command to appropriate communication channel:
   - Camera: `camPort.write()` (serial)
   - Projector: `projPort.write()` (serial)
   - OBS: `obs.call()` (WebSocket)

### Key Subsystems

**PTZ Camera (Visca Protocol)**
- Model: `src/Models/PTZCamera.ts` - Builds Visca byte arrays for camera control
- Visca commands are hex byte arrays (e.g., `[0x81, 0x01, 0x04, 0x3f, 0x02, presetId, 0xff]`)
- Controls: presets, zoom, focus, pan/tilt with variable speed
- Serial communication via `camPort` from `src/util/comport.ts`

**OBS Studio (WebSocket)**
- Model: `src/Models/Obs.ts` - Wraps obs-websocket-js client
- Connects on startup to OBS WebSocket server
- Handles scene changes and listens for OBS events
- Uses async/await for WebSocket calls

**Projector (Serial)**
- Model: `src/Models/Projector.ts`
- Serial communication via `projPort` from `src/util/comport.ts`
- Can be disabled via `HAS_PROJECTOR=false` in .env

## Configuration

Environment configuration is platform-specific:
- **Windows**: Copy `.env.windows` to `.env`
- **macOS**: Copy `.env.macos` to `.env`

### Critical Environment Variables

```bash
# Camera control
CAM_SERIAL_PORT='COM3'          # Windows
CAM_SERIAL_PORT=/dev/tty.usb0   # macOS

# Projector control
PROJ_SERIAL_PORT='COM4'         # Windows
PROJ_SERIAL_PORT=/dev/tty.usbserial-1210  # macOS
HAS_PROJECTOR=true              # Set to false if no projector

# OBS WebSocket
OBS_ADDRESS=ws://localhost:4455
OBS_PASSWORD=                   # Optional
```

## Serial Port Details

Serial ports are initialized in `src/util/comport.ts` at module load time:
- **Camera port**: 9600 baud, 8N1
- **Projector port**: 9600 baud, 8N1
- Both ports log errors to console if connection fails
- Ports remain open for the lifetime of the server

**Important**: Serial port settings are hardcoded in `comport.ts`, not in .env.

## API Endpoints

Server runs on port 4000.

**PTZ Camera** (prefix: `/api`)
- `GET /preset/:presetId` - Recall camera preset (0-15)
- `POST /preset` - Store current position to preset
- `GET /zoom/:speed` - Zoom camera (negative=wide, positive=tele, 0=stop)
- `GET /move?pan=X&tilt=Y` - Pan/tilt with variable speed

**OBS Studio** (prefix: `/api`)
- Defined in `src/routes/obs.ts`

**Projector** (prefix: `/api/proj`)
- Defined in `src/routes/projector.ts`

## Common Development Tasks

### Adding a New Camera Command

1. Add Visca command bytes to `src/Models/PTZCamera.ts`
2. Create method that builds the command array with `cmdBase` and `cmdEnd`
3. Add controller function in `src/Controllers/ptzCamera.ts` that writes to `camPort`
4. Add route in `src/routes/ptzCamera.ts`
5. Rebuild with `npx tsc`

### Modifying Serial Port Settings

Edit `src/util/comport.ts` to change baud rate, parity, stop bits, or data bits for camera/projector.

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
