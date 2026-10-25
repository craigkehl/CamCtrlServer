import { Router } from 'express';
import * as obsControls from '../Controllers/obs';

const obsRouter = Router();

obsRouter.get('/state', obsControls.getState);
obsRouter.post('/reconnect', obsControls.triggerReconnect);
obsRouter.post('/scene-visibility', obsControls.setSceneVisibility);
obsRouter.post('/new-meeting', obsControls.newMeeting);
obsRouter.get('/scene/:name', obsControls.setCurrentScene);

export default obsRouter;
