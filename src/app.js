

import express from 'express';
import cors from 'cors';

import fileUpload from 'express-fileupload';
import cookieParser from 'cookie-parser';
const app = express(); // ✅ Declare app first
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',//process.env.CORS_ORIGIN,
  credentials: true,
}));
// console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN); 
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(fileUpload({ useTempFiles: true }));


 // ✅ After express is initialized

// Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import eventRoutes from './routes/event.routes.js';
import chatRoutes from './routes/chat.routes.js';
import inviteRoutes from './routes/invite.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';


app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/invites', inviteRoutes);
export { app };
