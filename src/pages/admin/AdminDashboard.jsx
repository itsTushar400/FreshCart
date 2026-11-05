
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  CircleAlert,
  Clock3,
  IndianRupee,
  Package,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import "./AdminDashboard.css";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "") + "/api";

const getArray = (data, keys = []) => {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
};

const getMoney = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const getDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatus = (value) =>
  String(value || "pending").toLowerCase().replace(/[_-]/g, " ");

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrors([]);

    const token = localStorage.getItem("token");

    const headers = {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const endpoints = [
      {
        name: "Products",
        path: "/products",
        setter: setProducts,
        keys: ["products", "data"],
      },
      {
        name: "Categories",
        path: "/categories",
        setter: setCategories,
        keys: ["categories", "data"],
      },
      {
        name: "Orders",
        path: "/orders",
        setter: setOrders,
        keys: ["orders", "data"],
      },
      {
        name: "Customers",
        path: "/customers?limit=100",
        setter: setCustomers,
        keys: ["customers", "data"],
      },
    ];

    const failed = [];

    await Promise.all(
      endpoints.map(async ({ name, path, setter, keys }) => {
        try {
          const response = await fetch(`${API_BASE}${path}`, { headers });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const result = await response.json();
          const rows = getArray(result, keys);
          setter(rows);
        } catch (error) {
          console.error(`${name} API error:`, error);
          setter([]);
          failed.push(name);
        }
      })
    );

    setErrors(failed);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = useMemo(() => {
    const validOrders = orders.filter(
      (order) => getStatus(order.status) !== "cancelled"
    );

    const revenue = validOrders.reduce((sum, order) => {
      return sum + Number(
        order.total_amount ?? order.total ?? order.grand_total ?? 0
      );
    }, 0);

    const lowStock = products.filter((product) => {
      const quantity = Number(
        product.stock_quantity ?? product.stock ?? product.quantity ?? 0
      );
      return quantity <= 5;
    });

    const pendingOrders = orders.filter((order) =>
      ["pending", "processing", "confirmed"].includes(getStatus(order.status))
    );

    return {
      revenue,
      totalOrders: orders.length,
      totalProducts: products.length,
      totalCategories: categories.length,
      totalCustomers: customers.length,
      lowStock,
      pendingOrders,
    };
  }, [products, categories, orders, customers]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => {
        return (
          new Date(b.created_at || b.order_date || 0).getTime() -
          new Date(a.created_at || a.order_date || 0).getTime()
        );
      })
      .slice(0, 6);
  }, [orders]);

  const weeklyActivity = useMemo(() => {
    const days = [];

    for (let offset = 6; offset >= 0; offset--) {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - offset);

      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = orders.filter((order) => {
        const created = new Date(order.created_at || order.order_date || "");
        return created >= day && created < nextDay;
      }).length;

      days.push({
        label: day.toLocaleDateString("en-IN", { weekday: "short" }),
        date: day,
        count,
      });
    }

    return days;
  }, [orders]);

  const maxActivity = Math.max(1, ...weeklyActivity.map((day) => day.count));

  return (
    <main className="fcDash">
      <div className="fcDash-topline">
        <div className="fcDash-breadcrumb">
          <span>Workspace</span>
          <span className="fcDash-slash">/</span>
          <strong>Dashboard</strong>
        </div>

        <button
          className="fcDash-refresh"
          onClick={loadDashboard}
          disabled={loading}
        >
          <RefreshCw size={17} className={loading ? "fcDash-spin" : ""} />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <header className="fcDash-heading">
        <div>
          <div className="fcDash-eyebrow">
            <span className="fcDash-dot" />
            FRESHCART ADMIN
          </div>
          <h1>Dashboard Overview</h1>
          <p>Welcome back! Here&apos;s what&apos;s happening with your store.</p>
        </div>

        <div className="fcDash-connection">
          <span className={`fcDash-status-dot ${errors.length ? "is-error" : ""}`} />
          <div>
            <span>DATA STATUS</span>
            <strong>
              {loading
                ? "Syncing data..."
                : errors.length
                  ? "Some data unavailable"
                  : "Latest available"}
            </strong>
            {lastUpdated && !loading && (
              <small>
                Updated {lastUpdated.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </small>
            )}
          </div>
        </div>
      </header>

      {errors.length > 0 && (
        <div className="fcDash-error" role="status">
          <CircleAlert size={18} />
          <div>
            <strong>Some dashboard data could not load.</strong>
            <p>
              Check your backend routes and login token for: {errors.join(", ")}.
            </p>
          </div>
        </div>
      )}

      <section className="fcDash-hero">
        <div className="fcDash-hero-copy">
          <span className="fcDash-hero-kicker">YOUR STORE AT A GLANCE</span>
          <h2>
            Good things
            <br />
            are growing<span className="fcDash-heading-leaf">.</span>
            <span className="fcDash-small-leaf">🌿</span>
          </h2>
          <p>
            Track your catalog, monitor stock and keep orders moving with your
            FreshCart admin workspace.
          </p>
          <Link to="/admin/products" className="fcDash-primary">
            Manage products <ArrowRight size={18} />
          </Link>
        </div>

        <div className="fcDash-hero-art" aria-hidden="true">
          <span className="fcDash-orbit fcDash-orbit-one" />
          <span className="fcDash-orbit fcDash-orbit-two" />
          <span className="fcDash-orbit fcDash-orbit-three" />
          <div className="fcDash-art-badge">
            <ShoppingCart size={23} />
          </div>
          <img
            src="/fresh-vegetables.png"
            alt=""
            className="fcDash-vegetable-image"
            onError={(event) => {
              console.error(
                "Dashboard hero image not found:",
                event.currentTarget.src
              );
              event.currentTarget.style.visibility = "hidden";
            }}
          />
        </div>
      </section>

      <section className="fcDash-section-heading">
        <div>
          <h2>Store performance</h2>
          <p>A live overview of the data returned by your store APIs.</p>
        </div>
        <span className="fcDash-live-tag">
          <span /> {loading ? "Updating" : "Connected view"}
        </span>
      </section>

      <section className="fcDash-stats">
        <article className="fcDash-stat-card">
          <div className="fcDash-stat-top">
            <span>Total revenue</span>
            <span className="fcDash-stat-icon revenue">
              <IndianRupee size={21} />
            </span>
          </div>
          <strong className="fcDash-stat-value">
            {loading ? "—" : getMoney(stats.revenue)}
          </strong>
          <div className="fcDash-stat-foot">
            <span className="fcDash-foot-icon green">
              <TrendingUp size={15} />
            </span>
            <span>From loaded non-cancelled orders</span>
          </div>
        </article>

        <article className="fcDash-stat-card">
          <div className="fcDash-stat-top">
            <span>Total orders</span>
            <span className="fcDash-stat-icon orders">
              <ShoppingBag size={21} />
            </span>
          </div>
          <strong className="fcDash-stat-value">
            {loading ? "—" : stats.totalOrders.toLocaleString("en-IN")}
          </strong>
          <div className="fcDash-stat-foot">
            <span className="fcDash-foot-icon blue">
              <Activity size={15} />
            </span>
            <span>Orders returned by API</span>
          </div>
        </article>

        <article className="fcDash-stat-card">
          <div className="fcDash-stat-top">
            <span>Total products</span>
            <span className="fcDash-stat-icon products">
              <Package size={21} />
            </span>
          </div>
          <strong className="fcDash-stat-value">
            {loading ? "—" : stats.totalProducts.toLocaleString("en-IN")}
          </strong>
          <div className="fcDash-stat-foot">
            <span className="fcDash-foot-icon green">
              <Boxes size={15} />
            </span>
            <span>{stats.totalCategories} categories</span>
          </div>
        </article>

        <article className="fcDash-stat-card">
          <div className="fcDash-stat-top">
            <span>Total customers</span>
            <span className="fcDash-stat-icon customers">
              <Users size={21} />
            </span>
          </div>
          <strong className="fcDash-stat-value">
            {loading ? "—" : stats.totalCustomers.toLocaleString("en-IN")}
          </strong>
          <div className="fcDash-stat-foot">
            <span className="fcDash-foot-icon purple">
              <CheckCircle2 size={15} />
            </span>
            <span>Loaded customer records</span>
          </div>
        </article>
      </section>

      <section className="fcDash-content-grid">
        <article className="fcDash-panel fcDash-activity-panel">
          <div className="fcDash-panel-heading">
            <div>
              <h3>Order activity</h3>
              <p>Orders created over the last seven days</p>
            </div>
            <span className="fcDash-panel-symbol">
              <Activity size={19} />
            </span>
          </div>

          <div className="fcDash-chart">
            {weeklyActivity.map((day) => (
              <div className="fcDash-chart-column" key={day.label + day.date.toISOString()}>
                <strong>{day.count}</strong>
                <div className="fcDash-chart-track">
                  <span
                    className="fcDash-chart-bar"
                    style={{
                      height: `${Math.max(8, (day.count / maxActivity) * 100)}%`,
                    }}
                  />
                </div>
                <span className="fcDash-chart-label">{day.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="fcDash-panel fcDash-stock-panel">
          <div className="fcDash-panel-heading">
            <div>
              <h3>Inventory watch</h3>
              <p>Products with five or fewer units</p>
            </div>
            <span className="fcDash-panel-symbol warning">
              <CircleAlert size={19} />
            </span>
          </div>

          <div className="fcDash-stock-summary">
            <strong>{loading ? "—" : stats.lowStock.length}</strong>
            <span>Low-stock products</span>
          </div>

          {stats.lowStock.length === 0 && !loading ? (
            <div className="fcDash-empty">
              <CheckCircle2 size={19} />
              No low-stock products found in the loaded catalog.
            </div>
          ) : (
            <div className="fcDash-stock-list">
              {stats.lowStock.slice(0, 4).map((product) => (
                <div className="fcDash-stock-row" key={product.id}>
                  <div className="fcDash-stock-product-icon">
                    <Package size={17} />
                  </div>
                  <div className="fcDash-stock-name">
                    <strong>{product.name || product.title || "Product"}</strong>
                    <span>
                      SKU: {product.sku || product.id || "—"}
                    </span>
                  </div>
                  <span className="fcDash-stock-qty">
                    {Number(
                      product.stock_quantity ??
                      product.stock ??
                      product.quantity ??
                      0
                    )}{" "}
                    left
                  </span>
                </div>
              ))}
            </div>
          )}

          <Link to="/admin/products" className="fcDash-panel-link">
            Review inventory <ArrowRight size={16} />
          </Link>
        </article>
      </section>

      <section className="fcDash-panel fcDash-recent-panel">
        <div className="fcDash-panel-heading fcDash-recent-heading">
          <div>
            <h3>Recent orders</h3>
            <p>Latest orders returned by your backend</p>
          </div>
          <Link to="/admin/orders" className="fcDash-outline-link">
            View all <ArrowRight size={16} />
          </Link>
        </div>

        <div className="fcDash-table-wrap">
          <table className="fcDash-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, index) => {
                const status = getStatus(order.status);
                const statusClass = status.replace(/\s+/g, "-");

                return (
                  <tr key={order.id ?? order.order_id ?? index}>
                    <td>
                      <strong className="fcDash-order-id">
                        #{order.order_number || order.order_id || order.id || "—"}
                      </strong>
                    </td>
                    <td>
                      <div className="fcDash-customer-cell">
                        <span className="fcDash-customer-avatar">
                          {String(
                            order.customer_name ||
                            order.name ||
                            order.user_name ||
                            "C"
                          ).charAt(0).toUpperCase()}
                        </span>
                        <span>
                          {order.customer_name ||
                            order.name ||
                            order.user_name ||
                            order.email ||
                            "Customer"}
                        </span>
                      </div>
                    </td>
                    <td>{getDate(order.created_at || order.order_date)}</td>
                    <td className="fcDash-amount">
                      {getMoney(
                        order.total_amount ?? order.total ?? order.grand_total
                      )}
                    </td>
                    <td>
                      <span className={`fcDash-order-status ${statusClass}`}>
                        <span />
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {!loading && recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="fcDash-table-empty">
                    <ShoppingBag size={24} />
                    <strong>No orders to show</strong>
                    <span>Orders will appear here when the API returns them.</span>
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={5} className="fcDash-table-empty">
                    <RefreshCw size={20} className="fcDash-spin" />
                    Loading orders...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="fcDash-table-footer">
          <span>Showing {recentOrders.length} recent orders</span>
          <Link to="/admin/orders">
            Manage orders <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <section className="fcDash-quick-links">
        <Link to="/admin/products" className="fcDash-quick-card">
          <span className="fcDash-quick-icon green">
            <Package size={21} />
          </span>
          <span>
            <strong>Manage products</strong>
            <small>Catalog and stock</small>
          </span>
          <ArrowUpRight size={18} />
        </Link>

        <Link to="/admin/categories" className="fcDash-quick-card">
          <span className="fcDash-quick-icon blue">
            <Boxes size={21} />
          </span>
          <span>
            <strong>Manage categories</strong>
            <small>Organize your catalog</small>
          </span>
          <ArrowUpRight size={18} />
        </Link>

        <Link to="/admin/orders" className="fcDash-quick-card">
          <span className="fcDash-quick-icon purple">
            <ShoppingCart size={21} />
          </span>
          <span>
            <strong>Manage orders</strong>
            <small>{stats.pendingOrders.length} pending or processing</small>
          </span>
          <ArrowUpRight size={18} />
        </Link>

        <Link to="/admin/customers" className="fcDash-quick-card">
          <span className="fcDash-quick-icon orange">
            <Users size={21} />
          </span>
          <span>
            <strong>View customers</strong>
            <small>Customer accounts</small>
          </span>
          <ArrowUpRight size={18} />
        </Link>
      </section>

      <footer className="fcDash-footer">
        <span>
          <span className="fcDash-footer-dot" />
          FreshCart Admin Workspace
        </span>
        <span>
          <Clock3 size={14} /> Store overview
        </span>
      </footer>
    </main>
  );
}

export default Dashboard;
