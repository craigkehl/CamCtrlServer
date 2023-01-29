import { Router } from 'express'
import * as projectorControls from '../Controllers/projector'

const projRouter = Router()

projRouter.use((req, res, next) => {
  console.log('In projRouter')
  next()
})

projRouter.get('/power/:reqCommand', projectorControls.setPower)

projRouter.get('/blank/:reqCommand', projectorControls.setBlank)

projRouter.get('/remote-key/:reqCommand', projectorControls.setRemoteKey)

projRouter.get('/source/:reqCommand', projectorControls.setSource)

projRouter.get('/volume/:reqCommand/:value', projectorControls.setVolume)

export default projRouter