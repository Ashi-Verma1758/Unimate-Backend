import express from 'express'; //d
import cors from "cors";//d
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser'; //d
const app = express();//d


dotenv.config();
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

//routes




export { app }//d
