import { Router } from 'express'
import * as userControls from '../Controllers/userControls'

const router = Router()

router.get('/preset/:presetId', userControls.recallPresetId)

router.get('/zoom/:speed', userControls.zoom)

router.get('/move', userControls.moveVarSpeed)

router.get('/scene/:name', userControls.setCurrentScene)

export default router
