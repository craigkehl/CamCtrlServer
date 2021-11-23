class Camera {
  panSpeed: number;
  tiltSpeed: number;

  constructor(panSpeed: number = 0x0c, tiltSpeed: number = 0x09) {
    this.panSpeed = panSpeed;
    this.tiltSpeed = tiltSpeed;
  }

  readonly cmdBase: number[] = [0x81, 0x01];
  readonly cmdEnd: number = 0xff;

  readonly cmd: {
    power: {
      on: number[];
      off: number[];
    };
    zoom: {
      var: number[];
      stop: number[];
      tele: number[];
      wide: number[];
    };
  } = {
    power: {
      on: [0x04, 0x00, 0x02],
      off: [0x04, 0x00, 0x03],
    },
    zoom: {
      var: [0x04, 0x07],
      stop: [0x04, 0x07, 0x00],
      tele: [0x04, 0x07, 0x02],
      wide: [0x04, 0x07, 0x03],
    },
  };

  powerOn(): number[] {
    const command: number[] = [...this.cmdBase];
    command.push(...this.cmd.power.on);
    command.push(this.cmdEnd);
    return command;
  }

  powerOff(): number[] {
    const command: number[] = [...this.cmdBase];
    command.push(...this.cmd.power.off);
    command.push(this.cmdEnd);
    return command;
  }

  zoomStop(): number[] {
    const command: number[] = [...this.cmdBase];
    command.push(...this.cmd.zoom.stop);
    command.push(this.cmdEnd);
    return command;
  }

  zoom(speed: number): number[] {
    const command: number[] = [...this.cmdBase]; //0x81 0x01
    command.push(...this.cmd.zoom.var); //0x04 0x07

    let action: number;
    if (speed === 0) {
      action = 0;
    } else if (speed > 0) {
      action = 0x20 + speed;
    } else {
      action = 0x30 + speed * -1;
    }

    command.push(action, this.cmdEnd);
    return command;
  }

  zoomTele(): number[] {
    const command: number[] = [...this.cmdBase];
    command.push(...this.cmd.zoom.tele);
    command.push(this.cmdEnd);
    return command;
  }

  zoomWide(): number[] {
    const command: number[] = [...this.cmdBase];
    command.push(...this.cmd.zoom.wide);
    command.push(this.cmdEnd);
    return command;
  }

  presetGet(n: number): number[] {
    const command: number[] = [...this.cmdBase, 0x04, 0x3f, 0x02];
    command.push(n);
    command.push(this.cmdEnd);
    return command;
  }

  presetSet(n: number): number[] {
    const command: number[] = [...this.cmdBase, 0x04, 0x3f, 0x01];
    command.push(n);
    command.push(this.cmdEnd);
    return command;
  }
}

export default Camera;
