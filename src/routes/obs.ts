import { Router } from 'express';
import * as obsControls from '../Controllers/obs';

const obsRouter = Router();

obsRouter.use((req, res, next) => {
  console.log('in obsRouter');
  next();
});

obsRouter.get('/scene/:name', obsControls.setCurrentScene);

export default obsRouter;
