
const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authenticate, adminOnly } = require("../middleware/auth");

// Get all coupons (Admin)
router.get("/", authenticate, adminOnly, async (req, res) => {
  try {
    const [coupons] = await pool.query(
      `SELECT id, code, type, value, minOrder, used, usageLimit,
              DATE_FORMAT(expiry, '%Y-%m-%d') AS expiry, status
       FROM coupons
       ORDER BY id DESC`
    );

    res.json({ success: true, coupons });
  } catch (error) {
    console.error("Fetch coupons error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch coupons",
    });
  }
});

// Get active coupons for Cart
router.get("/active", async (req, res) => {
  try {
    const [coupons] = await pool.query(`
      SELECT id, code, type, value, minOrder, DATE_FORMAT(expiry, '%Y-%m-%d') AS expiry
      FROM coupons
      WHERE status = 'Active'
        AND expiry >= CURDATE()
        AND used < usageLimit
      ORDER BY id DESC
    `);

    res.json({ success: true, coupons });
  } catch (error) {
    console.error("Fetch active coupons error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active coupons",
    });
  }
});

// Create coupon
router.post("/", authenticate, adminOnly, async (req, res) => {
  try {
    const {
      code,
      type,
      value,
      minOrder = 0,
      usageLimit = 100,
      expiry,
    } = req.body;

    const normalizedCode = String(code || "").trim().toUpperCase();

    if (
      !normalizedCode ||
      !["Percentage", "Fixed amount"].includes(type) ||
      !Number.isFinite(Number(value)) ||
      Number(value) <= 0 ||
      (type === "Percentage" && Number(value) > 100) ||
      !Number.isFinite(Number(minOrder)) ||
      Number(minOrder) < 0 ||
      !Number.isInteger(Number(usageLimit)) ||
      Number(usageLimit) < 1 ||
      !expiry ||
      !/^\d{4}-\d{2}-\d{2}$/.test(expiry) ||
      !Number.isFinite(Date.parse(`${expiry}T00:00:00Z`)) ||
      new Date(`${expiry}T00:00:00Z`).toISOString().slice(0, 10) !== expiry
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid coupon details.",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO coupons
       (code, type, value, minOrder, usageLimit, expiry, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Active')`,
      [
        normalizedCode,
        type,
        Number(value),
        Number(minOrder),
        Number(usageLimit),
        expiry,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      id: result.insertId,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "This coupon code already exists.",
      });
    }

    console.error("Create coupon error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create coupon",
    });
  }
});

// Activate / deactivate coupon
router.patch("/:id/status", authenticate, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon status",
      });
    }

    const [result] = await pool.query(
      "UPDATE coupons SET status = ? WHERE id = ?",
      [status, req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.json({ success: true, message: "Coupon status updated" });
  } catch (error) {
    console.error("Update coupon error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update coupon",
    });
  }
});

// Delete coupon
router.delete("/:id", authenticate, adminOnly, async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM coupons WHERE id = ?",
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.json({ success: true, message: "Coupon deleted" });
  } catch (error) {
    console.error("Delete coupon error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
    });
  }
});

module.exports = router;
