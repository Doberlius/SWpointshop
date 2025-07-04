-- Create database
CREATE DATABASE IF NOT EXISTS shoppoint_db;
USE shoppoint_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    points INT DEFAULT 0,
    balance DECIMAL(10,2) DEFAULT 9999.00,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Product Categories
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    points_reward INT DEFAULT 0,
    points_price INT,
    stock INT NOT NULL,
    image_url VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    points_used INT NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    used_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    points_earned INT DEFAULT 0,
    points_used INT DEFAULT 0,
    coupon_id INT DEFAULT NULL,
    status ENUM('pending','paid','shipped','delivered','cancelled') DEFAULT 'pending',
    payment_status ENUM('pending','completed','failed') DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (coupon_id) REFERENCES coupons(id)
);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT,
    product_id INT,
    quantity INT NOT NULL,
    price_at_time DECIMAL(10,2) NOT NULL,
    points_used_per_item INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Points Transactions table
CREATE TABLE IF NOT EXISTS points_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    order_id INT,
    points_amount INT NOT NULL,
    transaction_type ENUM('earned', 'used') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Insert initial categories
INSERT INTO categories (name, description) VALUES
('Shirts', 'All types of shirts and t-shirts'),
('Shoes', 'Footwear collection');

-- Insert sample products
INSERT INTO products (category_id, name, description, price, points_reward, points_price, stock, image_url) VALUES
(1, 'Classic White T-Shirt', 'Premium cotton white t-shirt', 599.00, 60, 500, 100, '/images/white-tshirt.jpg'),
(1, 'Black Polo Shirt', 'Elegant black polo shirt', 799.00, 80, 700, 75, '/images/black-polo.jpg'),
(2, 'Running Shoes', 'Comfortable running shoes', 2499.00, 250, 2000, 50, '/images/running-shoes.jpg'),
(2, 'Casual Sneakers', 'Everyday casual sneakers', 1999.00, 200, 1500, 60, '/images/casual-sneakers.jpg');

-- Add indexes for better performance
CREATE INDEX idx_user_points ON users(points);
CREATE INDEX idx_product_stock ON products(stock);
CREATE INDEX idx_order_status ON orders(status);
CREATE INDEX idx_order_payment_status ON orders(payment_status);
CREATE INDEX idx_coupon_user ON coupons(user_id);
CREATE INDEX idx_order_user ON orders(user_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_points_transactions_user ON points_transactions(user_id); 