import SerialPort from 'serialport';
require('dotenv').config();

interface ICommunicationsPort {
  baudRate: number,
  dataBits: 8 | 7 | 6 | 5 | undefined,
  parity: "none" | "even" | "mark" | "odd" | "space" | undefined,
  stopBits: 1 | 2 | undefined,
}

const PROJ_PORT: string = process.env.PROJ_SERIAL_PORT || 'COM4'
const PROJ_PORT_SETTINGS: ICommunicationsPort = {
  baudRate: 9600,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
}

export const projPort = new SerialPort(PROJ_PORT, PROJ_PORT_SETTINGS)
projPort.on('error', function (err) {
  console.log('Error: ', err.message)
})

projPort.on('readable', function () {
  console.log('Data: ', projPort.read())
})