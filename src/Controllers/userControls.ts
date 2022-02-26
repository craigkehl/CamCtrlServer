import { Request, Response, NextFunction } from 'express';
import Camera from '../Models/Camera';
import port from '../util/comport';
import { setCurrentScene as sendScene } from '../Models/Obs';

const camera = new Camera();

export const recallPresetId = (req: Request, res: Response): void => {
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

export const setPresetId = (req: Request, res: Response): void => {
  const presetId = req.body.presetId;
  const command = camera.presetSet(parseInt(presetId));
  port.write(command, function (err) {
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
  const command = camera.zoom(parseInt(speed));
  port.write(command, function (err) {
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
  const command = camera.moveVarSpeed(
    parseInt(pan as string),
    parseInt(tilt as string)
  );
  port.write(command, function (err) {
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

export const setCurrentScene = (req: Request, res: Response): void => {
  const params = req.params;
  const name = params.name;
  const message = sendScene(name);
  res.status(200).json({
    Message: message,
  });
  console.log(message);
};
