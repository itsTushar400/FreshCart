const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");

function makeToken(user) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured.");
  return jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

router.post("/register", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!name || !email || password.length < 8) {
      return res.status(400).json({ message: "Name, valid email, and password (at least 8 characters) are required." });
    }
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length) return res.status(409).json({ message: "An account with this email already exists." });
    const password_hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      "INSERT INTO users (name,email,password_hash) VALUES (?,?,?)",
      [name, email, password_hash]
    );
    const user = { id: result.insertId, name, email, role: "customer" };
    res.status(201).json({ message: "Registration successful.", token: makeToken(user), user });
  } catch (err) { next(err); }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });
    const [rows] = await pool.query("SELECT id,name,email,password_hash,role FROM users WHERE email = ?", [email]);
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }
    const { password_hash, ...user } = rows[0];
    res.json({ message: "Login successful.", token: makeToken(user), user });
  } catch (err) { next(err); }
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT id,name,email,role,created_at FROM users WHERE id = ?", [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: "User not found." });
    res.json({ user: rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
