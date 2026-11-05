const router = require("express").Router();
const pool = require("../config/db");
const { authenticate, adminOnly } = require("../middleware/auth");

const allowedStatuses = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

// Optional authentication: guest checkout is allowed.
function optionalAuthenticate(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    req.user = null;
    return next();
  }

  return authenticate(req, res, next);
}

// PLACE ORDER
router.post("/", optionalAuthenticate, async (req, res, next) => {
  const {
    customerName,
    email,
    phone,
    address,
    items,
    couponCode,
  } = req.body;

  if (
    !customerName ||
    !email ||
    !phone ||
    !address ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Customer details, address, and at least one cart item are required.",
    });
  }

  const cleanName = String(customerName).trim();
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPhone = String(phone).trim();
  const cleanAddress = String(address).trim();

  if (
    !cleanName ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
    !cleanPhone ||
    !cleanAddress
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide valid customer details.",
    });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    let total = 0;
    let couponDiscount = 0;
    let couponId = null;
    const validated = [];

    // Validate products and stock using database prices.
    for (const item of items) {
      const productId = Number(item.id ?? item.productId);
      const quantity = Number(item.qty ?? item.quantity);

      if (
        !Number.isInteger(productId) ||
        productId < 1 ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 100
      ) {
        throw Object.assign(
          new Error("Invalid product or quantity in order."),
          { status: 400 }
        );
      }

      const [rows] = await connection.query(
        `SELECT id, name, price, image, stock
         FROM products
         WHERE id = ? AND active = TRUE
         FOR UPDATE`,
        [productId]
      );

      if (!rows.length) {
        throw Object.assign(
          new Error(`Product ${productId} is unavailable.`),
          { status: 400 }
        );
      }

      const product = rows[0];

      if (Number(product.stock) < quantity) {
        throw Object.assign(
          new Error(`${product.name} does not have enough stock.`),
          { status: 409 }
        );
      }

      total += Number(product.price) * quantity;

      validated.push({
        ...product,
        quantity,
      });
    }

    const deliveryFee = total === 0 || total >= 499 ? 0 : 40;

    const normalizedCouponCode = String(couponCode || "")
      .trim()
      .toUpperCase();

    if (normalizedCouponCode) {
      const [coupons] = await connection.query(
        `SELECT id, type, value, minOrder
         FROM coupons
         WHERE code = ?
           AND status = 'Active'
           AND expiry >= CURDATE()
           AND used < usageLimit
         FOR UPDATE`,
        [normalizedCouponCode]
      );

      if (!coupons.length) {
        throw Object.assign(
          new Error(
            "This coupon is no longer active or has reached its usage limit."
          ),
          { status: 400 }
        );
      }

      const coupon = coupons[0];

      if (total < Number(coupon.minOrder)) {
        throw Object.assign(
          new Error(
            `This coupon requires a minimum order of ₹${coupon.minOrder}.`
          ),
          { status: 400 }
        );
      }

      couponId = coupon.id;

      couponDiscount = Math.min(
        total,
        coupon.type === "Percentage"
          ? Math.round(
              (total * Number(coupon.value)) / 100
            )
          : Number(coupon.value)
      );

      total -= couponDiscount;
    }

    total = Math.max(0, total) + deliveryFee;

    // Link authenticated customers to their orders.
    // Guest checkout keeps user_id NULL.
    const userId = req.user?.id ?? null;

    const [order] = await connection.query(
      `INSERT INTO orders
        (user_id, customer_name, email, phone, address, total)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        cleanName,
        cleanEmail,
        cleanPhone,
        cleanAddress,
        total.toFixed(2),
      ]
    );

    // Save order items and decrease stock.
    for (const product of validated) {
      await connection.query(
        `INSERT INTO order_items
          (order_id, product_id, product_name, image, unit_price, quantity)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          order.insertId,
          product.id,
          product.name,
          product.image || "",
          product.price,
          product.quantity,
        ]
      );

      await connection.query(
        `UPDATE products
         SET stock = stock - ?
         WHERE id = ?`,
        [product.quantity, product.id]
      );
    }

    // Update coupon usage.
    if (couponId) {
      const [result] = await connection.query(
        `UPDATE coupons
         SET used = used + 1
         WHERE id = ? AND used < usageLimit`,
        [couponId]
      );

      if (!result.affectedRows) {
        throw Object.assign(
          new Error("This coupon has reached its usage limit."),
          { status: 409 }
        );
      }
    }

    // Automatically create tracking for the new order.
    // Coordinates remain NULL until actual coordinates are available.
    await connection.query(
      `INSERT INTO order_tracking
        (order_id, delivery_address, status)
       VALUES (?, ?, 'Confirmed')`,
      [order.insertId, cleanAddress]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      orderId: order.insertId,
      total: Number(total.toFixed(2)),
      couponDiscount: Number(couponDiscount.toFixed(2)),
      deliveryFee,
    });
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Order rollback failed:",
          rollbackError
        );
      }
    }

    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }

    return next(err);
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// CUSTOMER: Own orders
// ADMIN: All orders
router.get("/", authenticate, async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "admin";

    let query = `
      SELECT
        id,
        user_id AS userId,
        customer_name AS customerName,
        email,
        phone,
        address,
        total,
        status,
        created_at AS createdAt
      FROM orders
    `;

    let params = [];

    if (!isAdmin) {
      const userId = req.user.id;
      const userEmail = String(req.user.email || "")
        .trim()
        .toLowerCase();

      if (userEmail) {
        query += `
          WHERE user_id = ?
             OR (
               user_id IS NULL
               AND LOWER(email) = ?
             )
        `;

        params = [userId, userEmail];
      } else {
        query += " WHERE user_id = ?";
        params = [userId];
      }
    }

    query += " ORDER BY id DESC";

    const [orders] = await pool.query(query, params);

    // Get each order's items.
    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT
           product_id AS id,
           product_name AS name,
           image,
           unit_price AS price,
           quantity AS qty
         FROM order_items
         WHERE order_id = ?
         ORDER BY id`,
        [order.id]
      );

      order.items = items;
    }

    return res.json({
      success: true,
      orders,
    });
  } catch (err) {
    return next(err);
  }
});

// ADMIN: Paginated order list with search and status filter
router.get(
  "/admin/all",
  authenticate,
  adminOnly,
  async (req, res, next) => {
    try {
      const page = Math.max(
        1,
        parseInt(req.query.page, 10) || 1
      );

      const limit = Math.min(
        100,
        Math.max(1, parseInt(req.query.limit, 10) || 10)
      );

      const offset = (page - 1) * limit;
      const search = String(req.query.search || "").trim();
      const status = String(req.query.status || "").trim();

      const conditions = [];
      const params = [];

      if (search) {
        conditions.push(
          `(CAST(id AS CHAR) LIKE ?
            OR customer_name LIKE ?
            OR email LIKE ?
            OR phone LIKE ?)`
        );

        const term = `%${search}%`;
        params.push(term, term, term, term);
      }

      if (status) {
        if (!allowedStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            message: "Invalid order status.",
          });
        }

        conditions.push("status = ?");
        params.push(status);
      }

      const where = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

      const [[count]] = await pool.query(
        `SELECT COUNT(*) AS total
         FROM orders
         ${where}`,
        params
      );

      const [orders] = await pool.query(
        `SELECT
           id,
           user_id AS userId,
           customer_name AS customerName,
           email,
           phone,
           address,
           total,
           status,
           created_at AS createdAt
         FROM orders
         ${where}
         ORDER BY id DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      return res.json({
        success: true,
        orders,
        pagination: {
          page,
          limit,
          total: Number(count.total),
          totalPages: Math.ceil(
            Number(count.total) / limit
          ),
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// ADMIN: Order details with items
router.get(
  "/admin/:id",
  authenticate,
  adminOnly,
  async (req, res, next) => {
    try {
      const orderId = Number(req.params.id);

      if (!Number.isInteger(orderId) || orderId < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID.",
        });
      }

      const [orders] = await pool.query(
        `SELECT
           id,
           user_id AS userId,
           customer_name AS customerName,
           email,
           phone,
           address,
           total,
           status,
           created_at AS createdAt
         FROM orders
         WHERE id = ?
         LIMIT 1`,
        [orderId]
      );

      if (!orders.length) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      const [items] = await pool.query(
        `SELECT
           id,
           product_id AS productId,
           product_name AS name,
           image,
           unit_price AS price,
           quantity AS qty
         FROM order_items
         WHERE order_id = ?
         ORDER BY id`,
        [orderId]
      );

      return res.json({
        success: true,
        order: orders[0],
        items,
      });
    } catch (err) {
      return next(err);
    }
  }
);

// ADMIN: Update order status and sync tracking
router.patch(
  "/:id/status",
  authenticate,
  adminOnly,
  async (req, res, next) => {
    let connection;

    try {
      const orderId = Number(req.params.id);
      const status = String(req.body.status || "").trim();

      if (!Number.isInteger(orderId) || orderId < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID.",
        });
      }

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status.",
        });
      }

      const trackingStatusMap = {
        pending: "Confirmed",
        confirmed: "Confirmed",
        packed: "Packed",
        shipped: "Shipped",
        delivered: "Delivered",
        cancelled: "Cancelled",
      };

      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [result] = await connection.query(
        "UPDATE orders SET status = ? WHERE id = ?",
        [status, orderId]
      );

      if (!result.affectedRows) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      // Create tracking if missing, or update existing tracking.
      await connection.query(
        `INSERT INTO order_tracking
          (order_id, delivery_address, status)
         SELECT id, address, ?
         FROM orders
         WHERE id = ?
         ON DUPLICATE KEY UPDATE
           delivery_address = VALUES(delivery_address),
           status = VALUES(status)`,
        [trackingStatusMap[status], orderId]
      );

      await connection.commit();

      return res.json({
        success: true,
        message: "Order status and tracking updated successfully.",
        orderId,
        status,
        trackingStatus: trackingStatusMap[status],
      });
    } catch (err) {
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error(
            "Status update rollback failed:",
            rollbackError
          );
        }
      }

      return next(err);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
);

module.exports = router;