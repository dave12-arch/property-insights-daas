import express from 'express';
import { createServer } from 'http'; // Back to http
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { rateLimiter } from './middlewares/rateLimiter.js';
import { globalErrorHandler } from './middlewares/errorHandler.js';
import { syncHousingData } from './services/dataFetcher.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Revert to basic HTTP server
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimiter);

app.get('/test-connection', (req, res) => {
  console.log("TEST CONNECTION RECEIVED!");
  res.send({ message: "Success! The server is receiving requests." });
});

app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on('join_neighborhood', (neighborhoodId) => {
    socket.join(`neighborhood:${neighborhoodId}`);
  });
});

app.set('io', io);
app.use(globalErrorHandler);

syncHousingData();

httpServer.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});