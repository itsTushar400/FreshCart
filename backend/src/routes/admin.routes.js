
const express = require("express");
const db = require("../config/db");
const { authenticate, adminOnly } = require("../middleware/auth");

const router = express.Router();

// GET: Admin dashboard statistics
router.get("/stats", authenticate, adminOnly, async (req, res) => {
  try {
    const [
      [productRows],
      [categoryRows],
      [orderRows],
      [customerRows],
      [salesRows],
      [statusRows],
    ] = await Promise.all([
      db.query(`
        SELECT COUNT(*) AS total
        FROM products
      `),

      db.query(`
        SELECT COUNT(DISTINCT category) AS total
        FROM products
        WHERE category IS NOT NULL AND category != ''
      `),

      db.query(`
        SELECT COUNT(*) AS total
        FROM orders
      `),

      db.query(`
        SELECT COUNT(*) AS total
        FROM users
        WHERE role = 'customer'
      `),

      db.query(`
        SELECT COALESCE(SUM(total), 0) AS revenue
        FROM orders
        WHERE status = 'delivered'
      `),

      db.query(`
        SELECT status, COUNT(*) AS total
        FROM orders
        GROUP BY status
      `),
    ]);

    const orderStatuses = {};

    statusRows.forEach((row) => {
      orderStatuses[row.status] = Number(row.total);
    });

    res.json({
      success: true,
      stats: {
        totalProducts: Number(productRows[0].total),
        totalCategories: Number(categoryRows[0].total),
        totalOrders: Number(orderRows[0].total),
        totalCustomers: Number(customerRows[0].total),
        totalRevenue: Number(salesRows[0].revenue),
        orderStatuses,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard statistics",
      error: process.env.NODE_ENV === "production"
        ? undefined
        : error.message,
    });
  }
});

// GET: Recent orders
router.get("/recent-orders", authenticate, adminOnly, async (req, res) => {
  try {
    const limit = Math.min(
      20,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 5)
    );

    const [orders] = await db.query(
      `
        SELECT
          o.id,
          o.user_id,
          o.total,
          o.status,
          o.created_at,
          o.customer_name AS customerName,
          o.email AS customerEmail
        FROM orders o
        ORDER BY o.created_at DESC
        LIMIT ?
      `,
      [limit]
    );

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Recent orders error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load recent orders",
      error: process.env.NODE_ENV === "production"
        ? undefined
        : error.message,
    });
  }
});

module.exports = router;
