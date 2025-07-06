import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import usersRouter from './routes/users.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import pointsRouter from './routes/points.js';

dotenv.config();

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'https://s-wpointshop.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Handle OPTIONS preflight
app.options('*', (req, res) => {
  res.status(200).end();
});

// DATABASE CONNECT
const pool = mysql.createPool(
  process.env.NODE_ENV === 'production' && process.env.MYSQL_URL
    ? { uri: process.env.MYSQL_URL }
    : {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,    
        database: process.env.DB_DATABASE,
        port: process.env.DB_PORT || 3306,
      }
);

// Test connection
try {
  const connection = await pool.getConnection();
  console.log('✅ Database connected');
  connection.release();
} catch (err) {
  console.error('Database connection failed:', err);
  process.exit(1);
}

// ROUTES
app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/points', pointsRouter);

// HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// ROOT
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to SWPointshop API' });
});

// ERROR HANDLING
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// START
const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export { pool };