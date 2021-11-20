"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Camera {
    constructor(panSpeed = 0x0C, tiltSpeed = 0x09) {
        this.cmdBase = [0x81, 0x01];
        this.cmdEnd = 0xFF;
        this.cmd = {
            power: {
                on: [0x04, 0x00, 0x02],
                off: [0x04, 0x00, 0x03]
            },
            zoom: {
                stop: [0x04, 0x07, 0x00],
                tele: [0x04, 0x07, 0x02],
                wide: [0x04, 0x07, 0x03]
            }
        };
        this.panSpeed = panSpeed;
        this.tiltSpeed = tiltSpeed;
    }
    powerOn() {
        const command = [...this.cmdBase];
        command.push(...this.cmd.power.on);
        command.push(this.cmdEnd);
        return command;
    }
    powerOff() {
        const command = [...this.cmdBase];
        command.push(...this.cmd.power.off);
        command.push(this.cmdEnd);
        return command;
    }
    zoomStop() {
        const command = [...this.cmdBase];
        command.push(...this.cmd.zoom.stop);
        command.push(this.cmdEnd);
        return command;
    }
    zoomTele() {
        const command = [...this.cmdBase];
        command.push(...this.cmd.zoom.tele);
        command.push(this.cmdEnd);
        return command;
    }
    zoomWide() {
        const command = [...this.cmdBase];
        command.push(...this.cmd.zoom.wide);
        command.push(this.cmdEnd);
        return command;
    }
    presetGet(n) {
        const command = [...this.cmdBase, 0x04, 0x3F, 0x02];
        command.push(n);
        command.push(this.cmdEnd);
        return command;
    }
    presetSet(n) {
        const command = [...this.cmdBase, 0x04, 0x3F, 0x01];
        command.push(n);
        command.push(this.cmdEnd);
        return command;
    }
}
exports.default = Camera;
