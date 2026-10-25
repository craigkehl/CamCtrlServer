import dgram from 'dgram';
import { Request, Response } from 'express';
import PTZCamera from '../Models/PTZCamera';
require('dotenv').config();

const CAM_IP_ADDRESS: string = process.env.CAM_IP_ADDRESS || '192.168.108.200';
const CAM_PORT: number = parseInt(process.env.CAM_PORT || '52381');
let sequenceNumber = 0;

const ptzCamera = new PTZCamera();

function sendUdpCommand(data: number[], res: Response, successStatus: number, successMessage: string): void {
  const udpClient = dgram.createSocket('udp4');
  let settled = false;

  const cleanup = () => { try { udpClient.close(); } catch { /* already closed */ } };

  const timeout = setTimeout(() => {
    if (settled) return;
    settled = true;
    cleanup();
    console.error('Camera UDP command timed out');
    res.status(504).send('Camera command timed out');
  }, 5000);

  udpClient.on('error', (err) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);
    cleanup();
    console.error('UDP error:', err);
    res.status(500).send('Error sending command');
  });

  sequenceNumber++;
  const payload = Buffer.from(data);
  const header = Buffer.alloc(8);
  header.writeUInt8(0x01, 0);
  header.writeUInt8(0x01, 1);
  header.writeUInt16BE(payload.length, 2);
  header.writeUInt32BE(sequenceNumber, 4);
  const message = Buffer.concat([header, payload]);

  udpClient.send(message, CAM_PORT, CAM_IP_ADDRESS, (error) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);
    cleanup();
    if (error) {
      console.error('Error sending command:', error);
      res.status(500).send('Error sending command');
    } else {
      console.log(successMessage);
      res.status(successStatus).json({ Message: successMessage });
    }
  });
}

export const recallPresetId = (req: Request, res: Response): void => {
  const { presetId } = req.params;
  const command = ptzCamera.presetGet(parseInt(presetId));
  sendUdpCommand(command, res, 200, `Preset ${presetId} has been called and set`);
};

export const setPresetId = (req: Request, res: Response): void => {
  const presetId = req.body.presetId;
  const command = ptzCamera.presetSet(parseInt(presetId));
  sendUdpCommand(command, res, 201, `Preset ${presetId} has been stored`);
};

export const zoom = (req: Request, res: Response): void => {
  const { speed } = req.params;
  const command = ptzCamera.zoom(parseInt(speed));
  sendUdpCommand(command, res, 200, `Zoom ${speed} has been called and set`);
};

export const moveVarSpeed = (req: Request, res: Response): void => {
  const { pan, tilt } = req.query;
  const command = ptzCamera.moveVarSpeed(
    parseInt(pan as string),
    parseInt(tilt as string)
  );
  sendUdpCommand(command, res, 200, `The pan and tilt speeds of: ${pan} and ${tilt} have been called and set`);
};
