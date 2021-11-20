"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recallPresetId = void 0;
const Camera_1 = __importDefault(require("../Models/Camera"));
const comport_1 = __importDefault(require("../util/comport"));
const camera = new Camera_1.default();
const recallPresetId = (req, res) => {
    console.log('Request received');
    const params = req.params;
    const presetId = params.presetId;
    const command = camera.presetGet(parseInt(presetId));
    comport_1.default.write(command, function (err) {
        if (err) {
            return console.log("Error on write: ", err.message);
        }
        console.log(`Preset ${presetId} has been called and set`);
        res.status(200).json({
            Message: `Preset ${presetId} has been called and set`,
        });
    });
};
exports.recallPresetId = recallPresetId;
