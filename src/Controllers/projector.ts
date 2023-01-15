import { Request, Response, NextFunction } from 'express';
import Projector from '../Models/Projector';

const projector = new Projector();

export const sendPowerOn = (req: Request, res: Response): void => {
  const command = projector.powerOn()
}