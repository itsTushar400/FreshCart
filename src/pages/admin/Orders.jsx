
import { useCallback, useEffect, useMemo, useState } from "react";
import "./Orders.css";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "") + "/api";

const STATUS_OPTIONS = [
  "All",
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const API_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const normalizeStatus = (status = "") => {
  const value = String(status).toLowerCase().trim();

  if (["completed", "complete", "delivered"].includes(value)) return "Delivered";
  if (["pending", "placed", "new"].includes(value)) return "Pending";
  if (["processing", "confirmed", "packed"].includes(value)) return "Processing";
  if (["shipped", "out_for_delivery", "out for delivery"].includes(value))
    return "Shipped";
  if (["cancelled", "canceled"].includes(value)) return "Cancelled";

  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "Pending";
};

const getOrderId = (order) =>
  order.id ?? order.order_id ?? order.orderId ?? "—";

const getCustomer = (order) =>
  order.customer_name ??
  order.customerName ??
  order.user_name ??
  order.name ??
  order.customer?.name ??
  order.user?.name ??
  "Customer";

const getEmail = (order) =>
  order.customer_email ??
  order.email ??
  order.customer?.email ??
  order.user?.email ??
  "";

const getAmount = (order) =>
  Number(
    order.total_amount ??
      order.totalAmount ??
      order.total ??
      order.grand_total ??
      order.amount ??
      0
  ) || 0;

const getDate = (order) =>
  order.created_at ?? order.createdAt ?? order.order_date ?? order.date ?? null;

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name) =>
  String(name || "C")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

function extractOrders(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.orders)) return payload.orders;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.orders)) return payload.data.orders;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [newStatus, setNewStatus] = useState("pending");
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Admin login token nahi mila. Dobara login karo.");
      }

      const response = await fetch(`${API_BASE}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.message ||
            payload.error ||
            `Orders load nahi hue (HTTP ${response.status}).`
        );
      }

      setOrders(extractOrders(payload));
    } catch (err) {
      setOrders([]);
      setError(
        err.message ||
          "Orders load nahi ho paaye. Backend connection check karo."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, refreshKey]);

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setNewStatus(String(order.status || "pending").toLowerCase());
    setStatusMessage("");
    setStatusError("");
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder) return;
    const orderId = getOrderId(selectedOrder);
    if (orderId === "—") {
      setStatusError("Order ID is missing. Cannot update this order.");
      return;
    }

    setSavingStatus(true);
    setStatusMessage("");
    setStatusError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Admin login token nahi mila. Dobara login karo.");

      const response = await fetch(
        `${API_BASE}/orders/${encodeURIComponent(orderId)}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || payload.error || `Status update nahi hua (HTTP ${response.status}).`);
      }

      const savedStatus = payload.status || newStatus;
      setSelectedOrder((current) => current ? { ...current, status: savedStatus } : current);
      setOrders((current) => current.map((order) =>
        String(getOrderId(order)) === String(orderId) ? { ...order, status: savedStatus } : order
      ));
      setStatusMessage("Order status updated successfully.");
    } catch (err) {
      setStatusError(err.message || "Order status update nahi ho paya.");
    } finally {
      setSavingStatus(false);
    }
  };

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(
      (order) => normalizeStatus(order.status) === "Pending"
    ).length;
    const processing = orders.filter((order) =>
      ["Processing", "Shipped"].includes(normalizeStatus(order.status))
    ).length;
    const delivered = orders.filter(
      (order) => normalizeStatus(order.status) === "Delivered"
    ).length;
    const revenue = orders
      .filter(
        (order) => normalizeStatus(order.status) === "Delivered"
      )
      .reduce((sum, order) => sum + getAmount(order), 0);

    return { total, pending, processing, delivered, revenue };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    return orders.filter((order) => {
      const id = String(getOrderId(order)).toLowerCase();
      const customer = getCustomer(order).toLowerCase();
      const email = getEmail(order).toLowerCase();
      const status = normalizeStatus(order.status);

      const matchesSearch =
        !term ||
        id.includes(term) ||
        customer.includes(term) ||
        email.includes(term);

      const matchesStatus =
        statusFilter === "All" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  return (
    <main className="orders-page">
      <div className="orders-breadcrumb">
        <span>Workspace</span>
        <span className="orders-breadcrumb-separator">/</span>
        <span>Orders</span>
      </div>

      <section className="orders-page-heading">
        <div>
          <div className="orders-eyebrow">
            <span className="orders-eyebrow-dot" />
            FRESHCART ADMIN
          </div>
          <h1>Order Management</h1>
          <p>
            Track orders, monitor fulfillment and keep every delivery on
            schedule.
          </p>
        </div>

        <button
          type="button"
          className="orders-refresh-button"
          onClick={() => setRefreshKey((key) => key + 1)}
          disabled={loading}
        >
          <span className={loading ? "orders-spin" : ""}>↻</span>
          Refresh
        </button>
      </section>

      {error && (
        <div className="orders-error" role="alert">
          <span className="orders-error-icon">!</span>
          <div>
            <strong>Could not load orders</strong>
            <p>{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
          >
            Retry
          </button>
        </div>
      )}

      <section className="orders-stats-grid">
        <article className="orders-stat-card">
          <div className="orders-stat-top">
            <span className="orders-stat-label">Total Orders</span>
            <span className="orders-stat-icon orders-icon-green">▤</span>
          </div>
          <strong className="orders-stat-number">
            {loading ? "—" : stats.total.toLocaleString("en-IN")}
          </strong>
          <span className="orders-stat-note">All loaded orders</span>
        </article>

        <article className="orders-stat-card">
          <div className="orders-stat-top">
            <span className="orders-stat-label">Pending</span>
            <span className="orders-stat-icon orders-icon-amber">◷</span>
          </div>
          <strong className="orders-stat-number">
            {loading ? "—" : stats.pending.toLocaleString("en-IN")}
          </strong>
          <span className="orders-stat-note">Awaiting processing</span>
        </article>

        <article className="orders-stat-card">
          <div className="orders-stat-top">
            <span className="orders-stat-label">In Progress</span>
            <span className="orders-stat-icon orders-icon-blue">⇢</span>
          </div>
          <strong className="orders-stat-number">
            {loading ? "—" : stats.processing.toLocaleString("en-IN")}
          </strong>
          <span className="orders-stat-note">Processing and shipped</span>
        </article>

        <article className="orders-stat-card">
          <div className="orders-stat-top">
            <span className="orders-stat-label">Delivered</span>
            <span className="orders-stat-icon orders-icon-purple">✓</span>
          </div>
          <strong className="orders-stat-number">
            {loading ? "—" : stats.delivered.toLocaleString("en-IN")}
          </strong>
          <span className="orders-stat-note">Successfully completed</span>
        </article>
      </section>

      <section className="orders-revenue-strip">
        <div className="orders-revenue-symbol">₹</div>
        <div>
          <span>Delivered Order Revenue</span>
          <strong>
            {loading ? "Loading..." : formatCurrency(stats.revenue)}
          </strong>
        </div>
        <span className="orders-revenue-caption">
          Based on currently loaded delivered orders
        </span>
      </section>

      <section className="orders-table-card">
        <div className="orders-table-heading">
          <div>
            <h2>All Orders</h2>
            <p>Review customer purchases and order status.</p>
          </div>
          <span className="orders-count-pill">
            {loading ? "Loading..." : `${filteredOrders.length} orders`}
          </span>
        </div>

        <div className="orders-toolbar">
          <label className="orders-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order ID, customer or email..."
              aria-label="Search orders"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </label>

          <label className="orders-status-filter">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status === "All" ? "All statuses" : status}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="orders-table-scroll">
          <table className="orders-table">
            <thead>
              <tr>
                <th>ORDER</th>
                <th>CUSTOMER</th>
                <th>ORDER DATE</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
                <th className="orders-action-heading">ACTION</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td colSpan={6}>
                      <div className="orders-skeleton-row" />
                    </td>
                  </tr>
                ))
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order, index) => {
                  const status = normalizeStatus(order.status);
                  const id = getOrderId(order);
                  const customer = getCustomer(order);
                  const email = getEmail(order);

                  return (
                    <tr key={`${id}-${index}`}>
                      <td>
                        <span className="orders-id">#{id}</span>
                        <span className="orders-id-caption">
                          Order reference
                        </span>
                      </td>

                      <td>
                        <div className="orders-customer-cell">
                          <span className="orders-avatar">
                            {getInitials(customer)}
                          </span>
                          <span className="orders-customer-info">
                            <strong>{customer}</strong>
                            <small>{email || "Email unavailable"}</small>
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="orders-date">
                          {formatDate(getDate(order))}
                        </span>
                      </td>

                      <td>
                        <strong className="orders-amount">
                          {formatCurrency(getAmount(order))}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`orders-status orders-status-${status
                            .toLowerCase()
                            .replace(/[^a-z]+/g, "-")}`}
                        >
                          <span className="orders-status-dot" />
                          {status}
                        </span>
                      </td>

                      <td className="orders-action-cell">
                        <button
                          type="button"
                          className="orders-view-button"
                          onClick={() => openOrderDetails(order)}
                        >
                          View details <span>↗</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="orders-empty-state">
                      <span className="orders-empty-icon">▤</span>
                      <h3>{error ? "Orders unavailable" : "No orders found"}</h3>
                      <p>
                        {error
                          ? "Check the API connection and try again."
                          : search || statusFilter !== "All"
                            ? "Try another search term or change the status filter."
                            : "Orders will appear here when available in your database."}
                      </p>
                      {(search || statusFilter !== "All") && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearch("");
                            setStatusFilter("All");
                          }}
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="orders-table-footer">
          <span>
            Showing {loading ? "…" : filteredOrders.length} of{" "}
            {loading ? "…" : orders.length} loaded orders
          </span>
          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={loading}
          >
            ↻ Refresh data
          </button>
        </div>
      </section>

      {selectedOrder && (
        <div
          className="orders-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedOrder(null);
          }}
        >
          <section
            className="orders-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="orders-modal-title"
          >
            <div className="orders-modal-heading">
              <div>
                <span className="orders-modal-eyebrow">ORDER DETAILS</span>
                <h2 id="orders-modal-title">
                  Order #{getOrderId(selectedOrder)}
                </h2>
              </div>
              <button
                type="button"
                className="orders-modal-close"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close order details"
              >
                ×
              </button>
            </div>

            <div className="orders-modal-status">
              <span
                className={`orders-status orders-status-${normalizeStatus(
                  selectedOrder.status
                )
                  .toLowerCase()
                  .replace(/[^a-z]+/g, "-")}`}
              >
                <span className="orders-status-dot" />
                {normalizeStatus(selectedOrder.status)}
              </span>
              <span>{formatDate(getDate(selectedOrder))}</span>
            </div>

            <div className="orders-modal-section">
              <h3>Customer information</h3>
              <div className="orders-modal-customer">
                <span className="orders-avatar orders-avatar-large">
                  {getInitials(getCustomer(selectedOrder))}
                </span>
                <div>
                  <strong>{getCustomer(selectedOrder)}</strong>
                  <span>{getEmail(selectedOrder) || "Email unavailable"}</span>
                  <span>
                    {selectedOrder.phone ??
                      selectedOrder.customer_phone ??
                      selectedOrder.customer?.phone ??
                      "Phone unavailable"}
                  </span>
                </div>
              </div>
            </div>

            <div className="orders-modal-section">
              <h3>Delivery address</h3>
              <p className="orders-address">
                {selectedOrder.shipping_address ??
                  selectedOrder.delivery_address ??
                  selectedOrder.address ??
                  selectedOrder.customer?.address ??
                  "Delivery address is not included in this API response."}
              </p>
            </div>

            <div className="orders-modal-total">
              <span>Order total</span>
              <strong>{formatCurrency(getAmount(selectedOrder))}</strong>
            </div>

            <div className="orders-status-editor">
              <label htmlFor="orders-status-select">Update order status</label>
              <div className="orders-status-editor-row">
                <select
                  id="orders-status-select"
                  value={newStatus}
                  onChange={(event) => {
                    setNewStatus(event.target.value);
                    setStatusMessage("");
                    setStatusError("");
                  }}
                  disabled={savingStatus}
                >
                  {API_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="orders-status-save"
                  onClick={updateOrderStatus}
                  disabled={savingStatus || newStatus === String(selectedOrder.status || "pending").toLowerCase()}
                >
                  {savingStatus ? "Saving..." : "Save status"}
                </button>
              </div>
              {statusMessage && <p className="orders-status-success" role="status">{statusMessage}</p>}
              {statusError && <p className="orders-status-error" role="alert">{statusError}</p>}
            </div>

            <button
              type="button"
              className="orders-modal-done"
              onClick={() => setSelectedOrder(null)}
            >
              Close details
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
