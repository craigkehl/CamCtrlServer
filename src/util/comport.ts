import SerialPort from 'serialport';
import dotenv from 'dotenv';
import os from 'os';

interface ICommunicationsPort {
  baudRate: number,
  dataBits: 8 | 7 | 6 | 5 | undefined,
  parity: "none" | "even" | "mark" | "odd" | "space" | undefined,
  stopBits: 1 | 2 | undefined,
}

const CAM_SERIAL_PORT: string = process.env.CAM_SERIAL_PORT || '/dev/tty.usbserial-1330'
const CAM_PORT_SETTINGS: ICommunicationsPort = {
  baudRate: 9600,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
}

const PROJ_SERIAL_PORT: string = process.env.PROJ_SERIAL_PORT || '/dev/tty.usbserial-1210'
const PROJ_PORT_SETTINGS: ICommunicationsPort = {
  baudRate: 9600,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
}

dotenv.config({ path: os.platform() === "win32" ? '.env.windows' : '.env.macos' });

// const port = new SerialPort('/dev/tty.usb0', {

export const camPort = new SerialPort(CAM_SERIAL_PORT, CAM_PORT_SETTINGS);
camPort.on('error', function (err) {
  console.log('Camera port connection error: ', err.message);
});

// camPort.on('readable', function () {
//   console.log('Data: ', camPort.read())
// })

// camPort.on('data', function (data) {
//   console.log('Data:', data);
// });

// camPort.on('write', function(data) {
//   console.log('Data written: ', data);
// });

export const projPort = new SerialPort(PROJ_SERIAL_PORT, PROJ_PORT_SETTINGS)
projPort.on('error', function (err) {
  console.log('Projector port connection error: ', err.message)
})

projPort.on('readable', function () {
  console.log('Data: ', projPort.read())
})