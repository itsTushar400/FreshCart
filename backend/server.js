
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const pool = require("./src/config/db");

const app = express();
const port = Number(process.env.PORT || 5000);

// ===============================
// Upload Directory
// ===============================
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ===============================
// CORS Configuration
// ===============================
app.use(
  cors({
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",").map((s) => s.trim())
      : true,
    credentials: true,
  })
);

// ===============================
// Middleware
// ===============================
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadDir));

// ===============================
// API Information
// ===============================
app.get("/", (_req, res) => {
  res.json({
    name: "FreshCart API",
    status: "running",
    endpoints: [
      "/api/health",
      "/api/products",
      "/api/categories",
      "/api/auth/register",
      "/api/auth/login",
      "/api/orders",
      "/api/tracking/:orderId",
      "/api/admin/stats",
      "/api/admin/recent-orders",
      "/api/customers",
    ],
  });
});

// ===============================
// Database Health Check
// ===============================
app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      ok: true,
      database: "connected",
    });
  } catch (err) {
    console.error("Database health check failed:", err.message);

    res.status(503).json({
      ok: false,
      database: "disconnected",
    });
  }
});

// ===============================
// Existing Application Routes
// ===============================
app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/api/products", require("./src/routes/products.routes"));
app.use("/api/categories", require("./src/routes/categories.routes"));
app.use("/api/coupons", require("./src/routes/coupons.routes"));
app.use("/api/orders", require("./src/routes/orders.routes"));

// ===============================
// Order Tracking Routes
// Requires src/routes/tracking.routes.js
// to export a function that accepts pool.
// ===============================
app.use(
  "/api/tracking",
  require("./src/routes/tracking.routes")(pool)
);

// ===============================
// Admin Routes
// ===============================
app.use("/api/admin", require("./src/routes/admin.routes"));

// ===============================
// Customers Routes
// ===============================
app.use("/api/customers", require("./src/routes/customers.routes"));

// ===============================
// 404 Handler
// ===============================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ===============================
// Global Error Handler
// ===============================
app.use((err, _req, res, _next) => {
  console.error(err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "Image size must be 5MB or less.",
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ===============================
// Start Server
// ===============================
app.listen(port, () => {
  console.log(`FreshCart API running at http://localhost:${port}`);
});
