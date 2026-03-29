// import SerialPort from 'serialport';  // Disabled - no serial hardware connected
import { Socket } from 'net';

require('dotenv').config();

interface ICommunicationsPort {
  baudRate: number,
  dataBits: 8 | 7 | 6 | 5 | undefined,
  parity: "none" | "even" | "mark" | "odd" | "space" | undefined,
  stopBits: 1 | 2 | undefined,
}

// const CAM_PORT: string = process.env.CAM_SERIAL_PORT || '/dev/tty.usbserial-110'
// const CAM_PORT_SETTINGS: ICommunicationsPort = {
//   baudRate: 9600,
//   dataBits: 8,
//   parity: 'none',
//   stopBits: 1,
// }


const PROJ_PORT: string = process.env.PROJ_SERIAL_PORT || '/dev/tty.usbserial-120'
const PROJ_PORT_SETTINGS: ICommunicationsPort = {
  baudRate: 9600,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
}

// MacOS command to list ports "ls /dev/tty.*"
// const port = new SerialPort('/dev/tty.usb0', {


// export const camPort = new Socket();
// camPort.connect(80, '192.168.1.93', () => {
//   console.log('Connected to server!')
// })


// camPort.on('close', () => {
//   console.log('Connection closed');
// });

// // export const camPort = new SerialPort(CAM_PORT, CAM_PORT_SETTINGS);
// camPort.on('error', function (err) {
//   console.log('Error: ', err.message);
// });

// Projector serial port disabled - no RS-232/422 connection at this location.
// Re-enable when projector is reconnected.
// export const projPort = new SerialPort(PROJ_PORT, PROJ_PORT_SETTINGS)
// projPort.on('error', function (err) {
//   console.log('Error: ', err.message)
// })
//
// projPort.on('readable', function () {
//   console.log('Data: ', projPort.read())
// })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const projPort: any = null
//
// export let projPort: SerialPort | null = null;
//
// Object.defineProperty(exports, "projPort", {
//   get: function() {
//     if (!this._projPort) {
//       this._projPort = new SerialPort(PROJ_PORT, PROJ_PORT_SETTINGS);
//       this._projPort.on('error', (err: { message: string; }) => {
//         console.log('Error: ', err.message);
//         // reset port so it will be recreated on next usage
//         this._projPort = null;
//       });
//       this._projPort.on('readable', () => {
//         console.log('Data: ', this._projPort.read());
//       });
//     }
//     return this._projPort;
//   },
//   enumerable: true
// });