import { Request, Response, NextFunction } from 'express';
import { setCurrentScene as sendScene } from '../Models/Obs';

export const setCurrentScene = (req: Request, res: Response): void => {
  const params = req.params;
  const name = params.name;
  const message = sendScene(name);
  res.status(200).json({
    Message: message,
  });
  console.log(message);
};

export const onSceneChange = (name: String) => {
  console.log(`scene: ${name}`)
}
