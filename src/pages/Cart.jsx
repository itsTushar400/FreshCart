
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import "./Cart.css";

const FREE_DELIVERY_LIMIT = 499;
const DELIVERY_CHARGE = 40;
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const APPLIED_COUPON_KEY = "freshcart_applied_coupon";

function readAppliedCoupon() {
  try {
    return JSON.parse(sessionStorage.getItem(APPLIED_COUPON_KEY) || "null");
  } catch {
    return null;
  }
}

function getImageUrl(image) {
  if (!image) return "";

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `https://images.unsplash.com/${image}?auto=format&fit=crop&w=300&q=85`;
}

export default function Cart() {
  const navigate = useNavigate();
  const { cart, changeQty, removeFromCart } = useShop();

  const [coupons, setCoupons] = useState([]);
  const [couponLoading, setCouponLoading] = useState(true);
  const [couponLoadError, setCouponLoadError] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(readAppliedCoupon);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponError, setCouponError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCoupons() {
      setCouponLoading(true);
      setCouponLoadError("");
      try {
        const response = await fetch(`${API_URL}/api/coupons/active`, {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.message || `Coupons unavailable (HTTP ${response.status}).`);
        }
        if (!Array.isArray(payload.coupons)) {
          throw new Error("Coupon data was not returned by the server.");
        }
        if (!cancelled) {
          setCoupons(payload.coupons.map((coupon) => ({
            ...coupon,
            value: Number(coupon.value),
            minOrder: Number(coupon.minOrder),
          })));
        }
      } catch (error) {
        if (!cancelled) {
          setCouponLoadError(error.message || "Active coupons could not be loaded.");
        }
      } finally {
        if (!cancelled) setCouponLoading(false);
      }
    }

    loadCoupons();
    return () => {
      cancelled = true;
    };
  }, []);

  const subtotal = cart.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * Number(item.qty || 1),
    0
  );

  const totalItems = cart.reduce(
    (sum, item) => sum + Number(item.qty || 1),
    0
  );

  const deliveryCharge =
    subtotal === 0 || subtotal >= FREE_DELIVERY_LIMIT
      ? 0
      : DELIVERY_CHARGE;

  const remaining = Math.max(0, FREE_DELIVERY_LIMIT - subtotal);

  const progress = Math.min(
    100,
    (subtotal / FREE_DELIVERY_LIMIT) * 100
  );

  const activeCoupon = appliedCoupon &&
    subtotal >= Number(appliedCoupon.minOrder) &&
    (couponLoading ||
      Boolean(couponLoadError) ||
      coupons.some((coupon) => coupon.code === appliedCoupon.code))
    ? appliedCoupon
    : null;
  const couponInvalidReason = appliedCoupon && !activeCoupon
    ? subtotal < Number(appliedCoupon.minOrder)
      ? "Coupon removed because your cart is below its minimum order."
      : "Coupon removed because it is no longer active."
    : "";

  const discount = activeCoupon
    ? Math.min(
        subtotal,
        activeCoupon.type === "Percentage"
          ? Math.round((subtotal * activeCoupon.value) / 100)
          : activeCoupon.value
      )
    : 0;

  const total = Math.max(0, subtotal - discount + deliveryCharge);

  function applyCoupon(codeToApply = couponInput) {
    const code = codeToApply.trim().toUpperCase();
    const coupon = coupons.find((item) => item.code.toUpperCase() === code);

    if (!code) {
      setCouponError(true);
      setCouponMessage("Please enter a coupon code.");
      return;
    }

    if (!coupon) {
      setCouponError(true);
      setCouponMessage(
        couponLoading
          ? "Please wait while active coupons are loading."
          : couponLoadError
            ? "Coupons could not be checked. Please try again."
            : "Invalid or inactive coupon code. Please try again."
      );
      return;
    }

    if (subtotal < coupon.minOrder) {
      setCouponError(true);
      setCouponMessage(
        `${code} requires a minimum order of ₹${coupon.minOrder}.`
      );
      return;
    }

    const applied = { ...coupon, code };
    setAppliedCoupon(applied);
    sessionStorage.setItem(APPLIED_COUPON_KEY, JSON.stringify(applied));
    setCouponInput(code);
    setCouponError(false);
    setCouponMessage(`Coupon ${code} applied successfully!`);
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    sessionStorage.removeItem(APPLIED_COUPON_KEY);
    setCouponInput("");
    setCouponMessage("Coupon removed.");
    setCouponError(false);
  }

  function invalidateCouponForSubtotal(nextSubtotal) {
    if (appliedCoupon && nextSubtotal < Number(appliedCoupon.minOrder)) {
      setAppliedCoupon(null);
      sessionStorage.removeItem(APPLIED_COUPON_KEY);
      setCouponInput("");
      setCouponError(true);
      setCouponMessage("Coupon removed because your cart is below its minimum order.");
    }
  }

  useEffect(() => {
    if (couponInvalidReason) {
      sessionStorage.removeItem(APPLIED_COUPON_KEY);
    }
  }, [couponInvalidReason]);

  function handleQuantityChange(id, delta) {
    const item = cart.find((cartItem) => cartItem.id === id);
    if (item) {
      const nextSubtotal =
        subtotal + delta * Number(item.price || 0);
      invalidateCouponForSubtotal(nextSubtotal);
    }
    changeQty(id, delta);
  }

  function handleRemoveFromCart(id) {
    const item = cart.find((cartItem) => cartItem.id === id);
    if (item) {
      const nextSubtotal =
        subtotal - Number(item.price || 0) * Number(item.qty || 1);
      invalidateCouponForSubtotal(nextSubtotal);
    }
    removeFromCart(id);
  }

  return (
    <main className="fc-cart-page">
      <div className="fc-cart-heading">
        <div>
          <h1>Shopping Cart</h1>
          <p>
            {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        {cart.length > 0 && (
          <Link to="/shop" className="fc-back-shop">
            ← Continue Shopping
          </Link>
        )}
      </div>

      {cart.length === 0 ? (
        <section className="fc-empty-cart">
          <div className="fc-empty-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add fresh groceries to get started.</p>
          <Link to="/shop" className="fc-primary-link">
            Explore Products <span>→</span>
          </Link>
        </section>
      ) : (
        <div className="fc-cart-layout">
          {/* LEFT: Cart products */}
          <section className="fc-cart-products">
            <div className="fc-section-heading">
              <h2>Your Items</h2>
              <span>{totalItems} items</span>
            </div>

            <div className="fc-cart-list">
              {cart.map((item) => {
                const price = Number(item.price || 0);
                const qty = Number(item.qty || 1);
                const oldPrice = Number(item.old || 0);

                const productDiscount =
                  oldPrice > price && oldPrice > 0
                    ? Math.round(((oldPrice - price) / oldPrice) * 100)
                    : Number(item.off || 0);

                return (
                  <article className="fc-cart-item" key={item.id}>
                    <div className="fc-product-image">
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name || item.title || "Grocery product"}
                      />
                    </div>

                    <div className="fc-product-details">
                      <h3>{item.name || item.title || "Grocery Product"}</h3>

                      <p className="fc-product-weight">
                        {item.weight || item.unit || "1 unit"} · ₹{price} each
                      </p>

                      {productDiscount > 0 && (
                        <div className="fc-product-discount">
                          <span>{productDiscount}% OFF</span>
                          {oldPrice > price && <del>₹{oldPrice}</del>}
                        </div>
                      )}

                      <div className="fc-quantity-control">
                        <button
                          type="button"
                          aria-label={`Decrease ${item.name || "product"} quantity`}
                          onClick={() => handleQuantityChange(item.id, -1)}
                        >
                          −
                        </button>

                        <span>{qty}</span>

                        <button
                          type="button"
                          aria-label={`Increase ${item.name || "product"} quantity`}
                          onClick={() => handleQuantityChange(item.id, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="fc-product-side">
                      <strong>₹{price * qty}</strong>

                      <button
                        type="button"
                        className="fc-remove-button"
                        onClick={() => handleRemoveFromCart(item.id)}
                        aria-label={`Remove ${item.name || "product"} from cart`}
                      >
                        <span aria-hidden="true">▤</span> Remove
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Free delivery banner */}
            <div className="fc-delivery-banner">
              <div className="fc-delivery-icon">🚚</div>

              <div className="fc-delivery-content">
                {remaining > 0 ? (
                  <>
                    <h3>
                      Add ₹{remaining} more for{" "}
                      <span>FREE delivery!</span>
                    </h3>
                    <p>You're getting closer to free delivery.</p>
                  </>
                ) : (
                  <>
                    <h3>
                      Great! <span>Free delivery unlocked</span>
                    </h3>
                    <p>Your order qualifies for free delivery.</p>
                  </>
                )}

                <div
                  className="fc-progress-track"
                  role="progressbar"
                  aria-label="Free delivery progress"
                  aria-valuenow={Math.round(progress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="fc-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <Link to="/shop" className="fc-continue-link">
              <span>←</span> Continue Shopping
            </Link>
          </section>

          {/* RIGHT: Order summary */}
          <aside className="fc-order-sidebar">
            <div className="fc-order-summary">
              <h2>Order Summary</h2>

              <div className="fc-summary-row">
                <span>Items ({totalItems})</span>
                <strong>₹{subtotal}</strong>
              </div>

              <div className="fc-summary-row">
                <span>Delivery charge</span>
                {deliveryCharge === 0 ? (
                  <strong className="fc-free-label">FREE</strong>
                ) : (
                  <strong>₹{deliveryCharge}</strong>
                )}
              </div>

              {remaining > 0 && (
                <p className="fc-summary-hint">
                  Add ₹{remaining} more to save ₹{DELIVERY_CHARGE} on delivery.
                </p>
              )}

              {/* Coupon section */}
              <div className="fc-coupon-box">
                <h3>🎟️ Apply Coupon</h3>
                <p>Save more on your grocery order</p>
                {couponLoadError && (
                  <p className="fc-coupon-message is-error" role="status">
                    {couponLoadError}
                  </p>
                )}

                {!activeCoupon ? (
                  <form
                    className="fc-coupon-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      applyCoupon();
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponInput}
                      onChange={(event) => {
                        setCouponInput(event.target.value);
                        setCouponMessage("");
                      }}
                      aria-label="Coupon code"
                    />

                    <button type="submit">Apply</button>
                  </form>
                ) : (
                  <div className="fc-applied-coupon">
                    <div>
                      <strong>✓ {appliedCoupon.code}</strong>
                      <p>You're saving ₹{discount}</p>
                    </div>

                    <button type="button" onClick={removeCoupon}>
                      Remove
                    </button>
                  </div>
                )}

                {(couponInvalidReason || couponMessage) && (
                  <p
                    className={`fc-coupon-message ${
                      couponInvalidReason || couponError ? "is-error" : "is-success"
                    }`}
                    role="status"
                  >
                    {couponInvalidReason || couponMessage}
                  </p>
                )}

                {!activeCoupon && (
                  <div className="fc-coupon-suggestions">
                    {coupons.slice(0, 2).map((coupon) => (
                      <button
                        type="button"
                        key={coupon.id}
                        onClick={() => {
                          setCouponInput(coupon.code);
                          applyCoupon(coupon.code);
                        }}
                      >
                        {coupon.code}{" "}
                        <span>
                          {coupon.type === "Percentage"
                            ? `${coupon.value}% OFF`
                            : `₹${coupon.value} OFF`}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {discount > 0 && (
                <div className="fc-summary-row fc-discount-row">
                  <span>Coupon discount</span>
                  <strong>−₹{discount}</strong>
                </div>
              )}

              <div className="fc-summary-divider" />

              <div className="fc-summary-total">
                <span>Total</span>
                <strong>₹{total}</strong>
              </div>

              <button
                type="button"
                className="fc-checkout-button"
                onClick={() => navigate("/checkout")}
              >
                Proceed to Checkout <span>→</span>
              </button>

              <Link to="/shop" className="fc-summary-continue">
                Continue Shopping
              </Link>

              <div className="fc-trust-list">
                <div className="fc-trust-item">
                  <span className="fc-trust-icon">✓</span>
                  <div>
                    <strong>Safe & Secure Checkout</strong>
                    <p>Your details are handled securely.</p>
                  </div>
                </div>

                <div className="fc-trust-item">
                  <span className="fc-trust-icon">🚚</span>
                  <div>
                    <strong>Fast Delivery</strong>
                    <p>Fresh groceries at your doorstep.</p>
                  </div>
                </div>

                <div className="fc-trust-item">
                  <span className="fc-trust-icon">🌿</span>
                  <div>
                    <strong>Fresh Products</strong>
                    <p>Quality groceries for everyday needs.</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
