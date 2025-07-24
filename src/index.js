import dotenv from 'dotenv';
dotenv.config(); 
// This log should now show the correct value
console.log('--- DEBUGGING: process.env.ACCESS_TOKEN_SECRET immediately after dotenv.config() in index.js:', process.env.ACCESS_TOKEN_SECRET);
import { app } from "./app.js"
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";

import http from 'http';
import { Server } from 'socket.io';
// Import the initializer function
import { initializeJwtSecrets } from './config/jwt.config.js'; // Adjust path if needed
initializeJwtSecrets(process.env.ACCESS_TOKEN_SECRET, process.env.REFRESH_TOKEN_SECRET);
console.log('--- JWT secrets passed to initializeJwtSecrets.'); // Add this log

const server = http.createServer(app);

//socket initialise
const io = new Server(server, {
cors: {
origin: process.env.CORS_ORIGIN || "http://localhost:3000",
credentials: true,
}
});

//socket event handlers
io.on("connection", (socket) => {
console.log("📡 New user connected:", socket.id);

socket.on("joinRoom", ({ conversationId }) => {
socket.join(conversationId);
console.log(`User joined room: ${conversationId}`);
});
socket.on("sendMessage", ({ conversationId, sender, text }) => {
io.to(conversationId).emit("receiveMessage", {
sender,
text,
sentAt: new Date()
});
});

socket.on("disconnect", () => {
console.log("❌ User disconnected:", socket.id);
});
});
connectDB()
.then(() => {
    server.listen(process.env.PORT || 8000, ()=>{
        console.log(`Serveris running at port: ${process.env.PORT}`)
        console.log('📂 Using DB:', mongoose.connection.name);
    })
})
.catch((err) => {
    console.log("MongoDB connection failed", err);
});


