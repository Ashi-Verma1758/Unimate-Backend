
import express from 'express';
import cors from 'cors';
import connectDB from './db.js'; 
import authRoutes from './src/routes/auth.routes.js';
import userRoutes from './src/routes/user.routes.js';
import projectRoutes from './src/routes/project.routes.js';


const app = express();
const PORT = 5000;
connectDB(); // ✅ This actually runs the MongoDB connection


app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);

app.get('/', (req, res) => {
  res.send('Unimate backend is running 🚀');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
