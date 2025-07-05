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

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://sw-pointshop-frontend-ilu0vp9x4-doberlius-projects.vercel.app']
    : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Database settings
let pool;

if (process.env.MYSQL_URL) {
  //  Use connection URL (from Railway)
  pool = mysql.createPool(process.env.MYSQL_URL + '?ssl={"rejectUnauthorized":true}');
} else {
  //  Manual config fallback
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: process.env.NODE_ENV === 'production' ? 20 : 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
}

export { pool };

//  Retry DB connection
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await pool.getConnection();
      console.log('✅ Database connected');
      connection.release();
      return;
    } catch (err) {
      console.error(`❌ DB connection attempt ${i + 1} failed:`, err);
      if (i === retries - 1) process.exit(1);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

await connectWithRetry();

// Routes
app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/points', pointsRouter);

//  Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: process.env.MYSQL_URL ? 'Using connection URL' : process.env.DB_NAME,
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to SWPointshop API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: {
        users: '/api/users',
        products: '/api/products',
        orders: '/api/orders',
        points: '/api/points'
      }
    }
  });
});

//  Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message,
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start Server
const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT} (${process.env.NODE_ENV})`);
});
