import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';

// Import Route Handlers
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import productsRouter from './routes/products';
import inventoryRouter from './routes/inventory';
import stockTransfersRouter from './routes/stockTransfers';
import salesRouter from './routes/sales';
import dashboardRouter from './routes/dashboard';
import reportsRouter from './routes/reports';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Next.js dev server
app.use(
  cors({
    origin: '*', // We can restrict to frontend URL (e.g. http://localhost:3000) in production
    credentials: true,
  })
);

app.use(express.json());

// Set up routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/stock-transfers', stockTransfersRouter);
app.use('/api/sales', salesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Connect Database and Start Server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
