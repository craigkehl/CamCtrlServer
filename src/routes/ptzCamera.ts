import { Router } from 'express';
import * as ptzControls from '../Controllers/ptzCamera';

const ptzCameraRouter = Router();

ptzCameraRouter.use((req, res, next) => {
  next();
});

ptzCameraRouter.get('/preset/:presetId', ptzControls.recallPresetId);

ptzCameraRouter.post('/preset', ptzControls.setPresetId);

ptzCameraRouter.get('/zoom/:speed', ptzControls.zoom);

ptzCameraRouter.get('/move', ptzControls.moveVarSpeed);

export default ptzCameraRouter;
