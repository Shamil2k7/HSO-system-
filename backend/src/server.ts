import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

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

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000'];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'HSO ERP Backend is running',
  });
});
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/stock-transfers', stockTransfersRouter);
app.use('/api/sales', salesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

connectDB();

// if (!process.env.VERCEL) {
//   app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
//   });
// }

export default app;
