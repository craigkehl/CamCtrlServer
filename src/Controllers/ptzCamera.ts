import dgram from 'dgram'
import { Request, Response } from 'express'
import PTZCamera from '../Models/PTZCamera'

const ptzCamera = new PTZCamera()

const CAM_PORT = 52381
const CAM_IP_ADDRESS = '192.168.108.88'
let sequenceNumber = 0

/**
 * Sends a VISCA command via UDP using the VISCA-over-IP framing protocol.
 * Header format (8 bytes):
 *   Bytes 0-1: Payload type (0x01, 0x01)
 *   Bytes 2-3: Payload length (big-endian uint16)
 *   Bytes 4-7: Sequence number (big-endian uint32)
 * Followed by the VISCA command payload.
 */
const sendCommand = (data: number[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    const udpClient = dgram.createSocket('udp4')
    sequenceNumber++

    // Build VISCA-over-IP packet as Uint8Array<ArrayBuffer> (required by dgram.send)
    const message = new Uint8Array(8 + data.length)
    const view = new DataView(message.buffer)
    message[0] = 0x01
    message[1] = 0x01
    view.setUint16(2, data.length, false)    // payload length, big-endian
    view.setUint32(4, sequenceNumber, false) // sequence number, big-endian
    for (let i = 0; i < data.length; i++) message[8 + i] = data[i]

    udpClient.send(message, CAM_PORT, CAM_IP_ADDRESS, (err) => {
      if (err) {
        udpClient.close()
        return reject(err)
      }
    })

    udpClient.on('message', (msg, rinfo) => {
      console.log(`Received response: ${msg.toString('hex')} from ${rinfo.address}:${rinfo.port}`)
      udpClient.close()
      resolve()
    })

    udpClient.on('error', (err) => {
      console.error(`UDP client error: ${err.message}`)
      udpClient.close()
      reject(err)
    })
  })
}

export const recallPresetId = async (req: Request, res: Response): Promise<void> => {
  const { presetId } = req.params
  const command = ptzCamera.presetGet(parseInt(presetId))

  try {
    await sendCommand(command)
    console.log(`Preset ${presetId} has been called and set`)
    res.status(200).json({ Message: `Preset ${presetId} has been called and set` })
  } catch (error) {
    if (error instanceof Error) console.error(error.message)
    res.status(500).send('Failed to execute preset.')
  }
}

export const setPresetId = async (req: Request, res: Response): Promise<void> => {
  const presetId = req.body.presetId
  const command = ptzCamera.presetSet(parseInt(presetId))

  try {
    await sendCommand(command)
    console.log(`Preset ${presetId} has been stored`)
    res.status(201).json({ Message: `Preset ${presetId} has been stored` })
  } catch (error) {
    if (error instanceof Error) console.error(error.message)
    res.status(500).send('Failed to store preset.')
  }
}

export const zoom = async (req: Request, res: Response): Promise<void> => {
  const { speed } = req.params
  const command = ptzCamera.zoom(parseInt(speed))

  try {
    await sendCommand(command)
    console.log(`Zoom ${speed} has been called and set`)
    res.status(200).json({ Message: `Zoom ${speed} has been called and set` })
  } catch (error) {
    if (error instanceof Error) console.error(error.message)
    res.status(500).send('Failed to execute zoom.')
  }
}

export const moveVarSpeed = async (req: Request, res: Response): Promise<void> => {
  const pan = req.query.pan
  const tilt = req.query.tilt
  const command = ptzCamera.moveVarSpeed(
    parseInt(pan as string),
    parseInt(tilt as string)
  )

  try {
    await sendCommand(command)
    console.log(`The pan and tilt speeds of: ${pan} and ${tilt} have been called and set`)
    res.status(200).json({
      Message: `The pan and tilt speeds of: ${pan} and ${tilt} have been called and set`,
    })
  } catch (error) {
    if (error instanceof Error) console.error(error.message)
    res.status(500).send('Failed to execute pan/tilt.')
  }
}
