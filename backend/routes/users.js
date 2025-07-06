import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../server.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists (by email or username)
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ message: 'Username already exists' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with initial points and balance
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, points, balance) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, 9999, 9999.00]
    );

    // Create initial points transaction
    await pool.query(
      'INSERT INTO points_transactions (user_id, points_amount, transaction_type) VALUES (?, ?, ?)',
      [result.insertId, 9999, 'earned']
    );

    // Get the created user
    const [newUser] = await pool.query(
      'SELECT id, username, email, points, balance FROM users WHERE id = ?',
      [result.insertId]
    );

    // Generate token
    const token = jwt.sign(
      { id: result.insertId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return the same format as login
    res.status(201).json({
      token,
      user: {
        ...newUser[0],
        balance: Number(newUser[0].balance)
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        points: user.points,
        balance: Number(user.balance)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Auth middleware
export const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, points, balance, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    // Ensure all numeric values are properly formatted
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      points: Number(user.points || 0),
      balance: Number(user.balance || 0),
      created_at: user.created_at
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch user profile',
      error: error.message 
    });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  const { username, email } = req.body;

  try {
    await pool.query(
      'UPDATE users SET username = ?, email = ? WHERE id = ?',
      [username, email, req.user.id]
    );

    const [updatedUser] = await pool.query(
      'SELECT id, username, email, points, balance, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({
      ...updatedUser[0],
      balance: Number(updatedUser[0].balance)
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router; 