import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import "./Checkout.css";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const LOCATION_KEY = "freshcart_delivery_location";
const APPLIED_COUPON_KEY = "freshcart_applied_coupon";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function getProductName(item) {
  return item.name || item.title || item.product_name || "Product";
}

function getItemPrice(item) {
  return Number(item.price ?? item.salePrice ?? 0);
}

function getItemQty(item) {
  return Math.max(1, Number(item.qty ?? item.quantity ?? 1) || 1);
}

export default function Checkout() {
  const { cart, clearCart } = useShop();

  const savedLocation = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(LOCATION_KEY) || "{}");
    } catch {
      return {};
    }
  }, []);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    pincode: savedLocation.pincode || "",
    district: savedLocation.district || "",
    state: savedLocation.state || "",
    address: "",
    landmark: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [appliedCoupon] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(APPLIED_COUPON_KEY) || "null");
    } catch {
      return null;
    }
  });

  const subtotal = cart.reduce(
    (sum, item) => sum + getItemPrice(item) * getItemQty(item),
    0
  );

  // Free delivery for orders of ₹499 or more.
  const deliveryFee = subtotal === 0 || subtotal >= 499 ? 0 : 40;
  const couponDiscount = appliedCoupon && subtotal >= Number(appliedCoupon.minOrder)
    ? Math.min(
        subtotal,
        appliedCoupon.type === "Percentage"
          ? Math.round((subtotal * Number(appliedCoupon.value)) / 100)
          : Number(appliedCoupon.value)
      )
    : 0;
  const total = Math.max(0, subtotal - couponDiscount) + deliveryFee;

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        name === "phone" || name === "pincode"
          ? value.replace(/\D/g, "").slice(0, name === "phone" ? 10 : 6)
          : value,
    }));
  }

  async function confirmOrder(event) {
    event.preventDefault();
    setError("");

    if (!cart.length) {
      setError("Your cart is empty. Please add products first.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (!/^\d{6}$/.test(form.pincode)) {
      setError("Please enter a valid 6-digit PIN code.");
      return;
    }

    if (!form.name.trim() || !form.address.trim()) {
      setError("Please fill in your name and complete delivery address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!form.district.trim() || !form.state.trim()) {
      setError("Please enter your district/city and state.");
      return;
    }

    if (paymentMethod === "online") {
      setError(
        "Online payment is not connected yet. Please select Cash on Delivery."
      );
      return;
    }

    setSubmitting(true);

    try {
      const customer = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone,
        pincode: form.pincode,
        district: form.district.trim(),
        state: form.state.trim(),
        address: form.address.trim(),
        landmark: form.landmark.trim(),
      };

      const items = cart.map((item) => ({
        productId: item.id ?? item.productId ?? item.product_id,
        id: item.id ?? item.productId ?? item.product_id,
        name: getProductName(item),
        price: getItemPrice(item),
        quantity: getItemQty(item),
        qty: getItemQty(item),
        weight: item.weight || "",
        image: item.image || item.thumbnail || "",
      }));

      if (items.some((item) => item.productId == null)) {
        throw new Error(
          "A product ID is missing from your cart. Refresh the shop and add the product again."
        );
      }

      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          customerName: customer.name,
          email: customer.email,
          phone: customer.phone,
          pincode: customer.pincode,
          district: customer.district,
          state: customer.state,
          address: customer.address,
          landmark: customer.landmark,
          items,
          subtotal,
          deliveryFee,
          shipping: deliveryFee,
          total,
          paymentMethod: "COD",
          paymentStatus: "pending",
          orderStatus: "placed",
          status: "pending",
          couponCode: appliedCoupon?.code || "",
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Order could not be saved (HTTP ${response.status}). Check that POST /api/orders exists on your backend.`
        );
      }

      const savedOrder = data.order || data.data || data;
      const order = {
        ...savedOrder,
        id:
          savedOrder.id ??
          savedOrder.orderId ??
          savedOrder.order_id ??
          `FC${Date.now()}`,
        customer: savedOrder.customer || customer,
        total: Number(savedOrder.total ?? total),
        paymentMethod: "COD",
      };

      // Keep the delivery location for the next checkout. The order itself
      // is saved by the backend, not only in this browser.
      localStorage.setItem(
        LOCATION_KEY,
        JSON.stringify({
          pincode: customer.pincode,
          district: customer.district,
          state: customer.state,
        })
      );

      sessionStorage.removeItem(APPLIED_COUPON_KEY);
      clearCart();
      setConfirmedOrder(order);
    } catch (err) {
      setError(
        err.message ||
          "Backend se connection nahi ho paya. API URL aur server check karein."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmedOrder) {
    return (
      <main className="checkout-page">
        <section className="checkout-success">
          <div className="success-icon">✓</div>
          <h1>Order placed successfully!</h1>
          <p>
            Thank you, {confirmedOrder.customer?.name || form.name}. Your order
            has been submitted to FreshCart.
          </p>

          <div className="success-order-info">
            <span>Order ID</span>
            <strong>{confirmedOrder.id}</strong>
            <span>Total amount</span>
            <strong>{money(confirmedOrder.total)}</strong>
            <span>Payment</span>
            <strong>Cash on Delivery</strong>
            <span>Delivery PIN</span>
            <strong>{confirmedOrder.customer?.pincode || form.pincode}</strong>
          </div>

          <p className="checkout-notice">
            Your order was sent to the server. Online payment is not enabled;
            please pay when the order arrives.
          </p>

          <Link className="checkout-primary" to="/shop">
            Continue shopping
          </Link>
          <Link className="checkout-back-link" to="/">
            Back to home
          </Link>
        </section>
      </main>
    );
  }

  if (!cart.length) {
    return (
      <main className="checkout-page">
        <section className="checkout-empty">
          <div className="checkout-empty-icon">🛒</div>
          <h1>Your cart is empty</h1>
          <p>Add some fresh products before checking out.</p>
          <Link className="checkout-primary" to="/shop">
            Explore products
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-heading">
        <div>
          <span className="checkout-eyebrow">FRESHCART CHECKOUT</span>
          <h1>Complete your order</h1>
          <p>Enter your delivery details and select a payment method.</p>
        </div>
        <Link to="/cart" className="checkout-back-link">
          ← Back to cart
        </Link>
      </div>

      <form className="checkout-layout" onSubmit={confirmOrder}>
        <div className="checkout-main">
          <section className="checkout-card">
            <div className="checkout-section-title">
              <span className="checkout-step">1</span>
              <div>
                <h2>Delivery address</h2>
                <p>Where should we deliver your order?</p>
              </div>
            </div>

            <div className="checkout-fields">
              <label>
                Full name *
                <input
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  maxLength={100}
                  required
                />
              </label>

              <label>
                Mobile number *
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={updateField}
                  placeholder="10-digit mobile number"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={10}
                  required
                />
              </label>

              <label>
                Email address *
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={updateField}
                  placeholder="you@example.com"
                  autoComplete="email"
                  maxLength={190}
                  required
                />
              </label>

              <label>
                PIN code *
                <input
                  name="pincode"
                  value={form.pincode}
                  onChange={updateField}
                  placeholder="6-digit PIN code"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  required
                />
              </label>

              <label>
                District / City *
                <input
                  name="district"
                  value={form.district}
                  onChange={updateField}
                  placeholder="District or city"
                  autoComplete="address-level2"
                  maxLength={100}
                  required
                />
              </label>

              <label>
                State *
                <input
                  name="state"
                  value={form.state}
                  onChange={updateField}
                  placeholder="State"
                  autoComplete="address-level1"
                  maxLength={100}
                  required
                />
              </label>

              <label className="checkout-full-field">
                House number, street and area *
                <textarea
                  name="address"
                  value={form.address}
                  onChange={updateField}
                  placeholder="House no., street, locality..."
                  autoComplete="street-address"
                  rows={3}
                  maxLength={400}
                  required
                />
              </label>

              <label className="checkout-full-field">
                Landmark (optional)
                <input
                  name="landmark"
                  value={form.landmark}
                  onChange={updateField}
                  placeholder="Nearby shop, school, etc."
                  maxLength={150}
                />
              </label>
            </div>
          </section>

          <section className="checkout-card">
            <div className="checkout-section-title">
              <span className="checkout-step">2</span>
              <div>
                <h2>Payment method</h2>
                <p>Choose how you would like to pay.</p>
              </div>
            </div>

            <div className="checkout-payment-options">
              <label
                className={`checkout-payment-option ${
                  paymentMethod === "cod" ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                />
                <span className="payment-option-icon">💵</span>
                <span className="payment-option-copy">
                  <strong>Cash on Delivery</strong>
                  <small>Pay when your order arrives</small>
                </span>
                <span className="payment-option-check">✓</span>
              </label>

              <label
                className={`checkout-payment-option ${
                  paymentMethod === "online" ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="online"
                  checked={paymentMethod === "online"}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                />
                <span className="payment-option-icon">💳</span>
                <span className="payment-option-copy">
                  <strong>Online payment</strong>
                  <small>UPI, cards and net banking</small>
                </span>
                <span className="payment-option-check">✓</span>
              </label>

              {paymentMethod === "online" && (
                <p className="checkout-notice">
                  Online payment gateway is not connected yet. Select Cash on
                  Delivery to place an order.
                </p>
              )}
            </div>
          </section>

          {error && (
            <div className="checkout-error" role="alert">
              {error}
            </div>
          )}
        </div>

        <aside className="checkout-card checkout-summary">
          <h2>Order summary</h2>
          <p className="summary-caption">
            {cart.length} product type{cart.length === 1 ? "" : "s"}
          </p>

          <div className="checkout-items">
            {cart.map((item, index) => (
              <div
                className="checkout-item"
                key={item.id ?? `${getProductName(item)}-${index}`}
              >
                {item.image || item.thumbnail ? (
                  <img
                    src={
                      (item.image || item.thumbnail).startsWith("http")
                        ? item.image || item.thumbnail
                        : `https://images.unsplash.com/${item.image || item.thumbnail}?auto=format&fit=crop&w=150&q=80`
                    }
                    alt={getProductName(item)}
                  />
                ) : (
                  <div className="checkout-item-placeholder">🥬</div>
                )}

                <div className="checkout-item-info">
                  <strong>{getProductName(item)}</strong>
                  <span>
                    {getItemQty(item)} × {money(getItemPrice(item))}
                  </span>
                </div>

                <strong className="checkout-item-total">
                  {money(getItemPrice(item) * getItemQty(item))}
                </strong>
              </div>
            ))}
          </div>

          <div className="checkout-price-row">
            <span>Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>

          <div className="checkout-price-row">
            <span>Delivery charge</span>
            <span className={deliveryFee === 0 ? "free-delivery" : ""}>
              {deliveryFee === 0 ? "FREE" : money(deliveryFee)}
            </span>
          </div>

          {couponDiscount > 0 && (
            <div className="checkout-price-row">
              <span>Coupon ({appliedCoupon.code})</span>
              <span>−{money(couponDiscount)}</span>
            </div>
          )}

          <p className="checkout-delivery-note">
            {subtotal >= 499
              ? "You qualify for free delivery."
              : `Add ${money(499 - subtotal)} more for free delivery.`}
          </p>

          <div className="checkout-total-row">
            <strong>Total</strong>
            <strong>{money(total)}</strong>
          </div>

          <button
            type="submit"
            className="checkout-primary checkout-place-order"
            disabled={submitting}
          >
            {submitting
              ? "Processing..."
              : paymentMethod === "cod"
                ? `Place COD order · ${money(total)}`
                : "Online payment unavailable"}
          </button>

          <p className="checkout-secure-note">
            🔒 Order details are submitted securely to the FreshCart backend.
          </p>

          <Link to="/cart" className="checkout-edit-cart">
            Edit cart
          </Link>
        </aside>
      </form>
    </main>
  );
}
