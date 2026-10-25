# XIAO ESP32-C6 Pinout Reference

## Pin Mapping (XIAO Label → GPIO Number)

| XIAO Label | GPIO | Function | Used For |
|------------|------|----------|----------|
| D0 | GPIO0 | Digital I/O / A0 | - |
| D1 | GPIO1 | Digital I/O / A1 | - |
| D2 | GPIO2 | Digital I/O / A2 | - |
| D3 | GPIO21 | Digital I/O / SPI SS | - |
| D4 | GPIO22 | Digital I/O / I2C SDA | - |
| D5 | GPIO23 | Digital I/O / I2C SCL | - |
| **D6** | **GPIO16** | **Digital I/O / UART TX** | **Serial TX → RS232 module RXD** |
| **D7** | **GPIO17** | **Digital I/O / UART RX** | **Serial RX ← RS232 module TXD** |
| D8 | GPIO19 | Digital I/O / SPI SCK | - |
| D9 | GPIO20 | Digital I/O / SPI MISO | - |
| D10 | GPIO18 | Digital I/O / SPI MOSI | - |

Source: esp32 core 3.3.8 `variants/XIAO_ESP32C6/pins_arduino.h`. An earlier version of this table
listed the **XIAO ESP32-C3** mapping (D6 = GPIO21, D7 = GPIO20), which is wrong for the C6.

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
D6       → RXD (ESP32 TX → Module RX)
D7       ← TXD (ESP32 RX ← Module TX)
```

## Serial Configuration

```cpp
// Use the board's D7/D6 constants (GPIO17/16), and Serial1, not Serial2:
// the C6 has two full UARTs; Serial2 is the low-power UART.
Serial1.begin(9600, SERIAL_8N1, D7 /* RX */, D6 /* TX */);
```

## Important Notes

1. **XIAO labels ≠ GPIO numbers** — use the `D0`–`D10` constants in code, not raw GPIO numbers
2. **3.3V logic** — RS232-TTL module VCC must be 3.3V (not 5V)
3. **TX/RX crossover** — ESP32 TX connects to module RX (and vice versa)
4. **BOOT button required** — must manually enter bootloader for uploads
5. **USB-C only** — no micro-USB like older XIAO boards
