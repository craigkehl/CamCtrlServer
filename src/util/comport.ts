import SerialPort from 'serialport';

const port = new SerialPort('/dev/tty.usbserial-1440', {
  baudRate: 9600,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
});
port.on('error', function (err) {
  console.log('Error: ', err.message);
});

export default port;
