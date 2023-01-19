import { Request, Response, NextFunction } from 'express';
import PTZCamera from '../Models/PTZCamera';
import { camPort  }from '../util/comport';

const ptzCamera = new PTZCamera();

export const recallPresetId = (req: Request, res: Response): void => {
  const params = req.params;
  const presetId = params.presetId;
  const command = ptzCamera.presetGet(parseInt(presetId));
  camPort.write(command, function (err) {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
    console.log(`Preset ${presetId} has been called and set`);
    res.status(200).json({
      Message: `Preset ${presetId} has been called and set`,
    });
  });
};

export const setPresetId = (req: Request, res: Response): void => {
  const presetId = req.body.presetId;
  const command = ptzCamera.presetSet(parseInt(presetId));
  camPort.write(command, function (err) {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
    console.log(`Preset ${presetId} has been stored`);
    res.status(201).json({
      Message: `Preset ${presetId} has been stored`,
    });
  });
};

export const zoom = (req: Request, res: Response): void => {
  const params = req.params;
  const speed = params.speed;
  const command = ptzCamera.zoom(parseInt(speed));
  camPort.write(command, function (err) {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
    console.log(`Zoom ${speed} has been called and set`);
    res.status(200).json({
      Message: `Zoom ${speed} has been called and set`,
    });
  });
};

export const moveVarSpeed = (req: Request, res: Response): void => {
  const pan = req.query.pan;
  const tilt = req.query.tilt;
  const command = ptzCamera.moveVarSpeed(
    parseInt(pan as string),
    parseInt(tilt as string)
  );
  camPort.write(command, function (err) {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
    console.log(
      `The pan and tilt speeds of: ${pan} and ${tilt} have been called and set`
    );
    res.status(200).json({
      Message: `The pan and tilt speeds of: ${pan} and ${tilt} have been called and set`,
    });
  });
};
