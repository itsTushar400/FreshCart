
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Search, RefreshCw, Users, ShoppingBag, IndianRupee,
  Grid2X2, Plus, SlidersHorizontal, MoreHorizontal,
  X, UserRound, Eye, Trash2, ChevronLeft, ChevronRight,
  Mail, Phone, CalendarDays, ShieldCheck, ArrowUpRight,
  AlertCircle, LoaderCircle
} from "lucide-react";
import "./Customers.css";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "") + "/api";

const PAGE_SIZE = 10;

function getToken() {
  return localStorage.getItem("token") || "";
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed (${response.status})`);
  }

  return data;
}

function getInitials(name = "Customer") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function normalizeCustomer(customer) {
  return {
    ...customer,
    id: customer.id ?? customer.user_id,
    name:
      customer.name ||
      customer.full_name ||
      customer.username ||
      "Customer",
    email: customer.email || "",
    phone: customer.phone || customer.mobile || "",
    created_at: customer.created_at || customer.createdAt || null,
    totalOrders: Number(
      customer.totalOrders ?? customer.total_orders ?? customer.orders_count ?? 0
    ),
    totalSpent: Number(
      customer.totalSpent ?? customer.total_spent ?? customer.total_amount ?? 0
    ),
    status: customer.status || "Active",
  };
}

function CustomerModal({ customer, onClose, onView, onOrders, onDelete }) {
  useEffect(() => {
    if (!customer) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [customer, onClose]);

  if (!customer) return null;

  return createPortal(
    <div
      className="fc-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="fc-action-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fc-modal-title"
      >
        <div className="fc-modal-heading">
          <div className="fc-modal-avatar">
            {getInitials(customer.name)}
          </div>
          <button
            className="fc-modal-close"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            <X size={19} />
          </button>
        </div>

        <span className="fc-modal-eyebrow">CUSTOMER MANAGEMENT</span>
        <h2 id="fc-modal-title">{customer.name}</h2>
        <p className="fc-modal-email">{customer.email || "No email available"}</p>

        <div className="fc-modal-summary">
          <div>
            <span>Orders</span>
            <strong>{customer.totalOrders}</strong>
          </div>
          <div>
            <span>Total spent</span>
            <strong>{money(customer.totalSpent)}</strong>
          </div>
        </div>

        <div className="fc-modal-divider" />

        <button
          className="fc-modal-action"
          type="button"
          onClick={() => onView(customer)}
        >
          <span className="fc-modal-action-icon">
            <Eye size={19} />
          </span>
          <span className="fc-modal-action-copy">
            <strong>View customer</strong>
            <small>See customer profile and contact details</small>
          </span>
          <ArrowUpRight size={17} className="fc-modal-arrow" />
        </button>

        <button
          className="fc-modal-action"
          type="button"
          onClick={() => onOrders(customer)}
        >
          <span className="fc-modal-action-icon blue">
            <ShoppingBag size={19} />
          </span>
          <span className="fc-modal-action-copy">
            <strong>View orders</strong>
            <small>Review this customer's purchase history</small>
          </span>
          <ArrowUpRight size={17} className="fc-modal-arrow" />
        </button>

        <button
          className="fc-modal-action danger"
          type="button"
          onClick={() => onDelete(customer)}
        >
          <span className="fc-modal-action-icon red">
            <Trash2 size={19} />
          </span>
          <span className="fc-modal-action-copy">
            <strong>Delete customer</strong>
            <small>Remove this customer record</small>
          </span>
          <ArrowUpRight size={17} className="fc-modal-arrow" />
        </button>

        <button className="fc-modal-cancel" type="button" onClick={onClose}>
          Close
        </button>
      </section>
    </div>,
    document.body
  );
}

function CustomerDetailsModal({ customer, orders, onClose, loading }) {
  useEffect(() => {
    if (!customer) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [customer, onClose]);

  if (!customer) return null;

  return createPortal(
    <div
      className="fc-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="fc-details-modal" role="dialog" aria-modal="true">
        <div className="fc-details-top">
          <div>
            <span className="fc-modal-eyebrow">CUSTOMER PROFILE</span>
            <h2>{customer.name}</h2>
          </div>
          <button className="fc-modal-close" onClick={onClose} type="button">
            <X size={19} />
          </button>
        </div>

        <div className="fc-profile-large">
          <div className="fc-profile-avatar">{getInitials(customer.name)}</div>
          <div>
            <strong>{customer.name}</strong>
            <span>Customer ID: {customer.id ?? "—"}</span>
          </div>
          <span className="fc-status active">
            <i /> {customer.status}
          </span>
        </div>

        <div className="fc-detail-line">
          <Mail size={18} />
          <div><small>Email address</small><strong>{customer.email || "Not provided"}</strong></div>
        </div>
        <div className="fc-detail-line">
          <Phone size={18} />
          <div><small>Phone number</small><strong>{customer.phone || "Not provided"}</strong></div>
        </div>
        <div className="fc-detail-line">
          <CalendarDays size={18} />
          <div><small>Registered on</small><strong>{formatDate(customer.created_at)}</strong></div>
        </div>

        <div className="fc-detail-stats">
          <div><span>Total orders</span><strong>{customer.totalOrders}</strong></div>
          <div><span>Total spent</span><strong>{money(customer.totalSpent)}</strong></div>
        </div>

        {orders && (
          <div className="fc-customer-orders">
            <h3>Order history</h3>
            {loading ? (
              <p className="fc-inline-loading"><LoaderCircle size={17} /> Loading orders…</p>
            ) : orders.length === 0 ? (
              <p className="fc-empty-small">No orders found for this customer.</p>
            ) : (
              orders.map((order) => (
                <div className="fc-order-item" key={order.id}>
                  <div>
                    <strong>Order #{order.id}</strong>
                    <small>{formatDate(order.created_at)}</small>
                  </div>
                  <div className="fc-order-right">
                    <strong>{money(order.total_amount ?? order.total ?? 0)}</strong>
                    <span>{order.status || "Pending"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <button className="fc-modal-cancel" onClick={onClose} type="button">
          Done
        </button>
      </section>
    </div>,
    document.body
  );
}

function DeleteConfirmation({ customer, onCancel, onConfirm, loading }) {
  if (!customer) return null;

  return createPortal(
    <div className="fc-modal-overlay">
      <section className="fc-confirm-modal" role="alertdialog" aria-modal="true">
        <div className="fc-confirm-icon"><Trash2 size={25} /></div>
        <h2>Delete customer?</h2>
        <p>
          You are about to delete <strong>{customer.name}</strong>. This action
          may be permanent.
        </p>
        <div className="fc-confirm-buttons">
          <button className="fc-modal-cancel" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="fc-delete-confirm" onClick={onConfirm} disabled={loading}>
            {loading ? "Deleting…" : "Delete customer"}
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderFilter, setOrderFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [detailCustomer, setDetailCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [deleteCustomer, setDeleteCustomer] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const loadCustomers = useCallback(async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const params = new URLSearchParams({
        search: search.trim(),
        page: String(page),
        limit: String(PAGE_SIZE),
      });

      const data = await apiRequest(`/customers?${params.toString()}`);
      const list = Array.isArray(data)
        ? data
        : data.customers || data.data?.customers || data.data || [];

      const normalized = list.map(normalizeCustomer);

      setCustomers(normalized);

      const p = data.pagination || data.data?.pagination || {};
      setPagination({
        page: Number(p.page || page),
        limit: Number(p.limit || PAGE_SIZE),
        total: Number(p.total ?? normalized.length),
        totalPages: Math.max(1, Number(p.totalPages || p.total_pages || 1)),
      });

      setSelectedIds([]);
    } catch (err) {
      setError(err.message || "Unable to load customers.");
      setCustomers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, page]);

  useEffect(() => {
    const timer = setTimeout(() => loadCustomers(), 250);
    return () => clearTimeout(timer);
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    let list = [...customers];

    if (statusFilter === "active") {
      list = list.filter((c) => c.status.toLowerCase() === "active");
    } else if (statusFilter === "new") {
      list = list.filter((c) => {
        const date = new Date(c.created_at);
        const days = (Date.now() - date.getTime()) / 86400000;
        return Number.isFinite(days) && days >= 0 && days <= 7;
      });
    }

    if (orderFilter === "with-orders") {
      list = list.filter((c) => c.totalOrders > 0);
    } else if (orderFilter === "without-orders") {
      list = list.filter((c) => c.totalOrders === 0);
    }

    list.sort((a, b) => {
      if (sortOrder === "name") return a.name.localeCompare(b.name);
      if (sortOrder === "oldest") {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    return list;
  }, [customers, statusFilter, orderFilter, sortOrder]);

  const pageTotal = pagination.total;
  const currentPage = pagination.page;
  const pageCount = pagination.totalPages;
  const pageStart = pageTotal === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, pageTotal);

  const ordersOnPage = customers.reduce((sum, c) => sum + c.totalOrders, 0);
  const spendingOnPage = customers.reduce((sum, c) => sum + c.totalSpent, 0);

  const closeActionModal = useCallback(() => setActiveCustomer(null), []);
  const closeDetailsModal = useCallback(() => {
    setDetailCustomer(null);
    setCustomerOrders(null);
  }, []);

  function handleSearch(value) {
    setSearch(value);
    setPage(1);
  }

  function toggleSelected(id) {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  }

  function toggleAll() {
    const visibleIds = filteredCustomers.map((c) => c.id).filter((id) => id != null);
    const allSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

    setSelectedIds((previous) =>
      allSelected
        ? previous.filter((id) => !visibleIds.includes(id))
        : [...new Set([...previous, ...visibleIds])]
    );
  }

  async function openCustomerDetails(customer) {
    setActiveCustomer(null);
    setCustomerOrders(null);
    setDetailCustomer(customer);

    try {
      const data = await apiRequest(`/customers/${customer.id}`);
      const profile = data.customer || data.data?.customer;
      if (profile) {
        setDetailCustomer(normalizeCustomer({
          ...customer,
          ...profile,
          totalOrders: profile.totalOrders ?? customer.totalOrders,
          totalSpent: profile.totalSpent ?? customer.totalSpent,
        }));
      }
    } catch (err) {
      setNotice(`Showing available customer information. ${err.message}`);
    }
  }

  async function openCustomerOrders(customer) {
    setActiveCustomer(null);
    setDetailCustomer(customer);
    setCustomerOrders([]);
    setOrdersLoading(true);

    try {
      const data = await apiRequest(`/customers/${customer.id}`);
      const list = data.orders || data.data?.orders || [];
      setCustomerOrders(Array.isArray(list) ? list : []);
    } catch (err) {
      setCustomerOrders([]);
      setNotice(`Unable to load this customer's orders: ${err.message}`);
    } finally {
      setOrdersLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteCustomer) return;

    setDeleteLoading(true);
    setError("");

    try {
      // Requires a DELETE /api/customers/:id endpoint on your backend.
      await apiRequest(`/customers/${deleteCustomer.id}`, {
        method: "DELETE",
      });

      setDeleteCustomer(null);
      setActiveCustomer(null);
      setNotice("Customer deleted successfully.");
      await loadCustomers({ quiet: true });
    } catch (err) {
      setError(
        `Delete failed: ${err.message}. Check that your backend supports DELETE /api/customers/:id.`
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  function handleAddCustomer() {
    setNotice(
      "Customer creation form requires a matching POST /api/customers backend endpoint."
    );
  }

  return (
    <main className="fc-customers-page">
      <div className="fc-breadcrumb-row">
        <div className="fc-breadcrumbs">
          <span>FreshCart</span><i>/</i>
          <span>Management</span><i>/</i>
          <strong>Customers</strong>
        </div>

        <button
          className="fc-refresh-button"
          onClick={() => loadCustomers({ quiet: true })}
          disabled={refreshing}
          type="button"
        >
          <RefreshCw size={17} className={refreshing ? "fc-spin" : ""} />
          Refresh
        </button>
      </div>

      <section className="fc-customers-hero">
        <div className="fc-hero-decoration fc-hero-decoration-one" />
        <div className="fc-hero-decoration fc-hero-decoration-two" />

        <div className="fc-hero-copy">
          <div className="fc-hero-eyebrow">
            <span className="fc-green-dot" />
            CUSTOMER MANAGEMENT
          </div>

          <h1>Customers</h1>

          <p>
            Manage your customer relationships, review purchase activity,
            and understand your customer base in one place.
          </p>

          <div className="fc-hero-benefits">
            <div>
              <span><Users size={19} /></span>
              <strong>Customer records</strong>
            </div>
            <div>
              <span><ShoppingBag size={19} /></span>
              <strong>Purchase activity</strong>
            </div>
            <div>
              <span><ShieldCheck size={19} /></span>
              <strong>Customer insights</strong>
            </div>
          </div>
        </div>

        <div className="fc-hero-art">
          <img
            src="/images/customers-hero.png"
            alt="Customers illustration"
            onError={(event) => {
              event.currentTarget.style.display = "none";
              event.currentTarget.parentElement.classList.add("fc-hero-art-missing");
              console.error(
                "Hero image not found. Put the PNG in public/images/customers-hero.png"
              );
            }}
          />
          <div className="fc-hero-fallback" aria-hidden="true">
            <Users size={88} strokeWidth={1.3} />
            <span>Happy customers</span>
          </div>
        </div>
      </section>

      <section className="fc-customer-stats">
        <article className="fc-stat-card">
          <div className="fc-stat-top">
            <span>Total customers</span>
            <div className="fc-stat-icon green"><Users size={21} /></div>
          </div>
          <strong className="fc-stat-value">{loading ? "—" : pageTotal.toLocaleString("en-IN")}</strong>
          <div className="fc-stat-foot"><span className="fc-foot-dot green-dot" /> Registered customer accounts</div>
        </article>

        <article className="fc-stat-card">
          <div className="fc-stat-top">
            <span>Orders represented</span>
            <div className="fc-stat-icon blue"><ShoppingBag size={21} /></div>
          </div>
          <strong className="fc-stat-value">{loading ? "—" : ordersOnPage.toLocaleString("en-IN")}</strong>
          <div className="fc-stat-foot"><span className="fc-foot-dot blue-dot" /> Across customers on this page</div>
        </article>

        <article className="fc-stat-card">
          <div className="fc-stat-top">
            <span>Customer spending</span>
            <div className="fc-stat-icon purple"><IndianRupee size={21} /></div>
          </div>
          <strong className="fc-stat-value">{loading ? "—" : money(spendingOnPage)}</strong>
          <div className="fc-stat-foot"><span className="fc-foot-dot purple-dot" /> Spending represented on this page</div>
        </article>

        <article className="fc-stat-card">
          <div className="fc-stat-top">
            <span>Showing now</span>
            <div className="fc-stat-icon orange"><Grid2X2 size={21} /></div>
          </div>
          <strong className="fc-stat-value">
            {loading ? "—" : `${filteredCustomers.length} / ${pageTotal}`}
          </strong>
          <div className="fc-stat-foot">Customer records on this page</div>
        </article>
      </section>

      {notice && (
        <div className="fc-notice">
          <AlertCircle size={17} />
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss notice"><X size={16} /></button>
        </div>
      )}

      {error && (
        <div className="fc-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Dismiss error"><X size={16} /></button>
        </div>
      )}

      <section className="fc-customer-table-card">
        <div className="fc-table-heading">
          <div>
            <div className="fc-table-title-row">
              <h2>All customers</h2>
              <span className="fc-count-pill">{pageTotal}</span>
            </div>
            <p>Search and review your registered customers.</p>
          </div>

          <button className="fc-add-button" onClick={handleAddCustomer} type="button">
            <Plus size={19} />
            Add Customer
          </button>
        </div>

        <div className="fc-customer-toolbar">
          <label className="fc-search-box">
            <Search size={19} />
            <input
              value={search}
              onChange={(event) => handleSearch(event.target.value)}
              placeholder="Search by name or email..."
              aria-label="Search customers"
            />
            {search && (
              <button type="button" onClick={() => handleSearch("")} aria-label="Clear search">
                <X size={16} />
              </button>
            )}
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter customer status"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="new">New (7 days)</option>
          </select>

          <select
            value={orderFilter}
            onChange={(event) => setOrderFilter(event.target.value)}
            aria-label="Filter by orders"
          >
            <option value="all">All Orders</option>
            <option value="with-orders">Has Orders</option>
            <option value="without-orders">No Orders</option>
          </select>

          <select
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            aria-label="Sort customers"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A–Z</option>
          </select>

          <button
            className="fc-filter-reset"
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setOrderFilter("all");
              setSortOrder("newest");
            }}
          >
            <SlidersHorizontal size={17} /> Reset filters
          </button>
        </div>

        <div className="fc-table-scroll">
          <table className="fc-customer-table">
            <thead>
              <tr>
                <th className="fc-check-cell">
                  <input
                    type="checkbox"
                    checked={
                      filteredCustomers.length > 0 &&
                      filteredCustomers.every((c) => selectedIds.includes(c.id))
                    }
                    onChange={toggleAll}
                    aria-label="Select all visible customers"
                  />
                </th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Orders</th>
                <th>Total spent</th>
                <th>Status</th>
                <th>Joined on</th>
                <th className="fc-actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="fc-table-message">
                    <LoaderCircle size={22} className="fc-spin" />
                    <span>Loading customer records…</span>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="fc-table-message">
                    <div className="fc-empty-icon"><Users size={26} /></div>
                    <strong>No customers found</strong>
                    <span>Try a different search or reset your filters.</span>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => (
                  <tr key={customer.id ?? `${customer.email}-${index}`}>
                    <td className="fc-check-cell">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(customer.id)}
                        onChange={() => toggleSelected(customer.id)}
                        aria-label={`Select ${customer.name}`}
                      />
                    </td>
                    <td>
                      <div className="fc-customer-name-cell">
                        <div className={`fc-customer-avatar avatar-${index % 5}`}>
                          {getInitials(customer.name)}
                        </div>
                        <strong>{customer.name}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="fc-contact-cell">
                        <div><Mail size={15} /><span>{customer.email || "—"}</span></div>
                        <div><Phone size={15} /><span>{customer.phone || "—"}</span></div>
                      </div>
                    </td>
                    <td className="fc-number-cell">{customer.totalOrders}</td>
                    <td className="fc-spent-cell">{money(customer.totalSpent)}</td>
                    <td>
                      <span className={`fc-status ${customer.status.toLowerCase() === "active" ? "active" : "new"}`}>
                        <i /> {customer.status}
                      </span>
                    </td>
                    <td className="fc-date-cell">{formatDate(customer.created_at)}</td>
                    <td className="fc-actions-cell">
                      <button
                        className="fc-more-button"
                        type="button"
                        aria-label={`Actions for ${customer.name}`}
                        title="Customer actions"
                        onClick={() => setActiveCustomer(customer)}
                      >
                        <MoreHorizontal size={21} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="fc-table-footer">
          <span>
            Showing {loading ? "…" : `${pageStart}–${pageEnd}`} of {pageTotal} customers
            {selectedIds.length > 0 && ` · ${selectedIds.length} selected`}
          </span>

          <div className="fc-pagination">
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="fc-page-number">{currentPage}</span>
            <span className="fc-page-total">of {pageCount}</span>

            <button
              type="button"
              disabled={currentPage >= pageCount || loading}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      <CustomerModal
        customer={activeCustomer}
        onClose={closeActionModal}
        onView={openCustomerDetails}
        onOrders={openCustomerOrders}
        onDelete={(customer) => {
          setActiveCustomer(null);
          setDeleteCustomer(customer);
        }}
      />

      <CustomerDetailsModal
        customer={detailCustomer}
        orders={customerOrders}
        loading={ordersLoading}
        onClose={closeDetailsModal}
      />

      <DeleteConfirmation
        customer={deleteCustomer}
        loading={deleteLoading}
        onCancel={() => setDeleteCustomer(null)}
        onConfirm={confirmDelete}
      />
    </main>
  );
}
