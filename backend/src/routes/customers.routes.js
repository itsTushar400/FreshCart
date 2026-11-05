
const express = require("express");
const db = require("../config/db");
const { authenticate, adminOnly } = require("../middleware/auth");

const router = express.Router();

// GET: List customers with search and pagination
router.get("/", authenticate, adminOnly, async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );
    const offset = (page - 1) * limit;

    const conditions = ["role = 'customer'"];
    const params = [];

    if (search) {
      conditions.push("(name LIKE ? OR email LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.join(" AND ");

    const [[countResult]] = await db.query(
      `SELECT COUNT(*) AS total FROM users WHERE ${whereClause}`,
      params
    );

    const [customers] = await db.query(
      `
        SELECT
          u.id,
          u.name,
          u.email,
          u.created_at,
          COUNT(DISTINCT o.id) AS totalOrders,
          COALESCE(SUM(
            CASE
              WHEN o.status = 'delivered' THEN o.total
              ELSE 0
            END
          ), 0) AS totalSpent
        FROM users u
        LEFT JOIN orders o ON o.user_id = u.id
        WHERE ${whereClause.replaceAll("role", "u.role")
          .replaceAll("name", "u.name")
          .replaceAll("email", "u.email")}
        GROUP BY u.id, u.name, u.email, u.created_at
        ORDER BY u.id DESC
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      customers,
      pagination: {
        page,
        limit,
        total: Number(countResult.total),
        totalPages: Math.ceil(Number(countResult.total) / limit),
      },
    });
  } catch (error) {
    console.error("Get customers error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
    });
  }
});

// GET: Single customer details and order history
router.get("/:id", authenticate, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const [customers] = await db.query(
      `
        SELECT id, name, email, created_at
        FROM users
        WHERE id = ? AND role = 'customer'
        LIMIT 1
      `,
      [id]
    );

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const [orders] = await db.query(
      `
        SELECT id, total, status, created_at
        FROM orders
        WHERE user_id = ?
        ORDER BY created_at DESC
      `,
      [id]
    );

    res.json({
      success: true,
      customer: customers[0],
      orders,
    });
  } catch (error) {
    console.error("Get customer details error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch customer details",
    });
  }
});

module.exports = router;
