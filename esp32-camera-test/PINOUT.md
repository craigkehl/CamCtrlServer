# Lumens VC-A51s RS-232 Pinout

## Connector Type
8-pin mini-DIN (NOT standard DB-9)

```
  1 2  
3 4  5
 6 7 8
```

## Verified Pinout

| Pin | Function | Connection |
|-----|----------|------------|
| 3   | RX (Camera receives) | MAX3232 T_OUT |
| 4   | GND | MAX3232 GND |
| 7   | TX (Camera transmits) | MAX3232 R_IN |

**Note:** Pin 4 is GND, NOT pin 5 (which is standard DB-9 convention)

## Complete Wiring Diagram

### ESP32 → MAX3232 (TTL side)
- **ESP32 GPIO 17 (RX)** → MAX3232 R_OUT
- **ESP32 GPIO 16 (TX)** → MAX3232 T_IN
- **ESP32 GND** → MAX3232 GND
- **ESP32 3.3V** → MAX3232 VCC

### MAX3232 (RS-232 side) → Camera
- **MAX3232 T_OUT** → Camera Pin 3 (RX)
- **MAX3232 R_IN** → Camera Pin 7 (TX)
- **MAX3232 GND** → Camera Pin 4 (GND)

## Serial Settings
- **Baud Rate:** 9600
- **Data Bits:** 8
- **Parity:** None
- **Stop Bits:** 1
- **Protocol:** VISCA
- **Camera Address:** 1 (0x81 in commands)

## VISCA Responses
When working correctly, you should see:
- `90 41 FF` - Command ACK (acknowledged)
- `90 51 FF` - Command completion
- `90 50 02 FF` - Power inquiry response (camera is ON)

## Troubleshooting Notes
- **Pin 5 does NOT work** - gives all zeros
- **Pin 7 is the correct TX** from camera
- Camera must be configured via OSD menu:
  - Control Port: RS-232C (not RS-422)
  - Protocol: VISCA (not Pelco D)
  - Baud Rate: 9600
  - VISCA Address: 0 or 1
