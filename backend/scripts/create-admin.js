require("dotenv").config();

const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");

async function main() {
  const email = "admin@freshcart.in";
  const password = process.env.FRESHCART_ADMIN_PASSWORD;

  if (!password || password.length < 12) {
    throw new Error("FRESHCART_ADMIN_PASSWORD missing from backend .env");
  }

  const [users] = await pool.query(
    "SELECT id FROM users WHERE email = ?",
    [email]
  );

  const passwordHash = await bcrypt.hash(password, 12);

  if (users.length > 0) {
    await pool.query(
      "UPDATE users SET password_hash = ?, role = 'admin' WHERE id = ?",
      [passwordHash, users[0].id]
    );
    console.log("Existing account updated to admin.");
  } else {
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, 'admin')`,
      ["FreshCart Admin", email, passwordHash]
    );
    console.log("Admin account created successfully.");
  }

  console.log("Admin email:", email);
}

main()
  .catch((error) => {
    console.error("Admin creation failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
