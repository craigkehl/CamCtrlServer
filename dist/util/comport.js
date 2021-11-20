"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const serialport_1 = __importDefault(require("serialport"));
const port = new serialport_1.default("COM5", {
    baudRate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1
});
port.on('error', function (err) {
    console.log('Error: ', err.message);
});
exports.default = port;
