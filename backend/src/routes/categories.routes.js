
const express = require("express");
const db = require("../config/db");
const { authenticate, adminOnly } = require("../middleware/auth");

const router = express.Router();

// GET: All categories with product counts
router.get("/", async (req, res) => {
  try {
    const [categories] = await db.query(`
      SELECT
        c.id,
        c.name,
        COUNT(p.id) AS productCount
      FROM categories c
      LEFT JOIN products p
        ON p.category = c.name
      GROUP BY c.id, c.name
      ORDER BY c.name ASC
    `);

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
});

// POST: Add category (Admin only)
router.post("/", authenticate, adminOnly, async (req, res) => {
  try {
    const name = req.body.name?.trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const [existing] = await db.query(
      "SELECT id FROM categories WHERE name = ?",
      [name]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Category already exists",
      });
    }

    const [result] = await db.query(
      "INSERT INTO categories (name) VALUES (?)",
      [name]
    );

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category: {
        id: result.insertId,
        name,
        productCount: 0,
      },
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create category",
    });
  }
});

// PUT: Update category (Admin only)
router.put("/:id", authenticate, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const name = req.body.name?.trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const [current] = await db.query(
      "SELECT id, name FROM categories WHERE id = ?",
      [id]
    );

    if (current.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const [existing] = await db.query(
      "SELECT id FROM categories WHERE name = ? AND id != ?",
      [name, id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Category name already exists",
      });
    }

    const oldName = current[0].name;

    // Keep existing products associated with the renamed category.
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      await connection.query(
        "UPDATE categories SET name = ? WHERE id = ?",
        [name, id]
      );

      await connection.query(
        "UPDATE products SET category = ? WHERE category = ?",
        [name, oldName]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    res.json({
      success: true,
      message: "Category updated successfully",
      category: { id: Number(id), name },
    });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update category",
    });
  }
});

// DELETE: Delete category (Admin only)
router.delete("/:id", authenticate, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const [categories] = await db.query(
      "SELECT id, name FROM categories WHERE id = ?",
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const [products] = await db.query(
      "SELECT COUNT(*) AS total FROM products WHERE category = ?",
      [categories[0].name]
    );

    if (Number(products[0].total) > 0) {
      return res.status(409).json({
        success: false,
        message: "Move or remove this category's products before deleting it",
      });
    }

    await db.query("DELETE FROM categories WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete category",
    });
  }
});

module.exports = router;
