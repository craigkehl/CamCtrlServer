import { Request, Response, NextFunction } from 'express';
import Camera from '../Models/Camera';
import port from '../util/comport';

const camera = new Camera();

type RequestParams = {
  presetId: number;
  speed: number;
};

export const recallPresetId = (req: Request, res: Response): void => {
  console.log('Request received');
  const params = req.params;
  const presetId = params.presetId;
  const command = camera.presetGet(parseInt(presetId));
  port.write(command, function (err) {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
    console.log(`Preset ${presetId} has been called and set`);
    res.status(200).json({
      Message: `Preset ${presetId} has been called and set`,
    });
  });
};

export const zoom = (req: Request, res: Response): void => {
  console.log('Request received');
  const params = req.params;
  const speed = params.speed;
  const command = camera.zoom(parseInt(speed));
  port.write(command, function (err) {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
    console.log(`Zoom ${speed}} has been called and set`);
    res.status(200).json({
      Message: `Zoom ${speed} has been called and set`,
    });
  });
};
