
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package as FiPackage,
  CircleCheck as FiCheckCircle,
  Truck as FiTruck,
  Clock3 as FiClock,
  CircleX as FiXCircle,
  ShoppingCart as FiShoppingCart,
  ChevronLeft as FiChevronLeft,
  ChevronRight as FiChevronRight,
  RefreshCw as FiRefreshCw,
  MapPin as FiMapPin,
  Eye as FiEye,
  ArrowRight as FiArrowRight,
} from "lucide-react";

import { photo, products } from "../context/ShopContext";
import OrderTrackingModal from "./OrderTrackingModal";
import "./MyOrders.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const STEPS = ["Confirmed", "Packed", "Shipped", "Delivered"];
const PAGE_SIZE = 5;

function getStatus(status) {
  const value = String(status || "pending").toLowerCase();

  if (value === "processing") return "confirmed";
  if (value === "complete" || value === "completed") {
    return "delivered";
  }

  return value;
}

function formatDate(date) {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Date unavailable";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date) {
  if (!date) return "";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function money(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function getItemQty(item) {
  return Number(item?.qty ?? item?.quantity ?? 1);
}

function getItemImageUrl(image, productName) {
  if (image && /^https?:\/\//i.test(image)) {
    return image;
  }

  const product = products.find(
    (item) =>
      item.name?.toLowerCase() ===
      String(productName || "").toLowerCase()
  );

  if (product?.image) {
    return photo(product.image);
  }

  if (image && !String(image).startsWith("/")) {
    return `https://images.unsplash.com/${image}?auto=format&fit=crop&w=160&q=85`;
  }

  return `https://placehold.co/120x120/f3f7f4/168447?text=${encodeURIComponent(
    productName || "Product"
  )}`;
}

function StatusBadge({ status }) {
  const normalized = getStatus(status);

  const statusMap = {
    pending: ["Pending", FiClock],
    confirmed: ["Processing", FiCheckCircle],
    packed: ["Packed", FiPackage],
    shipped: ["Shipped", FiTruck],
    delivered: ["Delivered", FiCheckCircle],
    cancelled: ["Cancelled", FiXCircle],
  };

  const [label, Icon] = statusMap[normalized] || [
    normalized,
    FiClock,
  ];

  return (
    <span className={`mo-status mo-status-${normalized}`}>
      <Icon />
      {label}
    </span>
  );
}

function OrderTimeline({ status, createdAt }) {
  const normalized = getStatus(status);

  if (normalized === "cancelled") {
    return (
      <div className="mo-cancelled">
        <FiXCircle />
        This order was cancelled.
      </div>
    );
  }

  const currentStep =
    normalized === "pending"
      ? -1
      : STEPS.findIndex(
          (step) => step.toLowerCase() === normalized
        );

  return (
    <div className="mo-timeline">
      {STEPS.map((step, index) => {
        const complete = index <= currentStep;

        return (
          <div
            className={`mo-timeline-step ${
              complete ? "is-complete" : ""
            }`}
            key={step}
          >
            <div className="mo-timeline-line">
              <span className="mo-timeline-dot">
                {complete && <FiCheckCircle />}
              </span>
            </div>

            <strong>{step}</strong>
            <small>
              {complete ? formatDate(createdAt) : "—"}
            </small>
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({
  order,
  expanded,
  onViewDetails,
  onTrackOrder,
}) {
  const items = Array.isArray(order.items) ? order.items : [];

  const itemCount = items.reduce(
    (sum, item) => sum + getItemQty(item),
    0
  );

  const status = getStatus(order.status);
  const orderDate = order.createdAt || order.created_at;

  const canTrack = [
    "pending",
    "confirmed",
    "packed",
    "shipped",
  ].includes(status);

  return (
    <article className="mo-order-card">
      <div className="mo-order-top">
        <div className="mo-order-title">
          <h3>Order #{order.id}</h3>
          <p>
            Placed on{" "}
            {formatDateTime(orderDate) || formatDate(orderDate)}
          </p>
        </div>

        <StatusBadge status={status} />

        <div className="mo-order-actions">
          <button
            type="button"
            className="mo-btn mo-btn-outline"
            onClick={() => onViewDetails(order.id)}
            aria-expanded={expanded}
          >
            <FiEye />
            {expanded ? "Hide Details" : "View Details"}
          </button>

          {canTrack && (
            <button
              type="button"
              className="mo-btn mo-btn-green"
              onClick={() => onTrackOrder(order)}
              aria-label={`Track order ${order.id}`}
            >
              <FiMapPin />
              Track Order
            </button>
          )}

          {status === "delivered" && (
            <Link to="/shop" className="mo-btn mo-btn-green">
              <FiShoppingCart />
              Buy Again
            </Link>
          )}
        </div>
      </div>

      <div className="mo-order-body">
        <div className="mo-order-products">
          <div className="mo-product-thumbnails">
            {items.slice(0, 3).map((item, index) => (
              <div
                className="mo-product-thumb"
                key={`${item.id ?? item.productId ?? "product"}-${index}`}
                title={item.name || "Product"}
              >
                {item.image || item.thumbnail ? (
                  <img
                    src={getItemImageUrl(
                      item.image || item.thumbnail,
                      item.name
                    )}
                    alt={item.name || "Product"}
                    loading="lazy"
                  />
                ) : (
                  <FiShoppingCart />
                )}
              </div>
            ))}

            {items.length > 3 && (
              <div className="mo-more-items">
                +{items.length - 3} more
              </div>
            )}

            {items.length === 0 && (
              <div className="mo-product-thumb">
                <FiPackage />
              </div>
            )}
          </div>

          <p>
            {itemCount} {itemCount === 1 ? "item" : "items"}
            <span>•</span>
            <strong>{money(order.total)}</strong>
          </p>
        </div>

        <div
          className="mo-order-tracking"
          id={`tracking-${order.id}`}
        >
          <OrderTimeline
            status={status}
            createdAt={orderDate}
          />
        </div>
      </div>

      {expanded && (
        <div className="mo-order-details">
          <h4>Order Details</h4>

          <div className="mo-detail-grid">
            <div>
              <span>Order ID</span>
              <strong>#{order.id}</strong>
            </div>

            <div>
              <span>Order Date</span>
              <strong>{formatDate(orderDate)}</strong>
            </div>

            <div>
              <span>Order Total</span>
              <strong>{money(order.total)}</strong>
            </div>

            <div>
              <span>Status</span>
              <strong>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </strong>
            </div>
          </div>

          <div className="mo-detail-address">
            <FiMapPin />
            <div>
              <strong>Delivery Address</strong>
              <p>
                {order.delivery_address ||
                  order.address ||
                  "Address not available"}
              </p>
            </div>
          </div>

          {items.length > 0 && (
            <div className="mo-detail-items">
              <h4>Items in this order</h4>

              {items.map((item, index) => (
                <div
                  className="mo-detail-item"
                  key={`${item.id ?? item.productId ?? "product"}-${index}`}
                >
                  <span>
                    {item.name || "Product"} × {getItemQty(item)}
                  </span>

                  <strong>
                    {money(
                      Number(item.price || 0) * getItemQty(item)
                    )}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [page, setPage] = useState(1);

  const loadOrders = useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setOrders([]);
        setError("Please log in to view your orders.");
        return;
      }

      const response = await fetch(`${API_URL}/api/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        signal,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            (response.status === 401
              ? "Your login session has expired. Please log in again."
              : `Unable to load orders (${response.status}).`)
        );
      }

      const fetchedOrders = Array.isArray(data.orders)
        ? data.orders
        : Array.isArray(data.data?.orders)
        ? data.data.orders
        : [];

      setOrders(fetchedOrders);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(
          err.message === "Failed to fetch"
            ? "Unable to connect to the server. Check your API URL, backend and CORS settings."
            : err.message || "Unable to load your orders."
        );
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    loadOrders(controller.signal);

    return () => controller.abort();
  }, [loadOrders]);

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(orders.length / PAGE_SIZE)
    );

    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [orders.length, page]);

  const totalSpent = orders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const delivered = orders.filter(
    (order) => getStatus(order.status) === "delivered"
  ).length;

  const inProgress = orders.filter((order) =>
    ["pending", "confirmed", "packed", "shipped"].includes(
      getStatus(order.status)
    )
  ).length;

  const totalPages = Math.max(
    1,
    Math.ceil(orders.length / PAGE_SIZE)
  );

  const visibleOrders = orders.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <section className="my-orders-page">
      <div className="mo-container">
        <div className="mo-breadcrumb">
          <Link to="/">Home</Link>
          <span>›</span>
          <span>My Orders</span>
        </div>

        <div className="mo-hero">
          <div>
            <span className="mo-eyebrow">
              YOUR FRESHCART PURCHASES
            </span>

            <h1>My Orders</h1>

            <p>
              Track your purchases and get updates on your orders.
            </p>
          </div>

          <div className="mo-hero-art">
            <div className="mo-hero-art-icon">
              <FiTruck />
            </div>

            <div>
              <strong>Fresh products</strong>
              <span>Delivered to your doorstep</span>
            </div>
          </div>
        </div>

        {!loading && !error && orders.length > 0 && (
          <div className="mo-stats">
            <div className="mo-stat-card">
              <span className="mo-stat-icon">
                <FiPackage />
              </span>
              <div>
                <small>Total Orders</small>
                <strong>{orders.length}</strong>
              </div>
            </div>

            <div className="mo-stat-card mo-stat-delivered">
              <span className="mo-stat-icon">
                <FiCheckCircle />
              </span>
              <div>
                <small>Delivered</small>
                <strong>{delivered}</strong>
              </div>
            </div>

            <div className="mo-stat-card mo-stat-progress">
              <span className="mo-stat-icon">
                <FiTruck />
              </span>
              <div>
                <small>In Progress</small>
                <strong>{inProgress}</strong>
              </div>
            </div>

            <div className="mo-stat-card mo-stat-spent">
              <span className="mo-stat-icon">₹</span>
              <div>
                <small>Total Spent</small>
                <strong>{money(totalSpent)}</strong>
              </div>
            </div>
          </div>
        )}

        <div className="mo-list-heading">
          <div>
            <h2>Recent Orders</h2>
            <p>
              {loading
                ? "Loading your orders..."
                : `${orders.length} orders found`}
            </p>
          </div>

          <button
            type="button"
            className="mo-refresh"
            disabled={loading}
            onClick={() => loadOrders()}
          >
            <FiRefreshCw
              className={loading ? "mo-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {loading && (
          <div className="mo-loading">
            <span className="mo-loader" />
            <p>Loading your FreshCart orders...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mo-empty">
            <span className="mo-empty-icon">
              <FiRefreshCw />
            </span>

            <h3>Orders couldn't be loaded</h3>
            <p>{error}</p>

            {!localStorage.getItem("token") ? (
              <Link to="/account" className="mo-btn mo-btn-green">
                Login to Continue <FiArrowRight />
              </Link>
            ) : (
              <button
                type="button"
                className="mo-btn mo-btn-green"
                onClick={() => loadOrders()}
              >
                <FiRefreshCw />
                Try Again
              </button>
            )}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="mo-empty">
            <span className="mo-empty-icon">
              <FiShoppingCart />
            </span>

            <h3>Your orders will appear here</h3>

            <p>
              You haven't placed any orders yet. Explore our fresh
              groceries and start shopping.
            </p>

            <Link to="/shop" className="mo-btn mo-btn-green">
              Start Shopping <FiArrowRight />
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <>
            <div className="mo-orders-list">
              {visibleOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  expanded={expandedOrder === order.id}
                  onViewDetails={(id) =>
                    setExpandedOrder((previous) =>
                      previous === id ? null : id
                    )
                  }
                  onTrackOrder={(selectedOrder) =>
                    setTrackingOrder(selectedOrder)
                  }
                />
              ))}
            </div>

            <div className="mo-pagination">
              <span>
                Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
                {Math.min(page * PAGE_SIZE, orders.length)} of{" "}
                {orders.length} orders
              </span>

              <div className="mo-page-buttons">
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((current) =>
                      Math.max(1, current - 1)
                    )
                  }
                >
                  <FiChevronLeft />
                </button>

                <span>
                  {page} / {totalPages}
                </span>

                <button
                  type="button"
                  aria-label="Next page"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(totalPages, current + 1)
                    )
                  }
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {trackingOrder && (
        <OrderTrackingModal
          order={trackingOrder}
          onClose={() => setTrackingOrder(null)}
        />
      )}
    </section>
  );
}
