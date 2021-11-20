class Camera {
  panSpeed: number
  tiltSpeed: number
  
  constructor(panSpeed: number = 0x0C, tiltSpeed: number = 0x09) {
    this.panSpeed = panSpeed
    this.tiltSpeed = tiltSpeed
  }

  readonly cmdBase: number[] = [0x81, 0x01]
  readonly cmdEnd: number = 0xFF

  readonly cmd: {
    power: {
      on: number[],
      off: number[]
    },
    zoom: {
      stop: number[],
      tele: number[],
      wide: number[]
    }
  } = {
    power: {
      on: [0x04, 0x00, 0x02],
      off: [0x04, 0x00, 0x03]
    },
    zoom: {
      stop: [0x04, 0x07, 0x00],
      tele: [0x04, 0x07, 0x02],
      wide: [0x04, 0x07, 0x03]
    }
  }

  powerOn(): number[] {
    const command: number[] = [...this.cmdBase]
    command.push(...this.cmd.power.on)
    command.push(this.cmdEnd)
    return command
  }

  powerOff(): number[] {
    const command: number[] = [...this.cmdBase]
    command.push(...this.cmd.power.off)
    command.push(this.cmdEnd)
    return command
  }

  zoomStop(): number[] {
    const command: number[] = [...this.cmdBase]
    command.push(...this.cmd.zoom.stop)
    command.push(this.cmdEnd)
    return command
  }

  zoomTele(): number[] {
    const command: number[] = [...this.cmdBase]
    command.push(...this.cmd.zoom.tele)
    command.push(this.cmdEnd)
    return command
  }

  zoomWide(): number[] {
    const command: number[] = [...this.cmdBase]
    command.push(...this.cmd.zoom.wide)
    command.push(this.cmdEnd)
    return command
  }

  

  presetGet(n:number): number[] {
    const command: number[] = [...this.cmdBase, 0x04, 0x3F, 0x02]
    command.push(n)
    command.push(this.cmdEnd)
    return command
  }
  
  presetSet(n: number): number[] {
    const command: number[] = [...this.cmdBase, 0x04, 0x3F, 0x01]
    command.push(n)
    command.push(this.cmdEnd)
    return command
  }

  
}

export default Camera