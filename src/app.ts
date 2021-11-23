import express, { Application } from 'express';
// import path from 'path'
// import session from 'express-session'
import Cors from 'cors';
import userControlRoutes from './routes/userControl';

const app: Application = express();

// app.set('view engine', 'ejs')
// app.set('views', 'views')
app.use(Cors());

app.use(userControlRoutes);

app.listen(5000, () => {
  console.log('listening on port 5000');
});
