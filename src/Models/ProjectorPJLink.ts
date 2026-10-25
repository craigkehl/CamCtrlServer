// PJLink Class 1 commands for ViewSonic LS831WU (192.168.108.11:4352)
// For full RS-232 binary commands see Projector.ts

class ProjectorPJLink {
  powerOn(): string    { return '%1POWR 1\r' }
  powerOff(): string   { return '%1POWR 0\r' }
  powerStatus(): string { return '%1POWR ?\r' }

  blankOn(): string    { return '%1AVMT 31\r' }  // video + audio mute
  blankOff(): string   { return '%1AVMT 30\r' }
  blankStatus(): string { return '%1AVMT ?\r' }

  sourceHdmi1(): string  { return '%1INPT 31\r' }  // HDMI input 1
  sourceHdmi2(): string  { return '%1INPT 32\r' }  // HDMI input 2 (Roku)
  sourceStatus(): string { return '%1INPT ?\r' }

  // Not available in PJLink Class 1:
  // - Volume control  → use %2SVOL if Class 2 is ever confirmed
  // - Remote keys     → menu, arrows, enter, exit, etc.
}

export default ProjectorPJLink;
