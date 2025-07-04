import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import usersRouter from './routes/users.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import pointsRouter from './routes/points.js';

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database configuration
const createPoolConfig = () => {
  // Log environment for debugging
  console.log('Environment:', process.env.NODE_ENV);
  
  // For Railway deployment - using Railway's provided database URL
  const railwayDbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
  
  if (railwayDbUrl && railwayDbUrl.startsWith('mysql://')) {
    console.log('Using Railway database configuration');
    try {
      const url = new URL(railwayDbUrl);
      return {
        host: url.hostname,
        user: url.username,
        password: url.password,
        database: url.pathname.substr(1),
        port: parseInt(url.port) || 3306,
        ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: false
        } : false
      };
    } catch (error) {
      console.error('Error parsing database URL:', error);
      console.log('Falling back to local configuration');
    }
  }

  // For local development or fallback
  console.log('Using local database configuration');
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shoppoint_db',
    port: parseInt(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  console.log('Database config (sanitized):', {
    ...config,
    password: '***hidden***'
  });

  return config;
};

// Create the pool with configuration
let pool;
try {
  const config = createPoolConfig();
  console.log('Database config (sanitized):', {
    ...config,
    password: '***hidden***',
    user: '***hidden***'
  });
  pool = mysql.createPool(config);
} catch (error) {
  console.error('Failed to create database pool:', error);
  process.exit(1);
}

export { pool };

// Test database connection and retry if it fails
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await pool.getConnection();
      console.log('Database connected successfully');
      connection.release();
      return true;
    } catch (err) {
      console.error(`Database connection attempt ${i + 1} failed:`, {
        code: err.code,
        errno: err.errno,
        syscall: err.syscall,
        hostname: err.hostname,
        host: err.host,
        port: err.port
      });
      
      if (i === retries - 1) {
        console.error('Max retries reached. Exiting...');
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
};

// Initialize server only after database connection
const initializeServer = async () => {
  const isConnected = await connectWithRetry();
  
  if (!isConnected) {
    console.error('Could not connect to database after multiple attempts');
    process.exit(1);
  }

  // Routes
  app.use('/api/users', usersRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/points', pointsRouter);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: 'connected'
    });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal Server Error' 
        : err.message 
    });
  });

  // Handle unhandled routes
  app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  const PORT = process.env.PORT || 3005;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });
};

// Start the server
initializeServer().catch(err => {
  console.error('Failed to initialize server:', err);
  process.exit(1);
}); 