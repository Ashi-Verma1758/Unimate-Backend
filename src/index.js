import dotenv from "dotenv";
// dotenv.config({
//     path: './env'
// })
dotenv.config();
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
import { app } from "./app.js"

// dotenv.config({
//     path: './env'
// })
// app.get("/", (req, res) => {
//   res.json({ message: "✅ Backend is live!" });
// });


connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Serveris running at port: ${process.env.PORT}`)
    })
})
.catch((err) => {
    console.log("MongoDB connection failed", err);
});


