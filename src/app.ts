import path from 'path'
import fs, { readFileSync } from 'fs'
import express, { Application } from 'express'
import Cors from 'cors'

import dotenv from 'dotenv'

import userControlRoutes from './routes/userControl'

const app: Application = express()

app.use(Cors())
app.use(dotenv.config)


const privateKey = readFileSync(path.resolve(__dirname, './SSL/server.key'))
const certificate = readFileSync(path.resolve(__dirname, './SSL/server.cert'))

app.use(userControlRoutes)

app.listen(5000, () => {
  console.log('listening on port 5000')
})