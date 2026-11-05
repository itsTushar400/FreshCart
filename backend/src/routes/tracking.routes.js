const express = require("express");

module.exports = function createTrackingRoutes(pool) {
  const router = express.Router();

  // GET /api/tracking/:orderId
  // Customer ke order ki tracking details
  router.get("/:orderId", async (req, res) => {
    try {
      const orderId = String(req.params.orderId);

      if (!/^\d+$/.test(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const [rows] = await pool.execute(
        `SELECT order_id, delivery_address,
                destination_lat, destination_lng,
                rider_lat, rider_lng, status, updated_at
         FROM order_tracking
         WHERE order_id = ?
         LIMIT 1`,
        [orderId]
      );

      if (!rows.length) {
        return res.status(404).json({
          message: "Tracking details not found",
        });
      }

      res.json(rows[0]);
    } catch (error) {
      console.error("Tracking fetch error:", error);
      res.status(500).json({ message: "Unable to fetch tracking" });
    }
  });

  // POST /api/tracking/:orderId/location
  // IMPORTANT: is route ko rider authentication middleware se protect karo.
  router.post("/:orderId/location", async (req, res) => {
    try {
      const orderId = String(req.params.orderId);
      const { latitude, longitude } = req.body;

      if (!/^\d+$/.test(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const lat = Number(latitude);
      const lng = Number(longitude);

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 || lat > 90 ||
        lng < -180 || lng > 180
      ) {
        return res.status(400).json({ message: "Invalid GPS coordinates" });
      }

      const [result] = await pool.execute(
        `UPDATE order_tracking
         SET rider_lat = ?, rider_lng = ?
         WHERE order_id = ?
           AND status IN ('Shipped', 'Out for Delivery')`,
        [lat, lng, orderId]
      );

      if (!result.affectedRows) {
        return res.status(409).json({
          message: "Order not found or not ready for tracking",
        });
      }

      res.json({ message: "Location updated" });
    } catch (error) {
      console.error("GPS update error:", error);
      res.status(500).json({ message: "Unable to update location" });
    }
  });

  // PATCH /api/tracking/:orderId/status
  // IMPORTANT: is route ko admin authentication middleware se protect karo.
  router.patch("/:orderId/status", async (req, res) => {
    try {
      const allowedStatuses = [
        "Confirmed",
        "Packed",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ];

      const { status } = req.body;
      const orderId = String(req.params.orderId);

      if (!/^\d+$/.test(orderId) || !allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid order or status" });
      }

      const [result] = await pool.execute(
        `UPDATE order_tracking SET status = ? WHERE order_id = ?`,
        [status, orderId]
      );

      if (!result.affectedRows) {
        return res.status(404).json({ message: "Tracking order not found" });
      }

      res.json({ message: "Order status updated", status });
    } catch (error) {
      console.error("Status update error:", error);
      res.status(500).json({ message: "Unable to update status" });
    }
  });

  return router;
};