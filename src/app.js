import express from 'express'; //d
import cors from "cors";//d
import dotenv from 'dotenv';
dotenv.config();

import cookieParser from 'cookie-parser'; //d
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import eventRoutes from './routes/event.routes.js'
const app = express();//d


app.use(express.json());
// app.use(cookieParser());


app.use(cors({
  origin: process.env.CORS_ORIGIN,// "https://care-finder-frontend.vercel.app/",  // frontend origin
  credentials: true,
}));
// app.use(express.json());


app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"})) //allow nested object =urlencoded
app.use(express.static("public"))
app.use(cookieParser())
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/events', eventRoutes);
//routes




export { app }//d
