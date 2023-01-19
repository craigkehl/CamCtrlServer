import { Router } from 'express'
import * as projectorControls from '../Controllers/projector'

const projRouter = Router()

projRouter.use((req, res, next) => {
  console.log('In projRouter')
  next()
})

projRouter.get('/proj/power/:reqCommand', projectorControls.setPower)

projRouter.get('/proj/blank/:reqCommand', projectorControls.setBlank)

projRouter.get('/proj/remote-key/:reqCommand', projectorControls.setRemoteKey)

projRouter.get('/proj/source/:reqCommand', projectorControls.setSource)

export default projRouter