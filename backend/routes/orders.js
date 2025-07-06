import express from 'express';
import { pool } from '../server.js';
import { auth } from './users.js';

const router = express.Router();

// Generate PromptPay QR Code
const generatePromptPayQR = async (amount) => {
  const promptPayId = process.env.PROMPTPAY_ID;
  // Use promptpay.io URL
  return `https://promptpay.io/${promptPayId}.png`;
};

// Create new order
router.post('/', auth, async (req, res) => {
  const { items, coupon_id } = req.body;

  try {
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Calculate total amount
      let total_amount = 0;
      const orderItems = [];

      // Verify stock and calculate totals
      for (const item of items) {
        const [product] = await connection.query(
          'SELECT * FROM products WHERE id = ? AND stock >= ?',
          [item.product_id, item.quantity]
        );

        if (product.length === 0) {
          throw new Error(`สินค้าหมด`);
        }

        const productData = product[0];
        const itemTotal = productData.price * item.quantity;
        total_amount += itemTotal;

        orderItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_time: productData.price
        });
      }

      // Get user's balance
      const [user] = await connection.query(
        'SELECT balance FROM users WHERE id = ?',
        [req.user.id]
      );

      if (!user.length) {
        throw new Error('User not found');
      }

      // Apply coupon if provided
      let coupon_amount = 0;
      if (coupon_id) {
        const [coupon] = await connection.query(
          'SELECT * FROM coupons WHERE id = ? AND user_id = ? AND is_used = FALSE',
          [coupon_id, req.user.id]
        );

        if (coupon.length === 0) {
          throw new Error('Invalid or already used coupon');
        }

        coupon_amount = Number(coupon[0].discount_amount);
        total_amount = Math.max(0, total_amount - coupon_amount);

        // Mark coupon as used
        await connection.query(
          'UPDATE coupons SET is_used = TRUE, used_at = CURRENT_TIMESTAMP WHERE id = ?',
          [coupon_id]
        );
      }

      // If total_amount > 0, check if user has enough balance
      if (total_amount > 0) {
        if (user[0].balance < total_amount) {
          throw new Error('เงินไม่พอ');
        }

        // Deduct balance from user
        await connection.query(
          'UPDATE users SET balance = balance - ? WHERE id = ?',
          [total_amount, req.user.id]
        );
      }

      // Determine order status based on total amount
      const orderStatus = 'paid';  // Always set to paid since we're using demo payment
      const paymentStatus = 'completed';  // Always set to completed since we're using demo payment

      // Create order
      const [orderResult] = await connection.query(
        'INSERT INTO orders (user_id, total_amount, coupon_id, status, payment_status) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, total_amount, coupon_id, orderStatus, paymentStatus]
      );

      // Create order items
      for (const item of orderItems) {
        await connection.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES (?, ?, ?, ?)',
          [orderResult.insertId, item.product_id, item.quantity, item.price_at_time]
        );

        // Update product stock
        await connection.query(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }

      await connection.commit();

      // Get updated user data
      const [updatedUser] = await connection.query(
        'SELECT balance FROM users WHERE id = ?',
        [req.user.id]
      );

      res.status(201).json({
        order_id: orderResult.insertId,
        total_amount,
        coupon_amount,
        status: orderStatus,
        payment_status: paymentStatus,
        user_balance: Number(updatedUser[0].balance)
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get user's orders
router.get('/', auth, async (req, res) => {
  try {
    // First get all orders
    const [orders] = await pool.query(
      `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );

    // For each order, get its items
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const [items] = await pool.query(
        `SELECT oi.*, p.name as product_name, p.image_url
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );

      return {
        ...order,
        total_amount: Number(order.total_amount),
        items: items.map(item => ({
          ...item,
          price_at_time: Number(item.price_at_time)
        }))
      };
    }));

    res.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    // Get the order
    const [orders] = await pool.query(
      `SELECT * FROM orders WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Get order items
    const [items] = await pool.query(
      `SELECT oi.*, p.name 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`,
      [req.params.id]
    );

    // Convert total_amount to number and generate QR if needed
    const order = orders[0];
    const totalAmount = Number(order.total_amount);

    // If total amount > 0 and payment is pending, generate QR code
    let promptpay_qr = null;
    if (totalAmount > 0 && order.payment_status === 'pending') {
      try {
        promptpay_qr = await generatePromptPayQR(totalAmount.toFixed(2));
      } catch (qrError) {
        console.error('Error generating QR code:', qrError);
      }
    }

    const orderWithItems = {
      ...order,
      total_amount: totalAmount, // Send the number back to client
      items,
      promptpay_qr
    };

    res.json(orderWithItems);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});

// Update order status (e.g., after payment confirmation)
router.patch('/:id/status', auth, async (req, res) => {
  const { status, payment_status } = req.body;

  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [order] = await connection.query(
        'SELECT * FROM orders WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );

      if (order.length === 0) {
        throw new Error('Order not found');
      }

      // Update order status
      await connection.query(
        'UPDATE orders SET status = ?, payment_status = ? WHERE id = ?',
        [status, payment_status, req.params.id]
      );

      await connection.commit();
      res.json({ message: 'Order status updated successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router; 