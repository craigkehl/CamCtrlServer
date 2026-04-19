// SerialPort removed - now using TCP/IP bridge only
// import SerialPort from 'serialport';
require('dotenv').config();

// Serial port interface kept for reference
// interface ICommunicationsPort {
//   baudRate: number,
//   dataBits: 8 | 7 | 6 | 5 | undefined,
//   parity: "none" | "even" | "mark" | "odd" | "space" | undefined,
//   stopBits: 1 | 2 | undefined,
// }

// ESP32 bridge code commented out for direct IP control testing
// Using TCP/IP bridge for projector control via ESP32
// const { projTcpPort } = require('./projTcpPort')
// const projPort = projTcpPort
//
// // Prevent server crash on connection errors
// projPort.on('error', (err: Error) => {
//   console.log('Projector bridge error (non-fatal):', err.message)
// })
//
// console.log('Projector control: TCP (ESP32 WiFi bridge)')

// Direct IP control to ViewSonic LS831WU projector
const { projDirectPort } = require('./projDirectPort')
const projPort = projDirectPort

// Prevent server crash on connection errors
projPort.on('error', (err: Error) => {
  console.log('Projector direct IP error (non-fatal):', err.message)
})

console.log('Projector control: TCP (Direct IP)')

// Serial port code removed - using TCP bridge only
// const PROJ_CONTROL = process.env.PROJ_CONTROL || 'SERIAL'
// if (PROJ_CONTROL === 'TCP') {
//   const { projTcpPort } = require('./projTcpPort')
//   projPort = projTcpPort
//   console.log('Projector control: TCP (ESP32 WiFi bridge)')
// } else {
//   const PROJ_PORT: string = process.env.PROJ_SERIAL_PORT || 'COM3'
//   const PROJ_PORT_SETTINGS: ICommunicationsPort = {
//     baudRate: 9600,
//     dataBits: 8,
//     parity: 'none',
//     stopBits: 1,
//   }
//   projPort = new SerialPort(PROJ_PORT, PROJ_PORT_SETTINGS)
//   projPort.on('error', function (err: Error) {
//     console.log('Projector serial error: ', err.message)
//   })
//   projPort.on('readable', function () {
//     console.log('Projector serial data: ', projPort.read())
//   })
//   console.log('Projector control: Serial port', PROJ_PORT)
// }

export { projPort }