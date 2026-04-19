# XIAO ESP32-C6 Pinout Reference

## Pin Mapping (XIAO Label → GPIO Number)

| XIAO Label | GPIO | Function | Used For |
|------------|------|----------|----------|
| D0 | GPIO2 | Digital I/O | - |
| D1 | GPIO3 | Digital I/O | - |
| D2 | GPIO4 | Digital I/O | - |
| D3 | GPIO5 | Digital I/O | - |
| D4 | GPIO6 | Digital I/O / I2C SDA | - |
| D5 | GPIO7 | Digital I/O / I2C SCL | - |
| **D6** | **GPIO21** | **Digital I/O / UART TX** | **Serial TX → RS232 RX** |
| **D7** | **GPIO20** | **Digital I/O / UART RX** | **Serial RX ← RS232 TX** |
| D8 | GPIO8 | Digital I/O | - |
| D9 | GPIO9 | Digital I/O | - |
| D10 | GPIO10 | Digital I/O | - |

## Power Pins

| Label | Function | Voltage | Notes |
|-------|----------|---------|-------|
| **3V3** | Power Out | 3.3V | Powers RS232-TTL module |
| **GND** | Ground | 0V | Common ground |
| VBUS | USB Power | 5V | Present when USB connected |
| BAT+ | Battery In | 3.7V | LiPo battery input |
| BAT- | Battery Gnd | 0V | Battery ground |

## Special Pins

| Label | Function | Notes |
|-------|----------|-------|
| **BOOT** | Bootloader | Hold during power-on/reset for upload mode |
| EN | Enable/Reset | Pull low to reset ESP32-C6 |
| MTCK | JTAG Clock | Debug interface |
| MTMS | JTAG TMS | Debug interface |
| MTDI | JTAG TDI | Debug interface |
| MTDO | JTAG TDO | Debug interface |

## This Project's Connections

```
XIAO Pin → RS232-TTL Module
──────────────────────────────
3V3      → VCC (powers module)
GND      → GND (common ground)
D6       → RX  (ESP32 TX → Module RX)
D7       → TX  (ESP32 RX ← Module TX)
```

## Serial Configuration

```cpp
#define RXD2 20  // D7 on XIAO
#define TXD2 21  // D6 on XIAO

Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2);
```

## Important Notes

1. **XIAO labels ≠ GPIO numbers** — always use GPIO numbers in code
2. **3.3V logic** — RS232-TTL module VCC must be 3.3V (not 5V)
3. **TX/RX crossover** — ESP32 TX connects to module RX (and vice versa)
4. **BOOT button required** — must manually enter bootloader for uploads
5. **USB-C only** — no micro-USB like older XIAO boards
