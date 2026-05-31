import { Request, Response } from 'express';
import {
  setCurrentScene as sendScene,
  getObsStatus,
  reconnect,
  getFullState,
  toggleSceneVisibility,
  resetVisibility,
} from '../Models/Obs';

export const getState = (_req: Request, res: Response): void => {
  getFullState()
    .then(state => res.status(200).json(state))
    .catch(() =>
      res.status(200).json({ connection: getObsStatus(), currentScene: null, scenes: [] })
    );
};

export const setSceneVisibility = (req: Request, res: Response): void => {
  const { name, isShow } = req.body;
  if (typeof name !== 'string' || typeof isShow !== 'boolean') {
    res.status(400).json({ error: 'name (string) and isShow (boolean) required' });
    return;
  }
  toggleSceneVisibility(name, isShow);
  res.status(200).json({ ok: true });
};

export const newMeeting = (_req: Request, res: Response): void => {
  resetVisibility();
  res.status(200).json({ ok: true });
};

export const setCurrentScene = (req: Request, res: Response): void => {
  const name = req.params.name;
  sendScene(name)
    .then(message => {
      console.log(message);
      res.status(200).json({ Message: message });
    })
    .catch((err: Error) => {
      res.status(503).json({ error: err.message, obsStatus: getObsStatus() });
    });
};

export const triggerReconnect = (_req: Request, res: Response): void => {
  reconnect();
  res.status(200).json({ status: 'connecting' });
};

export const onSceneChange = (name: String) => {
  console.log(`scene changed to: ${name}`);
};
