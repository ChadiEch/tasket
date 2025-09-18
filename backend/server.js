const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Tasket Backend Server is running!' });
});

// API routes would go here
// app.use('/api/auth', authRoutes);
// app.use('/api/departments', departmentRoutes);
// app.use('/api/employees', employeeRoutes);
// app.use('/api/tasks', taskRoutes);

// WebSocket connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5002;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});