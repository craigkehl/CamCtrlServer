import { Router } from 'express';
import * as userControls from '../Controllers/userControls';

const router = Router();

router.get('/preset/:presetId', userControls.recallPresetId);

router.get('/zoom/:speed', userControls.zoom);

export default router;
