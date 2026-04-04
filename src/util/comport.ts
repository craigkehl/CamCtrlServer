import SerialPort from 'serialport';
require('dotenv').config();

interface ICommunicationsPort {
  baudRate: number,
  dataBits: 8 | 7 | 6 | 5 | undefined,
  parity: "none" | "even" | "mark" | "odd" | "space" | undefined,
  stopBits: 1 | 2 | undefined,
}

// Set PROJ_CONTROL=TCP in .env to route projector commands through the
// ESP32 WiFi-to-serial bridge instead of a local serial port.
const PROJ_CONTROL = process.env.PROJ_CONTROL || 'SERIAL'

let projPort: any

if (PROJ_CONTROL === 'TCP') {
  const { projTcpPort } = require('./projTcpPort')
  projPort = projTcpPort
  console.log('Projector control: TCP (ESP32 WiFi bridge)')
} else {
  const PROJ_PORT: string = process.env.PROJ_SERIAL_PORT || 'COM3'
  const PROJ_PORT_SETTINGS: ICommunicationsPort = {
    baudRate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
  }
  projPort = new SerialPort(PROJ_PORT, PROJ_PORT_SETTINGS)
  projPort.on('error', function (err: Error) {
    console.log('Projector serial error: ', err.message)
  })
  projPort.on('readable', function () {
    console.log('Projector serial data: ', projPort.read())
  })
  console.log('Projector control: Serial port', PROJ_PORT)
}

export { projPort }