import { Router } from 'express';
import * as switcherControls from '../Controllers/switcher';

const switcherRouter = Router();

switcherRouter.get('/status', switcherControls.getStatus);
switcherRouter.get('/input/:inputNum', switcherControls.selectInput);

export default switcherRouter;
