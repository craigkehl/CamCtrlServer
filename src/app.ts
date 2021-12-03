// import path from 'path'
// import fs, { readFileSync } from 'fs'
import express, { Application } from 'express'
import Cors from 'cors'

import dotenv from 'dotenv'

import userControlRoutes from './routes/userControl'

dotenv.config()

const app: Application = express()

app.use(Cors())


// const privateKey = readFileSync(path.resolve(__dirname, './SSL/server.key'))
// const certificate = readFileSync(path.resolve(__dirname, './SSL/server.cert'))

app.use(userControlRoutes)

app.listen(4000, () => {
  console.log('listening on port 4000')
})