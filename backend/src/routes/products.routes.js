
const router = require("express").Router();
const pool = require("../config/db");
const { authenticate, adminOnly } = require("../middleware/auth");
const upload = require("../middleware/upload");

const fields = [
  "name",
  "category",
  "weight",
  "price",
  "old_price",
  "discount",
  "image",
  "type",
  "stock",
  "description",
  "active",
];

function normalizeBody(body, existing = {}) {
  const out = { ...existing };

  for (const key of fields) {
    if (body[key] !== undefined) {
      out[key] = body[key];
    }
  }

  for (const key of ["name", "category"]) {
    if (out[key] !== undefined) {
      out[key] = String(out[key]).trim();
    }
  }

  for (const key of ["weight", "image", "description"]) {
    if (out[key] !== undefined) {
      out[key] = String(out[key]);
    }
  }

  for (const key of ["price", "old_price", "discount", "stock"]) {
    if (out[key] !== undefined) {
      if (
        out[key] === "" ||
        !Number.isFinite(Number(out[key]))
      ) {
        throw Object.assign(
          new Error(`${key} must be a valid number.`),
          { status: 400 }
        );
      }

      out[key] = Number(out[key]);
    }
  }

  if (out.active !== undefined) {
    if (![true, false, 1, 0, "1", "0", "true", "false"].includes(out.active)) {
      throw Object.assign(
        new Error("Invalid active status."),
        { status: 400 }
      );
    }

    out.active = [true, 1, "1", "true"].includes(out.active);
  }

  if (
    out.type &&
    !["deal", "new", "bestseller", "regular"].includes(out.type)
  ) {
    throw Object.assign(new Error("Invalid product type."), {
      status: 400,
    });
  }

  if (out.price !== undefined && out.price < 0) {
    throw Object.assign(new Error("Price cannot be negative."), {
      status: 400,
    });
  }

  if (
    out.old_price !== undefined &&
    out.old_price < 0
  ) {
    throw Object.assign(new Error("Old price cannot be negative."), {
      status: 400,
    });
  }

  if (out.discount !== undefined && (out.discount < 0 || out.discount > 100)) {
    throw Object.assign(
      new Error("Discount must be between 0 and 100."),
      { status: 400 }
    );
  }

  if (out.stock !== undefined && (!Number.isInteger(out.stock) || out.stock < 0)) {
    throw Object.assign(
      new Error("Stock must be a non-negative whole number."),
      { status: 400 }
    );
  }

  return out;
}

function getFilters(query) {
  const search = String(query.search || "").trim();
  const category = String(query.category || "").trim();
  const type = String(query.type || "").trim();

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(query.limit, 10) || 20)
  );

  const where = [];
  const params = [];

  if (search) {
    where.push("(name LIKE ? OR category LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  if (category) {
    where.push("category = ?");
    params.push(category);
  }

  if (type) {
    where.push("type = ?");
    params.push(type);
  }

  return { where, params, page, limit };
}

const productColumns = `
  id,
  name,
  category,
  weight,
  price,
  old_price AS old,
  discount AS off,
  image,
  type,
  stock,
  description,
  active
`;

// PUBLIC: Only active products
router.get("/", async (req, res, next) => {
  try {
    const { where, params, page, limit } = getFilters(req.query);

    where.push("active = TRUE");

    const clause = `WHERE ${where.join(" AND ")}`;

    const [[count]] = await pool.query(
      `SELECT COUNT(*) AS total FROM products ${clause}`,
      params
    );

    const [products] = await pool.query(
      `SELECT ${productColumns}
       FROM products
       ${clause}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]
    );

    res.json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total: Number(count.total),
        totalPages: Math.ceil(Number(count.total) / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ADMIN: All products, including inactive ones
// Must appear before router.get("/:id")
router.get("/admin/all", authenticate, adminOnly, async (req, res, next) => {
  try {
    const { where, params, page, limit } = getFilters(req.query);

    const active = req.query.active;

    if (active === "true" || active === "false") {
      where.push("active = ?");
      params.push(active === "true");
    }

    const clause = where.length
      ? `WHERE ${where.join(" AND ")}`
      : "";

    const [[count]] = await pool.query(
      `SELECT COUNT(*) AS total FROM products ${clause}`,
      params
    );

    const [products] = await pool.query(
      `SELECT ${productColumns}
       FROM products
       ${clause}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]
    );

    res.json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total: Number(count.total),
        totalPages: Math.ceil(Number(count.total) / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// PUBLIC: Get one active product
router.get("/:id", async (req, res, next) => {
  try {
    const [products] = await pool.query(
      `SELECT ${productColumns}
       FROM products
       WHERE id = ? AND active = TRUE`,
      [req.params.id]
    );

    if (!products.length) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    res.json({
      success: true,
      product: products[0],
    });
  } catch (err) {
    next(err);
  }
});

// ADMIN: Create product
router.post(
  "/",
  authenticate,
  adminOnly,
  upload.single("imageFile"),
  async (req, res, next) => {
    try {
      const data = normalizeBody(req.body);

      if (
        !data.name ||
        !data.category ||
        data.price === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: "Name, category, and price are required.",
        });
      }

      if (req.file) {
        data.image = `/uploads/${req.file.filename}`;
      }

      const values = {
        name: data.name,
        category: data.category,
        weight: data.weight || "",
        price: data.price,
        old_price: data.old_price ?? 0,
        discount: data.discount ?? 0,
        image: data.image || "",
        type: data.type || "regular",
        stock: data.stock ?? 100,
        description: data.description || "",
        active: data.active ?? true,
      };

      const [result] = await pool.query(
        `INSERT INTO products
          (name, category, weight, price, old_price, discount,
           image, type, stock, description, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          values.name,
          values.category,
          values.weight,
          values.price,
          values.old_price,
          values.discount,
          values.image,
          values.type,
          values.stock,
          values.description,
          values.active,
        ]
      );

      res.status(201).json({
        success: true,
        message: "Product created successfully.",
        product: { id: result.insertId, ...values },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ADMIN: Update product
router.put(
  "/:id",
  authenticate,
  adminOnly,
  upload.single("imageFile"),
  async (req, res, next) => {
    try {
      const [existingRows] = await pool.query(
        "SELECT * FROM products WHERE id = ?",
        [req.params.id]
      );

      if (!existingRows.length) {
        return res.status(404).json({
          success: false,
          message: "Product not found.",
        });
      }

      const data = normalizeBody(req.body, existingRows[0]);

      if (req.file) {
        data.image = `/uploads/${req.file.filename}`;
      }

      const requiredFields = [
        "name",
        "category",
        "weight",
        "price",
        "old_price",
        "discount",
        "image",
        "type",
        "stock",
        "description",
        "active",
      ];

      for (const field of requiredFields) {
        if (data[field] === undefined || data[field] === null) {
          return res.status(400).json({
            success: false,
            message: `Missing product field: ${field}`,
          });
        }
      }

      await pool.query(
        `UPDATE products SET
          name = ?,
          category = ?,
          weight = ?,
          price = ?,
          old_price = ?,
          discount = ?,
          image = ?,
          type = ?,
          stock = ?,
          description = ?,
          active = ?
         WHERE id = ?`,
        [
          data.name,
          data.category,
          data.weight,
          data.price,
          data.old_price,
          data.discount,
          data.image,
          data.type,
          data.stock,
          data.description,
          data.active,
          req.params.id,
        ]
      );

      res.json({
        success: true,
        message: "Product updated successfully.",
      });
    } catch (err) {
      next(err);
    }
  }
);

// ADMIN: Delete product
router.delete("/:id", authenticate, adminOnly, async (req, res, next) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM products WHERE id = ?",
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (err) {
    // A product referenced by an order may be protected by a foreign key.
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        success: false,
        message: "This product is referenced by existing records. Deactivate it instead.",
      });
    }

    next(err);
  }
});

module.exports = router;
