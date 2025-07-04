import express from 'express';
import { pool } from '../server.js';
import { auth } from './users.js';

const router = express.Router();

// Get user's points balance and wallet balance
router.get('/balance', auth, async (req, res) => {
  try {
    const [user] = await pool.query(
      'SELECT points, balance FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({
      points: user[0].points,
      balance: Number(user[0].balance)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's points transactions history
router.get('/transactions', auth, async (req, res) => {
  try {
    const [transactions] = await pool.query(
      `SELECT 
        pt.*,
        o.total_amount as order_total,
        o.id as order_id,
        o.status as order_status,
        o.payment_status
       FROM points_transactions pt
       LEFT JOIN orders o ON pt.order_id = o.id
       WHERE pt.user_id = ?
       ORDER BY pt.created_at DESC`,
      [req.user.id]
    );

    // Format the transactions
    const formattedTransactions = transactions.map(transaction => ({
      ...transaction,
      points: Number(transaction.points_amount),
      order_total: transaction.order_total ? Number(transaction.order_total) : null
    }));

    res.json(formattedTransactions);
  } catch (error) {
    console.error('Error fetching points transactions:', error);
    res.status(500).json({ message: 'Failed to fetch points transactions' });
  }
});

// Get products available for points redemption
router.get('/products', auth, async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.points_price IS NOT NULL AND p.points_price > 0 AND p.stock > 0`
    );

    // Format product prices
    const formattedProducts = products.map(product => ({
      ...product,
      price: Number(product.price)
    }));

    res.json(formattedProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get available coupon exchange rates
router.get('/coupon-rates', auth, async (req, res) => {
  try {
    // Define fixed coupon rates
    const rates = [
      { points: 100, discount: 5 },
      { points: 200, discount: 10 },
      { points: 300, discount: 15 }
    ];

    // Get user's current points
    const [user] = await pool.query(
      'SELECT points FROM users WHERE id = ?',
      [req.user.id]
    );

    // Add availability flag to each rate
    const ratesWithAvailability = rates.map(rate => ({
      ...rate,
      available: user[0].points >= rate.points
    }));

    res.json(ratesWithAvailability);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Exchange points for a coupon
router.post('/exchange-coupon', auth, async (req, res) => {
  const { points_amount } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Get user's current points
    const [user] = await connection.query(
      'SELECT points FROM users WHERE id = ?',
      [req.user.id]
    );

    if (user[0].points < points_amount) {
      throw new Error('Insufficient points');
    }

    // Calculate discount amount based on points
    let discount_amount;
    switch (points_amount) {
      case 100: discount_amount = 5; break;
      case 200: discount_amount = 10; break;
      case 300: discount_amount = 15; break;
      default: throw new Error('Invalid points amount');
    }

    // Create coupon
    const [result] = await connection.query(
      'INSERT INTO coupons (user_id, points_used, discount_amount) VALUES (?, ?, ?)',
      [req.user.id, points_amount, discount_amount]
    );

    // Deduct points from user
    await connection.query(
      'UPDATE users SET points = points - ? WHERE id = ?',
      [points_amount, req.user.id]
    );

    // Record points transaction
    await connection.query(
      'INSERT INTO points_transactions (user_id, points_amount, transaction_type) VALUES (?, ?, ?)',
      [req.user.id, points_amount, 'used']
    );

    await connection.commit();

    // Get updated user data
    const [updatedUser] = await pool.query(
      'SELECT points FROM users WHERE id = ?',
      [req.user.id]
    );

    res.status(201).json({
      coupon_id: result.insertId,
      points_used: points_amount,
      discount_amount,
      remaining_points: updatedUser[0].points
    });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ message: error.message });
  } finally {
    connection.release();
  }
});

// Get user's available coupons
router.get('/coupons', auth, async (req, res) => {
  try {
    const [coupons] = await pool.query(
      'SELECT * FROM coupons WHERE user_id = ? AND is_used = FALSE ORDER BY created_at DESC',
      [req.user.id]
    );

    // Format discount amounts
    const formattedCoupons = coupons.map(coupon => ({
      ...coupon,
      discount_amount: Number(coupon.discount_amount)
    }));

    res.json(formattedCoupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 