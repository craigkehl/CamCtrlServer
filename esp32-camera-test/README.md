# ESP32 Camera Test for Lumens VC-A51s

Simple Arduino sketch to test the serial connection between an ESP32 and the Lumens VC-A51s PTZ camera via VISCA protocol.

## Hardware Setup

### Components
- ESP32 development board
- HiLetGo TTL to RS-232 MAX3232 converter board
- Lumens VC-A51s PTZ camera
- Custom 3-wire cable (RX, TX, GND)

### Connections

**ESP32 → MAX3232 (TTL side):**
- GPIO 17 (RX) → MAX3232 TTL TX (SWAPPED - was GPIO 16)
- GPIO 16 (TX) → MAX3232 TTL RX (SWAPPED - was GPIO 17)
- GND → MAX3232 GND
- 3.3V → MAX3232 VCC

**Note:** Pins have been swapped to troubleshoot wiring. If this doesn't work, try swapping back.

**MAX3232 (RS-232 side) → Camera:**
- RS-232 TX → Camera RS-232 IN (RX)
- RS-232 RX → Camera RS-232 IN (TX)
- GND → Camera GND

## Serial Settings
**Camera (Serial2):**
- **Baud Rate:** 9600
- **Data Bits:** 8
- **Parity:** None
- **Stop Bits:** 1

**Serial Monitor (Serial/USB):**
- **Baud Rate:** 115200

## Test Sequence

The sketch performs a continuous loop:
1. Pan RIGHT for 2 seconds
2. Stop, wait 1 second
3. Tilt UP for 2 seconds
4. Stop, wait 1 second
5. Pan LEFT for 2 seconds
6. Stop, wait 1 second
7. Tilt DOWN for 2 seconds
8. Stop, wait 1 second
9. Wait 5 seconds, then repeat

## How to Use

1. **Upload the sketch:**
   - Open `esp32-camera-test.ino` in Arduino IDE
   - Select your ESP32 board type
   - Select the correct COM port
   - Click Upload

2. **Open Serial Monitor:**
   - Set baud rate to **115200** (not 9600!)
   - You should see debug output showing each command being sent

3. **Observe camera movement:**
   - The camera should follow the pattern: Right → Up → Left → Down
   - Built-in LED (GPIO 2) blinks twice for each movement
   - Cycle repeats every ~15 seconds

## Troubleshooting

### Loop Not Running (Only See Setup)
If you only see the setup output but no ">>> LOOP ITERATION #1" message:

1. **Test ESP32 basics first:**
   - Upload the simple test: `../esp32-simple-test/esp32-simple-test.ino`
   - This will verify Serial and loop() work without camera code
   - If this doesn't work, there's an ESP32 or Arduino IDE issue

2. **Check for brownout/reset:**
   - Insufficient power can cause ESP32 to reset continuously
   - Try different USB port or powered USB hub
   - Check if ESP32 LED is blinking (indicates reset loop)
   - Try removing the MAX3232 connection temporarily

3. **Serial Monitor settings:**
   - Make sure baud rate is set to **115200** (camera uses 9600, but Serial Monitor uses 115200)
   - If you see garbage characters (□□□), wrong baud rate is the cause
   - Try closing and reopening Serial Monitor
   - Try different USB cable
   - Check "Both NL & CR" line ending setting

4. **Look for error messages:**
   - Check if Arduino IDE shows any brownout or reset messages
   - The latest sketch has verbose output - you should see every step

### No Movement
- **Check RX/TX:** Current sketch uses GPIO 17 (RX) and GPIO 16 (TX)
- **Verify power:** Ensure MAX3232 has stable 3.3V or 5V power (check board datasheet)
- **Check camera:** Ensure camera is powered on and in correct input mode
- **Serial Monitor:** Verify commands are being sent (hex output should appear)
- **Camera response:** Updated sketch shows if camera sends responses

### Erratic Movement
- **Ground connection:** Verify solid GND connection between all components
- **Cable quality:** Check for loose connections in custom cable
- **Power stability:** Ensure ESP32 has stable power supply

### Partial Movement
- **MAX3232 voltage:** Some MAX3232 boards require 5V instead of 3.3V - check datasheet
- **RS-232 levels:** Verify MAX3232 is properly converting TTL to RS-232 voltage levels

### Wrong Direction
- **RX/TX swap:** If movement is happening but seems inverted, RX/TX may be crossed
- **Command verification:** Check Serial Monitor output to verify correct hex bytes

## Adjusting Movement

### Movement Duration
Change `MOVE_DURATION` constant (line 24) for longer/shorter movements:
```cpp
#define MOVE_DURATION 2000  // milliseconds
```

### Movement Speed
Change `MOVE_SPEED` constant (line 25) for faster/slower movement:
```cpp
#define MOVE_SPEED 0x0C  // Range: 0x01 to 0x18 (1-24 decimal)
```
- Lower values = slower movement
- Higher values = faster movement
- 0x0C (12) is moderate speed from original CamCtrlServer settings

## VISCA Protocol Reference

Commands use format: `[0x81, 0x01] [0x06, 0x01] [pan_speed] [tilt_speed] [pan_dir] [tilt_dir] [0xFF]`

**Direction codes:**
- Pan: `0x01`=left, `0x02`=right, `0x03`=stop
- Tilt: `0x01`=down, `0x02`=up, `0x03`=stop

**Example - Pan Right:**
```
0x81 0x01 0x06 0x01 0x0C 0x00 0x02 0x03 0xFF
└─┬─┘ └─┬─┘ └─┬─┘ └─┬─┘ └─┬─┘ └─┬─┘ └─┬─┘ └─┬─┘
  │     │     │     │     │     │     │     └─ End marker
  │     │     │     │     │     │     └─ Tilt stop
  │     │     │     │     │     └─ Pan right
  │     │     │     │     └─ Tilt speed (0)
  │     │     │     └─ Pan speed (12)
  │     │     └─ Pan/Tilt command
  │     └─ Camera address (1)
  └─ Header
```

## Related Files

- Main CamCtrlServer: `../src/Models/PTZCamera.ts` (full VISCA implementation)
- Serial port config: `../src/util/comport.ts` (original camera settings)
