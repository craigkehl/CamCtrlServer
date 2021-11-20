"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// import path from 'path'
// import session from 'express-session'
// import csrf from 'csurf'
const userControl_1 = __importDefault(require("./routes/userControl"));
const app = (0, express_1.default)();
// const csrfProtection = csrf()
// app.set('view engine', 'ejs')
// app.set('views', 'views')
// app.use(csrfProtection)
app.use(userControl_1.default);
app.listen(5000, () => {
    console.log('listening on port 5000');
});
