import dotenv from "dotenv";
dotenv.config({
    path: './env'
});

import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
import { app } from "./app.js"
import http from 'http';
import { Server } from 'socket.io';
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


