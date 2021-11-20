import express, { Application } from "express"
// import path from 'path'
// import session from 'express-session'
// import csrf from 'csurf'

import userControlRoutes from './routes/userControl'

const app: Application = express()
// const csrfProtection = csrf()

// app.set('view engine', 'ejs')
// app.set('views', 'views')

// app.use(csrfProtection)

app.use(userControlRoutes)

app.listen(5000, () => {
  console.log('listening on port 5000')
})