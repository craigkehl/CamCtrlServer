# ESP32-C6 Projector WiFi Bridge

This Arduino sketch turns a **Seeed Studio XIAO ESP32-C6** into a WiFi-to-Serial bridge for the projector, replacing the failed hardwired serial connection.

## Hardware

- **ESP32 Board**: Seeed Studio XIAO ESP32-C6 (model X004IJPXX9)
- **RS232-TTL Converter**: Ultra Compact RS232-to-TTL with Female DB9 (SP3232E)
  - Female DB9 connector plugs directly into projector
  - Supports 3.3V–5V logic levels

## Wiring

```
XIAO ESP32-C6 → RS232-TTL Module → Projector
─────────────────────────────────────────────
3V3             → VCC
GND             → GND
D6 (GPIO21)     → RX (Logic In)
D7 (GPIO20)     → TX (Logic Out)
                  DB9 Female → Projector DB9 Male
```

**Important Pin Mapping:**
- XIAO labeled pins ≠ GPIO numbers
- D6 = GPIO21 (use for TX)
- D7 = GPIO20 (use for RX)

## Arduino IDE Setup

### 1. Install ESP32-C6 Board Support

**Preferences → Additional Board Manager URLs:**
```
https://espressif.github.io/arduino-esp32/package_esp32_index.json
```

**Tools → Board → Boards Manager:**
- Search "esp32"
- Install **"esp32" by Espressif Systems** version **3.0.0+**

### 2. Board Configuration

**Tools → Board:** "XIAO_ESP32C6"

**Tools → Settings:**
- USB CDC On Boot: **Enabled**
- Flash Size: **4MB (32Mb)**
- Partition Scheme: **Default 4MB with spiffs**
- Upload Speed: **921600**

### 3. Upload Process (ESP32-C6 requires manual bootloader entry)

1. Click **Upload** in Arduino IDE
2. When console shows "Connecting...", **press and hold BOOT button** on XIAO
3. Hold until "Writing at 0x00000000..." appears
4. Release BOOT button
5. Wait for upload to complete

**Alternative method if above fails:**
1. Hold BOOT button
2. Press/release RESET (or unplug/replug USB)
3. Release BOOT button
4. Click Upload immediately

## Configuration

### 1. Update WiFi Credentials in Arduino Sketch

Edit `esp32-projector-bridge.ino`:

```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```

### 2. Upload and Get IP Address

1. Upload sketch using bootloader method above
2. Open Serial Monitor (115200 baud)
3. Press RESET button on XIAO
4. Note the IP address displayed:
   ```
   WiFi connected!
   IP address: 192.168.1.XXX
   Listening on TCP port: 8888
   ```

### 3. Update Server .env File

Edit `.env` (macOS) or `.env.windows`:

```bash
# Set projector control mode to TCP
PROJ_CONTROL=TCP

# Use the IP address from Serial Monitor
PROJ_TCP_HOST=192.168.1.XXX  # ← Update this
PROJ_TCP_PORT=8888
```

## Testing

### 1. Test ESP32 Bridge

Open Serial Monitor (115200 baud) to see:
- WiFi connection status
- TCP client connections
- Data flowing in both directions (hex bytes)

### 2. Test Server Connection

```bash
npm run dev
```

Look for:
```
Projector control: TCP (ESP32 WiFi bridge)
Projector TCP bridge: connected to 192.168.1.XXX:8888
```

### 3. Test Projector Command

Send an API request (e.g., power on):
```bash
curl http://localhost:4000/api/proj/power/on
```

Check Serial Monitor — you should see bytes being sent to the projector.

## Troubleshooting

### Upload Fails

**Symptom:** Stuck on "Connecting..." or "A fatal error occurred"

**Fix:**
- Hold BOOT button longer (from "Connecting..." until "Writing...")
- Try reset sequence: hold BOOT → press RESET → release BOOT → Upload
- Check USB cable (must be data cable, not charge-only)
- Verify port selection in Tools → Port

### WiFi Won't Connect

**Fix:**
- Check SSID/password spelling
- ESP32-C6 supports 2.4GHz only (not 5GHz)
- Check router allows new devices
- Open Serial Monitor to see connection attempts

### Server Can't Connect to ESP32

**Fix:**
- Verify `PROJ_TCP_HOST` in `.env` matches IP shown in Serial Monitor
- Ping the ESP32: `ping 192.168.1.XXX`
- Check firewall isn't blocking port 8888
- Confirm ESP32 and server are on same network

### Commands Not Reaching Projector

**Fix:**
- Check wiring (TX/RX might be swapped)
- Verify RS232-TTL module powered (3V3 connected)
- Check baud rate matches projector (9600)
- Test with direct serial connection to verify projector works

## How It Works

1. **CamCtrlServer** sends projector command bytes via TCP to ESP32
2. **ESP32** receives TCP packets, forwards to Serial2 (GPIO21/20)
3. **RS232-TTL module** converts 3.3V TTL signals to RS232 levels
4. **Projector** receives RS232 commands via DB9 port
5. Projector responses flow back through same path

The `projTcpPort.ts` wrapper makes the TCP socket behave like a serial port, so no controller changes are needed.

## Serial Settings

Both ESP32 Serial2 and RS232-TTL module use:
- **Baud**: 9600
- **Data**: 8 bits
- **Parity**: None
- **Stop**: 1 bit

## Power Consumption

XIAO ESP32-C6 draws ~80mA in active WiFi mode. Can be powered by:
- USB-C cable (5V)
- 3.7V LiPo battery on BAT+ pin
- External 3.3V–5V on 3V3 pin

For permanent installation, use USB power adapter near projector.
