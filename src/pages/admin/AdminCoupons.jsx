import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Tag, Plus, Search, TicketPercent, TrendingUp,
  CheckCircle2, Clock3, Copy, MoreHorizontal,
  X, CalendarDays, ShoppingBag, Trash2
} from "lucide-react";
import "./AdminCoupons.css";

const API_BASE =
  (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "") +
  "/api";

function getHeaders() {
  const token = localStorage.getItem("token");
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function requestJSON(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || `Request failed (HTTP ${response.status}).`);
  }

  return payload;
}

function normalizeCoupon(coupon) {
  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  return {
    ...coupon,
    value: Number(coupon.value),
    minOrder: Number(coupon.minOrder),
    used: Number(coupon.used),
    limit: Number(coupon.usageLimit),
    status:
      coupon.status === "Active" && coupon.expiry < todayString
        ? "Expired"
        : coupon.status,
  };
}

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [menuId, setMenuId] = useState(null);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    code: "", type: "Percentage", value: "",
    minOrder: "", limit: "", expiry: ""
  });

  const loadCoupons = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const payload = await requestJSON(`${API_BASE}/coupons`);
      if (!Array.isArray(payload.coupons)) {
        throw new Error("Coupon data was not returned by the server.");
      }
      setLoadError("");
      setCoupons(payload.coupons.map(normalizeCoupon));
    } catch (error) {
      setLoadError(error.message || "Coupons could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const filtered = useMemo(() => {
    return coupons.filter((coupon) => {
      const matchesSearch = coupon.code.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "All" || coupon.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [coupons, search, filter]);

  const activeCount = coupons.filter((c) => c.status === "Active").length;
  const totalUses = coupons.reduce((sum, c) => sum + c.used, 0);
  const totalLimit = coupons.reduce((sum, c) => sum + c.limit, 0);

  const notify = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  };

  const createCoupon = async (event) => {
    event.preventDefault();

    const code = form.code.trim().toUpperCase();
    if (coupons.some((coupon) => coupon.code === code)) {
      notify("This coupon code already exists.");
      return;
    }

    setSaving(true);
    try {
      await requestJSON(`${API_BASE}/coupons`, {
        method: "POST",
        body: JSON.stringify({
          ...form,
          code,
          value: Number(form.value),
          minOrder: Number(form.minOrder || 0),
          usageLimit: Number(form.limit),
        }),
      });
      await loadCoupons();
      setForm({
        code: "", type: "Percentage", value: "",
        minOrder: "", limit: "", expiry: ""
      });
      setShowModal(false);
      notify("Coupon created successfully.");
    } catch (error) {
      notify(error.message || "Coupon could not be created.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (coupon) => {
    if (coupon.status === "Expired") {
      notify("Expired coupons cannot be activated.");
      setMenuId(null);
      return;
    }

    const status = coupon.status === "Active" ? "Inactive" : "Active";
    try {
      await requestJSON(`${API_BASE}/coupons/${encodeURIComponent(coupon.id)}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadCoupons();
      notify("Coupon status updated.");
    } catch (error) {
      notify(error.message || "Coupon status could not be updated.");
    } finally {
      setMenuId(null);
    }
  };

  const deleteCoupon = async (id) => {
    try {
      await requestJSON(`${API_BASE}/coupons/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      await loadCoupons();
      notify("Coupon removed.");
    } catch (error) {
      notify(error.message || "Coupon could not be removed.");
    } finally {
      setMenuId(null);
    }
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      notify(`${code} copied to clipboard.`);
    } catch {
      notify(`Coupon code: ${code}`);
    }
  };

  return (
    <div className="fcCoupons">
      <header className="fcCoupons-topbar">
        <div>
          <div className="fcCoupons-breadcrumb">Store management <span>/</span> Coupons</div>
          <h1>Coupons & Discounts</h1>
          <p>Create offers, reward customers and grow your sales.</p>
        </div>
        <button className="fcCoupons-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Create coupon
        </button>
      </header>

      <section className="fcCoupons-banner">
        <div className="fcCoupons-banner-icon"><TicketPercent size={30} /></div>
        <div className="fcCoupons-banner-copy">
          <span>GROW YOUR STORE</span>
          <h2>Make every order a little more rewarding.</h2>
          <p>Manage promotional codes and give your customers another reason to shop fresh.</p>
        </div>
        <div className="fcCoupons-banner-decoration">%</div>
      </section>

      <section className="fcCoupons-stats">
        <article className="fcCoupons-stat">
          <div className="fcCoupons-stat-icon green"><Tag size={20} /></div>
          <span>Total coupons</span>
          <strong>{coupons.length}</strong>
          <small>All created offers</small>
        </article>
        <article className="fcCoupons-stat">
          <div className="fcCoupons-stat-icon mint"><CheckCircle2 size={20} /></div>
          <span>Active coupons</span>
          <strong>{activeCount}</strong>
          <small>Currently enabled</small>
        </article>
        <article className="fcCoupons-stat">
          <div className="fcCoupons-stat-icon orange"><TrendingUp size={20} /></div>
          <span>Total redemptions</span>
          <strong>{totalUses.toLocaleString("en-IN")}</strong>
          <small>Across all database coupons</small>
        </article>
        <article className="fcCoupons-stat">
          <div className="fcCoupons-stat-icon purple"><ShoppingBag size={20} /></div>
          <span>Redemption capacity</span>
          <strong>{totalLimit.toLocaleString("en-IN")}</strong>
          <small>Combined usage limits</small>
        </article>
      </section>

      <section className="fcCoupons-panel">
        <div className="fcCoupons-panel-heading">
          <div>
            <h2>All coupons</h2>
            <p>Manage your promotional offers in one place.</p>
          </div>
          <span className="fcCoupons-count">{filtered.length} offers</span>
        </div>

        <div className="fcCoupons-toolbar">
          <label className="fcCoupons-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search coupon code..."
              aria-label="Search coupon code"
            />
          </label>

          <div className="fcCoupons-filters">
            {["All", "Active", "Inactive", "Expired"].map((item) => (
              <button
                key={item}
                className={filter === item ? "selected" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="fcCoupons-table-wrap">
          <table className="fcCoupons-table">
            <thead>
              <tr>
                <th>COUPON</th>
                <th>DISCOUNT</th>
                <th>MIN. ORDER</th>
                <th>USAGE</th>
                <th>EXPIRES ON</th>
                <th>STATUS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(loading || loadError) && (
                <tr>
                  <td colSpan="7">
                    <div className="fcCoupons-empty" role={loadError ? "alert" : "status"}>
                      {loadError ? (
                        <>
                          <strong>Coupons could not be loaded</strong>
                          <span>{loadError}</span>
                          <button className="fcCoupons-secondary" onClick={() => loadCoupons(true)}>
                            Try again
                          </button>
                        </>
                      ) : (
                        <strong>Loading coupons…</strong>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              {!loading && !loadError && filtered.map((coupon) => {
                const progress = coupon.limit
                  ? Math.min((coupon.used / coupon.limit) * 100, 100)
                  : 0;

                return (
                  <tr key={coupon.id}>
                    <td>
                      <div className="fcCoupons-code-cell">
                        <span className="fcCoupons-ticket"><Tag size={17} /></span>
                        <div>
                          <strong>{coupon.code}</strong>
                          <button className="fcCoupons-copy" onClick={() => copyCode(coupon.code)}>
                            <Copy size={12} /> Copy code
                          </button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong className="fcCoupons-discount">
                        {coupon.type === "Percentage" ? `${coupon.value}% off` : `${money(coupon.value)} off`}
                      </strong>
                      <small className="fcCoupons-muted">{coupon.type}</small>
                    </td>
                    <td>{money(coupon.minOrder)}</td>
                    <td>
                      <div className="fcCoupons-usage">
                        <div><strong>{coupon.used}</strong><span> / {coupon.limit}</span></div>
                        <div className="fcCoupons-progress"><span style={{ width: `${progress}%` }} /></div>
                      </div>
                    </td>
                    <td>
                      <div className="fcCoupons-date">
                        <CalendarDays size={15} />
                        {new Date(`${coupon.expiry}T00:00:00`).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric"
                        })}
                      </div>
                    </td>
                    <td><span className={`fcCoupons-status ${coupon.status.toLowerCase()}`}>{coupon.status}</span></td>
                    <td className="fcCoupons-actions-cell">
                      <button className="fcCoupons-more" aria-label={`Actions for ${coupon.code}`} onClick={() => setMenuId(menuId === coupon.id ? null : coupon.id)}>
                        <MoreHorizontal size={19} />
                      </button>
                      {menuId === coupon.id && (
                        <div className="fcCoupons-menu">
                          <button onClick={() => toggleStatus(coupon)}>
                            <CheckCircle2 size={15} />
                            {coupon.status === "Active" ? "Deactivate" : "Activate"}
                          </button>
                          <button className="danger" onClick={() => deleteCoupon(coupon.id)}>
                            <Trash2 size={15} /> Delete coupon
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!loading && !loadError && filtered.length === 0 && (
                <tr>
                  <td colSpan="7">
                    <div className="fcCoupons-empty">
                      <Tag size={28} />
                      <strong>No coupons found</strong>
                      <span>Try another search or create a new coupon.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="fcCoupons-table-footer">
          Showing <strong>{filtered.length}</strong> of <strong>{coupons.length}</strong> coupons
          <span><Clock3 size={14} /> Saved in your database</span>
        </div>
      </section>

      {notice && <div className="fcCoupons-toast">{notice}</div>}

      {showModal && (
        <div className="fcCoupons-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowModal(false);
        }}>
          <section className="fcCoupons-modal">
            <div className="fcCoupons-modal-heading">
              <div>
                <span>NEW PROMOTION</span>
                <h2>Create coupon</h2>
                <p>Set up a discount offer for your customers.</p>
              </div>
              <button className="fcCoupons-close" onClick={() => setShowModal(false)} aria-label="Close modal"><X size={20} /></button>
            </div>

            <form onSubmit={createCoupon}>
              <label className="fcCoupons-field">
                Coupon code
                <input
                  required maxLength={24}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, "") })}
                  placeholder="e.g. FRESH30"
                />
              </label>

              <div className="fcCoupons-form-grid">
                <label className="fcCoupons-field">
                  Discount type
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option>Percentage</option>
                    <option>Fixed amount</option>
                  </select>
                </label>
                <label className="fcCoupons-field">
                  {form.type === "Percentage" ? "Discount (%)" : "Discount amount (₹)"}
                  <input required type="number" min="1" max={form.type === "Percentage" ? "100" : undefined} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder={form.type === "Percentage" ? "20" : "100"} />
                </label>
                <label className="fcCoupons-field">
                  Minimum order (₹)
                  <input type="number" min="0" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} placeholder="499" />
                </label>
                <label className="fcCoupons-field">
                  Maximum uses
                  <input required type="number" min="1" value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} placeholder="200" />
                </label>
              </div>

              <label className="fcCoupons-field">
                Expiry date
                <input required type="date" min={new Date().toLocaleDateString("en-CA")} value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} />
              </label>

              <div className="fcCoupons-modal-actions">
                <button type="button" className="fcCoupons-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="fcCoupons-primary" disabled={saving}>
                  <Plus size={17} /> {saving ? "Saving..." : "Create coupon"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
