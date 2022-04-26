import SerialPort from 'serialport';

const CAM_PORT: string = process.env.CAM_SERIAL_PORT || '/dev/ttyUSB0)'



// const port = new SerialPort('/dev/tty.usb0', {

const port = new SerialPort(CAM_PORT, {
  baudRate: 9600,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
});
port.on('error', function (err) {
  console.log('Error: ', err.message);
});

// const port = new SerialPort('COM5', {
//   baudRate: 9600,
//   dataBits: 8,
//   parity: 'none',
//   stopBits: 1,
// })
// port.on('error', function (err) {
//   console.log('Error: ', err.message)
// })

export default port;
