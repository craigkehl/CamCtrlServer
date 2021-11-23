"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// import path from 'path'
// import session from 'express-session'
const cors_1 = __importDefault(require("cors"));
const userControl_1 = __importDefault(require("./routes/userControl"));
const app = (0, express_1.default)();
// app.set('view engine', 'ejs')
// app.set('views', 'views')
app.use((0, cors_1.default)());
app.use(userControl_1.default);
app.listen(5000, () => {
    console.log('listening on port 5000');
});
