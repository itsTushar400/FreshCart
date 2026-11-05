
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Account.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

export default function Account() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("Login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const isLogin = mode === "Login";
      const endpoint = isLogin ? "login" : "register";

      const response = await fetch(
        `${API_URL}/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isLogin
              ? { email: email.trim(), password }
              : {
                  name: name.trim(),
                  email: email.trim(),
                  password,
                }
          ),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to complete your request."
        );
      }

      if (!data.token || !data.user) {
        throw new Error(
          "Login response is missing the token or user details."
        );
      }

      // Save the session in the format used by the admin pages.
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userEmail", data.user.email || "");
      localStorage.setItem("isLoggedIn", "true");

      const isAdmin =
        String(data.user.role || "").toLowerCase() === "admin";

      if (isAdmin) {
        localStorage.setItem("adminLoggedIn", "true");
      } else {
        localStorage.removeItem("adminLoggedIn");
      }

      // Use the same Account page for both customer and admin login.
      if (isLogin) {
        navigate(isAdmin ? "/admin" : "/", { replace: true });
      } else {
        setMessage("Account created successfully. Welcome to FreshCart!");
        navigate("/", { replace: true });
      }
    } catch (error) {
      setMessage(
        error.message || "Server connection failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="account-page">
      <form className="account-card" onSubmit={handleSubmit}>
        <h1>
          {mode === "Login" ? "Login to FreshCart" : "Register to FreshCart"}
        </h1>

        <p>Access your grocery orders and saved items.</p>

        {mode === "Register" && (
          <label>
            Full name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your name"
              autoComplete="name"
              required
            />
          </label>
        )}

        <label>
          Email address
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            autoComplete={
              mode === "Login" ? "current-password" : "new-password"
            }
            minLength={8}
            required
          />
        </label>

        {message && (
          <p role="alert" aria-live="polite">
            {message}
          </p>
        )}

        <button
          className="account-submit"
          type="submit"
          disabled={loading}
        >
          {loading ? "Please wait..." : mode}
        </button>

        <p className="account-switch">
          {mode === "Login"
            ? "New to FreshCart?"
            : "Already have an account?"}{" "}

          <button
            type="button"
            onClick={() => {
              setMode(mode === "Login" ? "Register" : "Login");
              setMessage("");
            }}
          >
            {mode === "Login" ? "Create account" : "Login instead"}
          </button>
        </p>
      </form>
    </section>
  );
}
