import { Router } from 'express'
import * as userControls from '../Controllers/userControls'

const router = Router()


router.get('/preset/:presetId', userControls.recallPresetId)


export default router