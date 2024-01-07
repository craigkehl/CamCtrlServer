import express, { Application } from 'express';
import Cors from 'cors';

import dotenv from 'dotenv';

import ptzCameraRouter from './routes/ptzCamera'
import obsRouter from './routes/obs';
import projectorRouter from './routes/projector'

dotenv.config();

const app: Application = express();

app.use(Cors());
app.use(express.json());

app.use('/api/proj', projectorRouter)
app.use('/api', ptzCameraRouter)
app.use('/api', obsRouter)

app.listen(4000, () => {
  console.log('listening on port 4000');
});