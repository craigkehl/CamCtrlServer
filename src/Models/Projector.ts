class Projector {
  readonly CMD_TYPE_SEND: number[] = [0X06]  
  readonly CMD_TYPE_REMOTE: number[] = [0X02]
  readonly CMD_BASE: number[] = [0x14, 0x00, 0x04, 0x00, 0x34];
  readonly STATUS_BASE: number[] = [0x07, 0x14, 0x00, 0x05, 0x00, 0x034, 0x00, 0x00]

  readonly CMD = {
    BLANK: {
      on: [0x12, 0x09, 0x01, 0x68],
      off: [0x12,0x09, 0x00, 0x67],
    },
    POWER: {
      on: [0x11, 0x00, 0x00, 0x5D],
      off: [0x11, 0x01, 0x00, 0x5E],
    },
    MUTE: {
      on: [0x14, 0x00, 0x01, 0x61],
      off: [0x14, 0x00, 0x00, 0x60],
    },
    VOLUME: {
      increase: [0x14, 0x01, 0x00, 0x61],
      decrease: [0x14, 0x02, 0x00, 0x62]
    },
    REMOTE_KEY: {
      menu: [0x02, 0x04, 0x0F, 0x061],
      exit: [0x02, 0x04, 0x13, 0x65],
      top: [0x02, 0x04, 0x0B, 0x5D],
      bottom: [0x02, 0x04, 0x0C, 0x5E],
      left: [0x02, 0x04, 0x0D, 0x5F],
      right: [0x02, 0x04, 0x0E, 0x60],
      source: [0x02, 0x04, 0x04, 0x56],
      enter: [0x02, 0x04, 0x15, 0x67],
      auto: [0x02, 0x04, 0x08, 0x5A],
    },
    SOURCE: {
      comp1: [0x13, 0x01, 0x00, 0x60],
      hdmi1: [0x13, 0x01, 0x03, 0x63],
      hdmi2: [0x13, 0x01, 0x07, 0x67],
      composite_video: [0x13, 0x01, 0x05, 0x65],
      s_video: [0x13, 0x01, 0x06, 0x66],
      hd_base_t: [0x13, 0x01, 0x0C, 0x6C],
    }
  }
  
  readonly STATUS = {
    BLANK: [0x12, 0x09, 0x68],
    POWER: [0x11, 0x00, 0x5E],
    SOURCE: [0x13, 0x01, 0x61]
  }

  //#region commands
  powerOn(): number[] {
    return [...this.CMD_TYPE_SEND, ...this.CMD_BASE, ...this.CMD.POWER.on]
  }

  powerOff(): number[] {
    return [...this.CMD_TYPE_SEND, ...this.CMD_BASE, ...this.CMD.POWER.off]
  }

  blankOn(): number[] {
    return [...this.CMD_TYPE_SEND, ...this.CMD_BASE, ...this.CMD.BLANK.on]
  }

  blankOff(): number[] {
    return [...this.CMD_TYPE_SEND, ...this.CMD_BASE, ...this.CMD.BLANK.off]
  }

  muteOn(): number[] {
    return [...this.CMD_TYPE_SEND, ...this.CMD_BASE, ...this.CMD.MUTE.on]
  }

  muteOff(): number[] {
    return [...this.CMD_TYPE_SEND, ...this.CMD_BASE, ...this.CMD.MUTE.off]
  }

  volumeIncrease(): number[] {
    return [...this.CMD_TYPE_SEND, ...this.CMD_BASE, ...this.CMD.VOLUME.increase]
  }

  volumeDecrease(): number[] {
    return [...this.CMD_TYPE_SEND, ...this.CMD_BASE, ...this.CMD.VOLUME.decrease]
  }
  //#endregion
  
  //#region remote keys
  remoteKeyMenu(): number[] {
    return [...this.CMD_TYPE_REMOTE, ...this.CMD_BASE, ...this.CMD.REMOTE_KEY.menu]
  }

  remoteKeyExit(): number[] {
    return [...this.CMD_TYPE_REMOTE, ...this.CMD_BASE, ...this.CMD.REMOTE_KEY.exit]
  }

  remoteKeyTop(): number[] {
    return [...this.CMD_TYPE_REMOTE, ...this.CMD_BASE, ...this.CMD.REMOTE_KEY.top]
  }

  remoteKeyBottom(): number[] {
    return [...this.CMD_TYPE_REMOTE, ...this.CMD_BASE, ...this.CMD.REMOTE_KEY.bottom]
  }

  remoteKeyLeft(): number[] {
    return [...this.CMD_TYPE_REMOTE, ...this.CMD_BASE, ...this.CMD.REMOTE_KEY.left]
  }

  remoteKeyRight(): number[] {
    return [...this.CMD_TYPE_REMOTE, ...this.CMD_BASE, ...this.CMD.REMOTE_KEY.right]
  }

  remoteKeySource(): number[] {
    return [...this.CMD_TYPE_REMOTE, ...this.CMD_BASE, ...this.CMD.REMOTE_KEY.source]
  }

  remoteKeyEnter(): number[] {
    return [...this.CMD_TYPE_REMOTE, ...this.CMD_BASE, ...this.CMD.REMOTE_KEY.enter]
  }

  remoteKeyAuto(): number[] {
    return [...this.CMD_TYPE_REMOTE, ...this.CMD_BASE, ...this.CMD.REMOTE_KEY.auto]
  }

  sourceComp1(): number[] {
    return [...this.CMD_TYPE_SEND, ...this.CMD_BASE, ...this.CMD.SOURCE.comp1]
  }

  sourceHdmi1(): number[] {
    return [...this.CMD_TYPE_SEND, ...this.CMD_BASE, ...this.CMD.SOURCE.hdmi1]
  }

  sourceHdmi2(): number[] {
    return [...this.CMD_TYPE_SEND, ...this.CMD_BASE, ...this.CMD.SOURCE.hdmi2]
  }

  sourceCompositeVideo(): number[] {
    return [...this.CMD_TYPE_SEND, ...this.CMD_BASE, ...this.CMD.SOURCE.composite_video]
  }

  sourceSVideo(): number[] {
    return [...this.CMD_TYPE_SEND, ...this.CMD_BASE, ...this.CMD.SOURCE.s_video]
  }

  sourceHdBaseT(): number[] {
    return [...this.CMD_TYPE_SEND, ...this.CMD_BASE, ...this.CMD.SOURCE.hd_base_t]
  }
  //#endregion

  //#region status
  blankStatus(): number[] {
      return [...this.STATUS_BASE, ...this.STATUS.BLANK]
  }
  
  powerStatus(): number[] {
    return [...this.STATUS_BASE, ...this.STATUS.POWER]
  }

  sourceStatus(): number[]{
    return [...this.STATUS_BASE, ...this.STATUS.SOURCE]
  }
  //#endregion
}

export default Projector;