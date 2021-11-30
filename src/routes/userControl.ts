import { Router } from 'express'
import * as userControls from '../Controllers/userControls'
import { testConnection } from '../Models/Obs'

const router = Router()

router.get('/preset/:presetId', userControls.recallPresetId)

router.get('/zoom/:speed', userControls.zoom)

router.get('/move', userControls.moveVarSpeed)

router.get('/obs', () => testConnection)

export default router
