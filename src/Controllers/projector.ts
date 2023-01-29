import { Request, Response, NextFunction } from 'express';

import Projector from '../Models/Projector';
import { projPort } from '../util/comport';

const projector = new Projector();

export const setPower = (req: Request, res: Response): void => {
  const { reqCommand } = req.params
  let command: number[] | undefined
  switch (reqCommand) {
    case 'on':
      command = projector.powerOn()
      break;
  
    case 'off':
      command = projector.powerOff()
      break;
  
    case 'status':
      command = projector.powerStatus()
      break;
  
    default:
      command = undefined
      console.log('Command not received in ProjController')
      //#Todo throw error
      break;
  }

  if (command) {
    projPort.write(command, function (err) {
      if (err) {
        console.log('Error on write: ', err.message);
        res.status(500)
          .json(err?.message || 'Error in ProjController')
        return
      } else {
        console.log(`"Power ${reqCommand}" sent to the projector`);
        res.status(200).json({
          Message: `"Power  ${reqCommand}" sent to the projector`,
        });
      }
    })
  }
}

export const setBlank = (req: Request, res: Response): void => {
  const { reqCommand } = req.params
  let command: number[] | undefined
  switch (reqCommand) {
    case 'on':
      command = projector.blankOn()
      break;
  
    case 'off':
      command = projector.blankOff()
      break;
  
    default:
      command = undefined
      console.log('Command not received in ProjController')
      //#Todo throw error
      break;
  }

  if (command) {
    projPort.write(command, function (err) {
      if (err) {
        console.log('Error on write: ', err.message);
        res.status(500)
          .json(err?.message || 'Error in ProjController')
        return
      } else {
        console.log(`"Blank ${reqCommand}" sent to the projector`);
        res.status(200).json({
          Message: `"Blank  ${reqCommand}" sent to the projector`,
        });
      }
    })
  }
}

export const setRemoteKey = (req: Request, res: Response): void => {
  const { reqCommand } = req.params
  let command: number[] | undefined
  switch (reqCommand) {
    case 'menu':
      command = projector.remoteKeyMenu()
      break;
  
    case 'exit':
      command = projector.remoteKeyExit()
      break;
  
    case 'top':
      command = projector.remoteKeyTop()
      break;
  
    case 'bottom':
      command = projector.remoteKeyBottom()
      break;
  
    case 'left':
      command = projector.remoteKeyLeft()
      break;
  
    case 'right':
      command = projector.remoteKeyRight()
      break;
  
    case 'source':
      command = projector.remoteKeySource()
      break;
  
    case 'enter':
      command = projector.remoteKeyEnter()
      break;
  
    case 'auto':
      command = projector.remoteKeyAuto()
      break;
  
    default:
      command = undefined
      console.log('Command not received in ProjController')
      //#Todo throw error
      break;
  }

  if (command) {
    projPort.write(command, function (err) {
      if (err) {
        console.log('Error on write: ', err.message);
        res.status(500)
          .json(err?.message || 'Error in ProjController')
        return
      } else {
        console.log(`"Remote key ${reqCommand}" sent to the projector`);
        res.status(200).json({
          Message: `"Remote key  ${reqCommand}" sent to the projector`,
        });
      }
    })
  }
}

export const setSource = (req: Request, res: Response): void => {
  const { reqCommand } = req.params
  let command: number[] | undefined
  switch (reqCommand) {
    case 'comp1':
      command = projector.sourceComp1()
      break;
  
    case 'hdmi1':
      command = projector.sourceHdmi1()
      break;
  
    case 'hdmi2':
      command = projector.sourceHdmi2()
      break;
  
    case 'compositeVideo':
      command = projector.sourceCompositeVideo()
      break;
  
    case 'sVideo':
      command = projector.sourceSVideo()
      break;
  
    case 'hdBaseT':
      command = projector.sourceHdBaseT()
      break;
    
    default:
      command = undefined
      console.log('Command not received in ProjController')
      //#Todo throw error
      break;
  }

  if (command) {
    projPort.write(command, function (err) {
      if (err) {
        console.log('Error on write: ', err.message);
        res.status(500)
          .json(err?.message || 'Error in ProjController')
        return
      } else {
        console.log(`"Source ${reqCommand}" sent to the projector`);
        res.status(200).json({
          Message: `"Source  ${reqCommand}" sent to the projector`,
        });
      }
    })
  }
}

export const setVolume = (req: Request, res: Response): void => {
  console.log('In setVolume')
  const { reqCommand, value } = req.params
  console.log(reqCommand, " ", value)
  // let command = [0x06, 0x14, 0x00, 0x04, 0x00, 0x34, 0x13, 0x2A, 0x11, 0x9A]
  let command;
  switch (reqCommand) {
    case 'value':
      command = projector.volumeWriteValue(parseInt(value, 10))
      break;
  
    case 'increase':
      command = projector.volumeIncrease()
      break;
  
    case 'decrease':
      command = projector.volumeDecrease()
      break;
  
    default:
      command = undefined
      console.log('Command not received in ProjController')
      //#Todo throw error
      break;
  }

  if (command) {
    console.log(command)
    projPort.write(command, function (err) {
      if (err) {
        console.log('Error on write: ', err.message);
        res.status(500)
          .json(err?.message || 'Error in ProjController')
        return
      } else {
        console.log(`volume" sent to the projector`);
        res.status(200).json({
          Message: `"Source volume" sent to the projector`,
        });
      }
    })
  }

  const status = projector.volumeStatus()
  projPort.write(status, function (err) {
    if (err) {
      console.log('Error on write: ', err.message);
      }
  })
  console.log('command end')
}
