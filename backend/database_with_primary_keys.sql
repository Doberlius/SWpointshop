-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `shoppoint_db`
--

-- --------------------------------------------------------

--
-- Drop tables in correct order (respecting foreign keys)
--

DROP TABLE IF EXISTS `points_transactions`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `coupons`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` mediumtext DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `points` int(11) DEFAULT 0,
  `balance` decimal(10,2) DEFAULT 9999.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_user_points` (`points`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `description` mediumtext DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `idx_product_stock` (`stock`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `coupons`
--

CREATE TABLE `coupons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `points_used` int(11) NOT NULL,
  `is_used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `used_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_coupon_user` (`user_id`),
  CONSTRAINT `coupons_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `points_earned` int(11) DEFAULT 0,
  `points_used` int(11) DEFAULT 0,
  `coupon_id` int(11) DEFAULT NULL,
  `status` enum('pending','paid','shipped','delivered','cancelled') DEFAULT 'pending',
  `payment_status` enum('pending','completed','failed') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `coupon_id` (`coupon_id`),
  KEY `idx_order_status` (`status`),
  KEY `idx_order_payment_status` (`payment_status`),
  KEY `idx_order_user` (`user_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) DEFAULT NULL,
  `product_id` int(11) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `price_at_time` decimal(10,2) NOT NULL,
  `points_used_per_item` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `idx_order_items_order` (`order_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `points_transactions`
--

CREATE TABLE `points_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `order_id` int(11) DEFAULT NULL,
  `points_amount` int(11) NOT NULL,
  `transaction_type` enum('earned','used') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `idx_points_transactions_user` (`user_id`),
  CONSTRAINT `points_transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `points_transactions_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `description`) VALUES
(1, 'Shirts', 'All types of shirts and t-shirts'),
(2, 'Shoes', 'Footwear collection');

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `points`, `balance`, `created_at`, `updated_at`) VALUES
(1, 'yolo123', 'yolo123@gmail.com', '$2a$10$OhYPzIKGIjZync2vvsn/beo.g61TOQxJ1evR54y5pRfXoIJc9k5Au', 29, 3148.00, '2025-07-03 09:33:49', '2025-07-04 13:24:00'),
(2, 'nigga', 'nigga123@gmail.com', '$2a$10$kx/9XBpzHWKIvTrFr3FFke6ZJGc6p3A4WKqDFDuZQCVKsyuSD4Uhi', 29, 315.00, '2025-07-03 09:43:07', '2025-07-03 10:44:20'),
(3, 'dumdun', 'dumdum123@gmail.com', '$2a$10$vSW7GkNNNlv.4kGihVjoDeniiQwaOdYrc785I0mkC0Kd8UJUV6DJi', 6499, 9999.00, '2025-07-03 11:26:35', '2025-07-04 13:27:25'),
(4, 'r!pp3r', 'ripper123@gmail.com', '$2a$10$v2NCMllrO/icfMFYwe/5oeC8P7ljRQ4UQPHfPphA9kbbNA2vN.Kya', 8599, 6499.00, '2025-07-04 11:18:48', '2025-07-04 17:19:10');

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `category_id`, `name`, `description`, `price`, `stock`, `image_url`, `created_at`) VALUES
(1, 1, 'เสื้อ', 'เสื้อ', 150.00, 300, 'https://i.postimg.cc/MpQ0C83d/Shirt.jpg', '2025-07-03 09:22:20'),
(2, 1, 'เสื้อกันหนาว', 'ใส่ได้ทั้งชายและหญิง', 350.00, 300, 'https://i.postimg.cc/259g5S3f/Cloth.jpg', '2025-07-03 09:22:20'),
(3, 2, 'สายชาร์จ', 'สายชาร์จ', 120.00, 300, 'https://i.postimg.cc/g0p36VXV/Keys.jpg', '2025-07-03 09:22:20'),
(4, 2, 'กระเป๋า', 'กระเป๋าโรงเรียน', 320.00, 300, 'https://i.postimg.cc/YCGdxzCT/Bag.jpg', '2025-07-03 09:22:20'),
(5, 1, 'กระเป๋าผ้า', 'กระเป๋าผ้า', 150.00, 300, 'https://i.postimg.cc/nrTZV5dW/handle-bag.jpg', '2025-07-04 08:40:47');

--
-- Dumping data for table `coupons`
--

INSERT INTO `coupons` (`id`, `user_id`, `discount_amount`, `points_used`, `is_used`, `created_at`, `used_at`) VALUES
(1, 1, 5500.00, 5000, 1, '2025-07-03 09:34:02', '2025-07-03 09:34:09'),
(2, 1, 2100.00, 2000, 1, '2025-07-03 09:34:14', '2025-07-03 09:34:20'),
(3, 1, 180.00, 200, 1, '2025-07-03 09:38:00', '2025-07-03 09:38:08');

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `total_amount`, `points_earned`, `points_used`, `coupon_id`, `status`, `payment_status`, `created_at`, `updated_at`) VALUES
(1, 1, 0.00, 250, 0, 1, 'paid', 'completed', '2025-07-03 09:34:09', '2025-07-03 09:34:09'),
(2, 1, 0.00, 200, 0, 2, 'paid', 'completed', '2025-07-03 09:34:20', '2025-07-03 09:34:20'),
(3, 1, 599.00, 60, 0, NULL, 'pending', 'pending', '2025-07-03 09:37:11', '2025-07-03 09:37:11');

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `price_at_time`, `points_used_per_item`, `created_at`, `updated_at`) VALUES
(1, 1, 3, 1, 2499.00, 0, '2025-07-03 09:34:09', '2025-07-03 09:34:09'),
(2, 2, 4, 1, 1999.00, 0, '2025-07-03 09:34:20', '2025-07-03 09:34:20'),
(3, 3, 1, 1, 599.00, 0, '2025-07-03 09:37:11', '2025-07-03 09:37:11');

--
-- Dumping data for table `points_transactions`
--

INSERT INTO `points_transactions` (`id`, `user_id`, `order_id`, `points_amount`, `transaction_type`, `created_at`) VALUES
(1, 1, NULL, 9999, 'earned', '2025-07-03 09:33:49'),
(2, 1, NULL, 5000, 'used', '2025-07-03 09:34:02'),
(3, 1, 1, 250, 'earned', '2025-07-03 09:34:09');

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */; 