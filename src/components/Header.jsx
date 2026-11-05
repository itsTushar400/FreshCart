
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { products, photo, useShop } from "../context/ShopContext";
import "./Header.css";

export default function Header() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const accountMenuRef = useRef(null);

  const { cart = [] } = useShop();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const [deliveryLocation, setDeliveryLocation] = useState(() => {
    try {
      const saved = localStorage.getItem("freshcart-location");
      return saved
        ? JSON.parse(saved)
        : {
            title: "Home",
            address: "Choose your delivery address",
          };
    } catch {
      return {
        title: "Home",
        address: "Choose your delivery address",
      };
    }
  });

  const [locationOpen, setLocationOpen] = useState(false);
  const [pincode, setPincode] = useState("");
  const [postOffices, setPostOffices] = useState([]);
  const [selectedOffice, setSelectedOffice] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const cartCount = cart.reduce(
    (sum, item) => sum + Number(item.qty || item.quantity || 0),
    0
  );

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const accountName = user.name || (isLoggedIn ? "FreshCart Customer" : "Guest");
  const accountEmail =
    user.email || localStorage.getItem("userEmail") || "";
  const accountInitial = accountName.trim().charAt(0).toUpperCase() || "G";

  useEffect(() => {
    if (!accountMenuOpen) return;

    function onPointerDown(event) {
      if (!accountMenuRef.current?.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    }

    function onKeyDown(event) {
      if (event.key === "Escape") setAccountMenuOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountMenuOpen]);

  function handleLogout() {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (!confirmed) return;

    [
      "token",
      "user",
      "userEmail",
      "isLoggedIn",
      "adminLoggedIn",
      "admin",
      "adminToken",
    ].forEach((key) => localStorage.removeItem(key));

    ["token", "user", "admin"].forEach((key) =>
      sessionStorage.removeItem(key)
    );

    setAccountMenuOpen(false);
    navigate("/account", { replace: true });
  }

  useEffect(() => {
    if (!searchOpen) return;

    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    function onKeyDown(event) {
      if (event.key === "Escape") closeSearch();
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [searchOpen]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") setLocationOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const suggestions = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) return [];

    return (products || [])
      .filter((product) =>
        [product.name, product.category, product.weight].some((value) =>
          String(value || "").toLowerCase().includes(query)
        )
      )
      .slice(0, 6);
  }, [searchText]);

  function closeSearch() {
    setSearchOpen(false);
    setSearchText("");
  }

  function searchAll(event) {
    event?.preventDefault();

    const query = searchText.trim();
    if (!query) return;

    closeSearch();
    navigate(`/shop?q=${encodeURIComponent(query)}`);
  }

  function chooseProduct(product) {
    closeSearch();
    navigate(`/shop?q=${encodeURIComponent(product.name || "")}`);
  }

  function chooseLocation() {
    setLocationOpen(true);
    setPincode("");
    setPostOffices([]);
    setSelectedOffice("");
    setLocationError("");
  }

  async function findLocations(event) {
    event?.preventDefault();

    const code = pincode.trim();

    if (!/^\d{6}$/.test(code)) {
      setLocationError("Please enter a valid 6-digit PIN code.");
      return;
    }

    setLocationLoading(true);
    setLocationError("");
    setPostOffices([]);
    setSelectedOffice("");

    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${code}`
      );

      if (!response.ok) {
        throw new Error("Location request failed");
      }

      const data = await response.json();
      const offices = data?.[0]?.PostOffice || [];

      if (data?.[0]?.Status !== "Success" || offices.length === 0) {
        setLocationError("PIN code not found. Please check and try again.");
        return;
      }

      setPostOffices(offices);
      setSelectedOffice("0");
    } catch {
      setLocationError(
        "Unable to fetch location. Please check your internet connection."
      );
    } finally {
      setLocationLoading(false);
    }
  }

  function saveSelectedLocation() {
    const office = postOffices[Number(selectedOffice)];

    if (!office) {
      setLocationError("Please select your delivery area.");
      return;
    }

    const updatedLocation = {
      title: office.Name || "Delivery Area",
      address: `${office.Name}, ${office.District}, ${office.State} - ${pincode}`,
    };

    setDeliveryLocation(updatedLocation);

    try {
      localStorage.setItem(
        "freshcart-location",
        JSON.stringify(updatedLocation)
      );
    } catch {
      // The selected location remains available for this session.
    }

    setLocationOpen(false);
    setLocationError("");
  }

  return (
    <>
      <header className="topbar">
        <div className="header-brand-row">
          <Link to="/" className="brand" aria-label="FreshCart home">
            <span className="brand-icon" aria-hidden="true">
              🛒
            </span>

            <span className="brand-text">
              <strong>
                Fresh<span>Cart</span>
              </strong>
              <small>Fresh Products, Happy Life</small>
            </span>
          </Link>

          <div className="header-actions">
            <button
              type="button"
              className="header-action"
              onClick={() => setSearchOpen(true)}
              aria-label="Search products"
            >
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 4.5 4.5" />
              </svg>
              <small>Search</small>
            </button>

            <div className="account-menu-wrap" ref={accountMenuRef}>
              <button
                type="button"
                className="header-action account-trigger"
                onClick={() => setAccountMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
                aria-label="Open account menu"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
                </svg>
                <small>Account</small>
              </button>

              {accountMenuOpen && (
                <div className="account-popup" role="menu">
                  <div className="account-popup-profile">
                    <span className="account-avatar" aria-hidden="true">
                      {accountInitial}
                    </span>
                    <div className="account-popup-user">
                      <strong>{accountName}</strong>
                      {accountEmail && <span>{accountEmail}</span>}
                      {!isLoggedIn && (
                        <small className="account-role">Guest</small>
                      )}
                    </div>
                  </div>

                  <nav className="account-popup-links" aria-label="Account">
                    <Link
                      to="/profile"
                      role="menuitem"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      <span aria-hidden="true">♙</span>
                      <span><strong>My Profile</strong></span>
                      <span className="account-menu-arrow" aria-hidden="true">›</span>
                    </Link>
                    <Link
                      to="/my-orders"
                      role="menuitem"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      <span aria-hidden="true">▤</span>
                      <span><strong>My Orders</strong></span>
                      <span className="account-menu-arrow" aria-hidden="true">›</span>
                    </Link>
                    <Link
                      to="/wishlist"
                      role="menuitem"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      <span aria-hidden="true">♡</span>
                      <span><strong>My Wishlist</strong></span>
                      <span className="account-menu-arrow" aria-hidden="true">›</span>
                    </Link>
                  </nav>

                  <button
                    type="button"
                    className="account-logout"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            <Link className="header-action cart-action" to="/cart">
              <span className="cart-icon-wrap">
                <svg
                  viewBox="0 0 24 24"
                  width="23"
                  height="23"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 3h2l2.3 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6" />
                  <circle cx="10" cy="20" r="1.2" />
                  <circle cx="18" cy="20" r="1.2" />
                </svg>

                <span className="cart-badge">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              </span>
              <small>Cart</small>
            </Link>
          </div>
        </div>

        <button
          type="button"
          className="delivery-row"
          onClick={chooseLocation}
          aria-label="Change delivery address"
        >
          <span className="delivery-pin" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="21"
              height="21"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
          </span>

          <span className="delivery-copy">
            <span>
              Deliver to <strong>{deliveryLocation.title}</strong>
            </span>
            <small>{deliveryLocation.address}</small>
          </span>

          <span className="delivery-chevron" aria-hidden="true">
            ⌄
          </span>
        </button>
      </header>

      {/* Delivery location popup */}
      {locationOpen && (
        <div
          className="location-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setLocationOpen(false);
            }
          }}
        >
          <section
            className="location-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="location-modal-title"
          >
            <button
              type="button"
              className="location-close"
              onClick={() => setLocationOpen(false)}
              aria-label="Close location popup"
            >
              ×
            </button>

            <div className="location-heading-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                width="26"
                height="26"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
            </div>

            <h3 id="location-modal-title">Choose delivery location</h3>
            <p className="location-subtitle">
              Enter your PIN code to find your delivery area.
            </p>

            <form className="pincode-form" onSubmit={findLocations}>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                placeholder="Enter 6-digit PIN code"
                value={pincode}
                onChange={(event) => {
                  setPincode(
                    event.target.value.replace(/\D/g, "").slice(0, 6)
                  );
                  setPostOffices([]);
                  setSelectedOffice("");
                  setLocationError("");
                }}
                aria-label="6-digit PIN code"
              />

              <button type="submit" disabled={locationLoading}>
                {locationLoading ? "Searching..." : "Find Area"}
              </button>
            </form>

            {locationLoading && (
              <p className="location-status">Finding available post offices…</p>
            )}

            {locationError && (
              <p className="location-error" role="alert">
                {locationError}
              </p>
            )}

            {postOffices.length > 0 && (
              <div className="location-results">
                <label htmlFor="post-office-select">
                  Select your post office
                </label>

                <select
                  id="post-office-select"
                  value={selectedOffice}
                  onChange={(event) => setSelectedOffice(event.target.value)}
                >
                  {postOffices.map((office, index) => (
                    <option key={`${office.Name}-${index}`} value={String(index)}>
                      {office.Name} — {office.Block || office.District}
                    </option>
                  ))}
                </select>

                <div className="location-details">
                  <div>
                    <span>District</span>
                    <strong>
                      {postOffices[Number(selectedOffice)]?.District || "—"}
                    </strong>
                  </div>

                  <div>
                    <span>State</span>
                    <strong>
                      {postOffices[Number(selectedOffice)]?.State || "—"}
                    </strong>
                  </div>

                  <div>
                    <span>PIN code</span>
                    <strong>{pincode}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="location-save"
                  onClick={saveSelectedLocation}
                >
                  Confirm Location
                </button>
              </div>
            )}

            <p className="location-footnote">
              <span aria-hidden="true">ⓘ</span> PIN code lookup shows postal
              areas, not your exact GPS or house location.
            </p>
          </section>
        </div>
      )}

      {/* Search popup */}
      {searchOpen && (
        <div
          className="search-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeSearch();
          }}
        >
          <section
            className="search-popup"
            role="dialog"
            aria-modal="true"
            aria-label="Search groceries"
          >
            <form className="search-popup-input" onSubmit={searchAll}>
              <svg
                viewBox="0 0 24 24"
                width="21"
                height="21"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 4.5 4.5" />
              </svg>

              <input
                ref={inputRef}
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search tomato, milk, fruits..."
                autoComplete="off"
                aria-label="Search groceries"
              />

              {searchText && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => setSearchText("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}

              <button
                type="button"
                className="search-close"
                onClick={closeSearch}
                aria-label="Close search"
              >
                ✕
              </button>
            </form>

            <div className="search-suggestions">
              {!searchText.trim() ? (
                <div className="popular-searches">
                  <p>Popular searches</p>
                  {["Milk", "Fruits", "Vegetables", "Rice"].map((term) => (
                    <button
                      type="button"
                      key={term}
                      onClick={() => {
                        setSearchText(term);
                        navigate(`/shop?q=${encodeURIComponent(term)}`);
                        closeSearch();
                      }}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((product, index) => (
                  <button
                    type="button"
                    className="search-suggestion-item"
                    key={product.id ?? `${product.name}-${index}`}
                    onClick={() => chooseProduct(product)}
                  >
                    <span className="suggestion-product-icon" aria-hidden="true">
                      {product.image ? (
                        <img
                          src={photo(product.image)}
                          alt={product.name || "Grocery product"}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' rx='12' fill='%23f0f7f1'/%3E%3Ctext x='40' y='51' font-size='34' text-anchor='middle'%3E🥬%3C/text%3E%3C/svg%3E";
                          }}
                        />
                      ) : (
                        <span className="suggestion-product-emoji">🥬</span>
                      )}
                    </span>

                    <span className="suggestion-product-copy">
                      <strong>{product.name}</strong>
                      <small>
                        {[product.category, product.weight]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                    </span>

                    <span className="suggestion-product-end">
                      {product.price != null && (
                        <strong className="suggestion-product-price">
                          ₹{product.price}
                        </strong>
                      )}
                      <span className="suggestion-product-arrow" aria-hidden="true">›</span>
                    </span>
                  </button>
                ))
              ) : (
                <p className="no-search-results">
                  No products found for “{searchText}”
                </p>
              )}
            </div>

            {searchText.trim() && suggestions.length > 0 && (
              <button
                type="button"
                className="view-all-results"
                onClick={searchAll}
              >
                View all results for “{searchText.trim()}”
              </button>
            )}
          </section>
        </div>
      )}
    </>
  );
}
