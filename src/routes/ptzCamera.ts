import { Router } from 'express';
import * as ptzControls from '../Controllers/ptzCamera';

const ptzRouter = Router();

ptzRouter.use((req, res, next) => {
  next();
});

ptzRouter.get('/preset/:presetId', ptzControls.recallPresetId);

ptzRouter.post('/preset', ptzControls.setPresetId);

ptzRouter.get('/zoom/:speed', ptzControls.zoom);

ptzRouter.get('/move', ptzControls.moveVarSpeed);

export default ptzRouter;
