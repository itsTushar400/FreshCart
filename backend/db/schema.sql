CREATE DATABASE IF NOT EXISTS freshcart
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE freshcart;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  category VARCHAR(120) NOT NULL,
  weight VARCHAR(80) NOT NULL DEFAULT '',
  price DECIMAL(10,2) NOT NULL,
  old_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount INT NOT NULL DEFAULT 0,
  image VARCHAR(500) NOT NULL DEFAULT '',
  type ENUM('deal','new','bestseller','regular') NOT NULL DEFAULT 'regular',
  stock INT NOT NULL DEFAULT 100,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO categories (name)
SELECT DISTINCT TRIM(category)
FROM products
WHERE category IS NOT NULL AND TRIM(category) != '';

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  customer_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  address TEXT NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status ENUM('pending','confirmed','packed','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NULL,
  product_name VARCHAR(180) NOT NULL,
  image VARCHAR(500) NOT NULL DEFAULT '',
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(24) NOT NULL UNIQUE,
  type ENUM('Percentage','Fixed amount') NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  minOrder DECIMAL(10,2) NOT NULL DEFAULT 0,
  used INT NOT NULL DEFAULT 0,
  usageLimit INT NOT NULL DEFAULT 100,
  expiry DATE NOT NULL,
  status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_coupons_active (status, expiry)
);

INSERT IGNORE INTO coupons (code, type, value, minOrder, usageLimit, expiry, status)
VALUES
  ('FRESH10', 'Percentage', 10, 0, 1000, DATE_ADD(CURDATE(), INTERVAL 365 DAY), 'Active'),
  ('WELCOME15', 'Percentage', 15, 299, 1000, DATE_ADD(CURDATE(), INTERVAL 365 DAY), 'Active');

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_orders_user ON orders(user_id);
