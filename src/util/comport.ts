import SerialPort from 'serialport';
require('dotenv').config();

interface ICommunicationsPort {
  baudRate: number,
  dataBits: 8 | 7 | 6 | 5 | undefined,
  parity: "none" | "even" | "mark" | "odd" | "space" | undefined,
  stopBits: 1 | 2 | undefined,
}

const CAM_PORT: string = process.env.CAM_SERIAL_PORT || 'COM8'
const CAM_PORT_SETTINGS: ICommunicationsPort = {
  baudRate: 9600,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
}

const PROJ_PORT: string = process.env.PROJ_SERIAL_PORT || 'COM6'
const PROJ_PORT_SETTINGS: ICommunicationsPort = {
  baudRate: 9600,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
}

// const port = new SerialPort('/dev/tty.usb0', {

export const camPort = new SerialPort(CAM_PORT, CAM_PORT_SETTINGS);
camPort.on('error', function (err) {
  console.log('Error: ', err.message);
});

export const projPort = new SerialPort(PROJ_PORT, PROJ_PORT_SETTINGS)
projPort.on('error', function (err) {
  console.log('Error: ', err.message)
})
