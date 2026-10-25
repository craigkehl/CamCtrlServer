require('dotenv').config();

// --- Active: PJLink direct IP (ViewSonic LS831WU at 192.168.108.11:4352) ---
const { projPJLinkPort } = require('./projPJLinkPort')
const projPort = projPJLinkPort

console.log('Projector control: PJLink (direct IP)')

// --- RS-232 options preserved for future use ---
//
// Option A: ESP32-C6 WiFi bridge (full RS-232 command set)
//   Hardware: ESP32-C6 + MAX3232 + DB-9 → projector RS-232 port
//   Sketch:   esp32-projector-bridge/esp32-projector-bridge.ino
//   IP:       192.168.108.18 (DHCP reservation by MAC)
//   Port:     8888
//
//   const { projTcpPort } = require('./projTcpPort')
//   const projPort = projTcpPort
//   projPort.on('error', (err: Error) => {
//     console.log('Projector bridge error (non-fatal):', err.message)
//   })
//   console.log('Projector control: TCP (ESP32 WiFi bridge)')
//
// Option B: Direct RS-232 over TCP (if projector exposes port — currently ECONNREFUSED)
//   const { projDirectPort } = require('./projDirectPort')
//   const projPort = projDirectPort
//   projPort.on('error', (err: Error) => {
//     console.log('Projector direct IP error (non-fatal):', err.message)
//   })
//   console.log('Projector control: TCP (Direct IP)')

export { projPort }
