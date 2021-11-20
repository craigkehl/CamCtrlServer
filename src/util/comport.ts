import SerialPort from 'serialport'

const port = new SerialPort(
  "COM5",
  {
    baudRate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1
  },
)
port.on('error', function(err) {
  console.log('Error: ', err.message)
})

export default port