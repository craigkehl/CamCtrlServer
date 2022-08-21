import SerialPort from 'serialport';

const CAM_PORT: string = process.env.CAM_SERIAL_PORT || 'COM8'
// on mac /dev/ttyUSB0

const port = new SerialPort(CAM_PORT, {
  baudRate: 9600,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
});
port.on('error', function (err) {
  console.log('Error: ', err.message);
});

export default port;
