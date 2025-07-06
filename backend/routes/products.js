import express from 'express';
import { pool } from '../server.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const [products] = await pool.query(
      'SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id'
    );
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get products by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const [products] = await pool.query(
      'SELECT * FROM products WHERE category_id = ?',
      [req.params.categoryId]
    );
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const [product] = await pool.query(
      'SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?',
      [req.params.id]
    );
    
    if (product.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new product
router.post('/', async (req, res) => {
  const {
    category_id,
    name,
    description,
    price,
    points_reward,
    points_price,
    stock,
    image_url
  } = req.body;

  try {
    const [result] = await pool.query(
      'INSERT INTO products (category_id, name, description, price, points_reward, points_price, stock, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [category_id, name, description, price, points_reward, points_price, stock, image_url]
    );
    
    const [newProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json(newProduct[0]);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  const {
    category_id,
    name,
    description,
    price,
    points_reward,
    points_price,
    stock,
    image_url
  } = req.body;

  try {
    await pool.query(
      'UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, points_reward = ?, points_price = ?, stock = ?, image_url = ? WHERE id = ?',
      [category_id, name, description, price, points_reward, points_price, stock, image_url, req.params.id]
    );
    
    const [updatedProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json(updatedProduct[0]);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

export default router; 