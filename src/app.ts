import express, { Application } from 'express';
import Cors from 'cors';

import dotenv from 'dotenv';

import userControlRoutes from './routes/userControl';

dotenv.config();

const app: Application = express();

app.use(Cors());
app.use(express.json());

app.use(userControlRoutes);

app.listen(4000, () => {
  console.log('listening on port 4000');
});