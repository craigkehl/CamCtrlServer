import { Request, Response } from 'express';

import ProjectorPJLink from '../Models/ProjectorPJLink';
import { projPort } from '../util/comport';

const projector = new ProjectorPJLink();

export const setPower = (req: Request, res: Response): void => {
  const { reqCommand } = req.params
  let command: string | undefined
  switch (reqCommand) {
    case 'on':     command = projector.powerOn();     break;
    case 'off':    command = projector.powerOff();    break;
    case 'status': command = projector.powerStatus(); break;
    default:
      res.status(400).json({ error: `Unknown power command: ${reqCommand}` })
      return
  }

  projPort.write(command, (err: Error | null | undefined) => {
    if (err) {
      console.log('Error on write: ', err.message)
      res.status(500).json({ error: err.message })
    } else {
      console.log(`"Power ${reqCommand}" sent to projector`)
      res.status(200).json({ message: `Power ${reqCommand} sent` })
    }
  })
}

export const setBlank = (req: Request, res: Response): void => {
  const { reqCommand } = req.params
  let command: string | undefined
  switch (reqCommand) {
    case 'on':  command = projector.blankOn();  break;
    case 'off': command = projector.blankOff(); break;
    default:
      res.status(400).json({ error: `Unknown blank command: ${reqCommand}` })
      return
  }

  projPort.write(command, (err: Error | null | undefined) => {
    if (err) {
      console.log('Error on write: ', err.message)
      res.status(500).json({ error: err.message })
    } else {
      console.log(`"Blank ${reqCommand}" sent to projector`)
      res.status(200).json({ message: `Blank ${reqCommand} sent` })
    }
  })
}

export const setSource = (req: Request, res: Response): void => {
  const { reqCommand } = req.params
  let command: string | undefined
  switch (reqCommand) {
    case 'hdmi': command = projector.sourceHdmi1(); break;
    case 'roku': command = projector.sourceHdmi2(); break;
    default:
      res.status(501).json({ error: `Source "${reqCommand}" not supported via PJLink` })
      return
  }

  projPort.write(command, (err: Error | null | undefined) => {
    if (err) {
      console.log('Error on write: ', err.message)
      res.status(500).json({ error: err.message })
    } else {
      console.log(`"Source ${reqCommand}" sent to projector`)
      res.status(200).json({ message: `Source ${reqCommand} sent` })
    }
  })
}

export const getStatus = async (_req: Request, res: Response): Promise<void> => {
  try {
    const powerResp = await projPort.writeAndRead('%1POWR ?\r')
    const powerCode = powerResp.match(/%1POWR=(\d)/)?.[1]
    const power = powerCode === '1' ? 'on'
                : powerCode === '2' ? 'cooling'
                : powerCode === '3' ? 'warming'
                : 'off'

    let source: string | null = null
    let blank: boolean | null = null

    if (power === 'on') {
      const inputResp = await projPort.writeAndRead('%1INPT ?\r')
      const inputCode = inputResp.match(/%1INPT=(\d+)/)?.[1]
      source = inputCode === '31' ? 'hdmi'
             : inputCode === '32' ? 'roku'
             : 'unknown'

      const blankResp = await projPort.writeAndRead('%1AVMT ?\r')
      const blankCode = blankResp.match(/%1AVMT=(\d+)/)?.[1]
      blank = blankCode ? blankCode.endsWith('1') : false
    }

    res.status(200).json({ power, source, blank })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export const setRemoteKey = (_req: Request, res: Response): void => {
  res.status(501).json({ error: 'Remote keys not available via PJLink Class 1' })
}

export const setVolume = (_req: Request, res: Response): void => {
  res.status(501).json({ error: 'Volume not available via PJLink Class 1' })
}
