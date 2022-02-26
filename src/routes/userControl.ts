import { Router } from 'express';
import * as userControls from '../Controllers/userControls';

const router = Router();

router.use((req, res, next) => {
  console.log("in router");
  next();
});
router.get('/preset/:presetId', userControls.recallPresetId);

router.post('/preset', userControls.setPresetId);

router.get('/zoom/:speed', userControls.zoom);

router.get('/move', userControls.moveVarSpeed);

router.get('/scene/:name', userControls.setCurrentScene);

export default router;
