
import { useMemo, useState } from "react";
import {
  Download, CalendarDays, IndianRupee, ShoppingBag,
  Users, TrendingUp, TrendingDown, ArrowUpRight,
  ArrowDownRight, Package, Clock, CheckCircle2,
  Truck, XCircle, FileSpreadsheet
} from "lucide-react";
import "./AdminReports.css";

const weeklyData = [
  { day: "Mon", revenue: 4200, orders: 28 },
  { day: "Tue", revenue: 6100, orders: 35 },
  { day: "Wed", revenue: 4800, orders: 31 },
  { day: "Thu", revenue: 7900, orders: 46 },
  { day: "Fri", revenue: 6500, orders: 39 },
  { day: "Sat", revenue: 9400, orders: 58 },
  { day: "Sun", revenue: 8200, orders: 51 },
];

const monthlyData = [
  { day: "Week 1", revenue: 18500, orders: 121 },
  { day: "Week 2", revenue: 24600, orders: 158 },
  { day: "Week 3", revenue: 21300, orders: 139 },
  { day: "Week 4", revenue: 32700, orders: 204 },
];

const products = [
  { name: "Fresh Tomatoes", category: "Vegetables", sold: 348, revenue: 10440, color: "#42a66c" },
  { name: "Organic Bananas", category: "Fruits", sold: 296, revenue: 14800, color: "#e9b942" },
  { name: "Farm Fresh Milk", category: "Dairy", sold: 254, revenue: 15240, color: "#6499e8" },
  { name: "Premium Potatoes", category: "Vegetables", sold: 221, revenue: 6630, color: "#bc8b65" },
  { name: "Fresh Spinach", category: "Vegetables", sold: 186, revenue: 5580, color: "#47a88c" },
];

const statusItems = [
  { label: "Delivered", count: 486, percent: 68, icon: CheckCircle2, color: "#259b62" },
  { label: "Processing", count: 112, percent: 16, icon: Clock, color: "#e7a33b" },
  { label: "Shipped", count: 78, percent: 11, icon: Truck, color: "#5489db" },
  { label: "Cancelled", count: 36, percent: 5, icon: XCircle, color: "#df6b68" },
];

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

function RevenueChart({ data }) {
  const max = Math.max(...data.map((item) => item.revenue)) * 1.15;
  const chartWidth = 700;
  const chartHeight = 220;
  const left = 48;
  const right = 12;
  const top = 16;
  const bottom = 34;
  const plotWidth = chartWidth - left - right;
  const plotHeight = chartHeight - top - bottom;

  const points = data.map((item, index) => ({
    ...item,
    x: left + (data.length === 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth),
    y: top + plotHeight - (item.revenue / max) * plotHeight,
  }));

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${line} L ${points[points.length - 1].x} ${top + plotHeight} L ${points[0].x} ${top + plotHeight} Z`;

  return (
    <div className="fr-chart">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Revenue chart">
        <defs>
          <linearGradient id="frRevenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#27955d" stopOpacity=".22" />
            <stop offset="100%" stopColor="#27955d" stopOpacity=".01" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3].map((i) => {
          const y = top + (plotHeight / 3) * i;
          return (
            <g key={i}>
              <line x1={left} y1={y} x2={chartWidth - right} y2={y} stroke="#edf1ed" strokeDasharray="4 5" />
              <text x={left - 9} y={y + 4} textAnchor="end" fill="#95a198" fontSize="10">
                {Math.round((max * (3 - i)) / 3 / 1000)}k
              </text>
            </g>
          );
        })}

        <path d={area} fill="url(#frRevenueFill)" />
        <path d={line} fill="none" stroke="#23834f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p) => (
          <g key={p.day}>
            <circle cx={p.x} cy={p.y} r="5" fill="#fff" stroke="#23834f" strokeWidth="2.5" />
            <text x={p.x} y={chartHeight - 10} textAnchor="middle" fill="#829087" fontSize="10">
              {p.day}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function AdminReports() {
  const [period, setPeriod] = useState("7d");
  const [reportType, setReportType] = useState("Revenue");

  const chartData = period === "30d" ? monthlyData : weeklyData;

  const totalRevenue = useMemo(
    () => chartData.reduce((sum, item) => sum + item.revenue, 0),
    [chartData]
  );

  const totalOrders = useMemo(
    () => chartData.reduce((sum, item) => sum + item.orders, 0),
    [chartData]
  );

  const downloadCSV = () => {
    const rows = [
      ["Product", "Category", "Units Sold", "Revenue"],
      ...products.map((product) => [
        product.name, product.category, product.sold, product.revenue
      ]),
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "freshcart-product-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="frReports">
      <header className="frReports-header">
        <div>
          <div className="frReports-breadcrumb">Store management <span>/</span> Reports</div>
          <h1>Reports & Analytics</h1>
          <p>Understand your store performance and make smarter decisions.</p>
        </div>

        <button className="frReports-export" onClick={downloadCSV}>
          <Download size={17} /> Export CSV
        </button>
      </header>

      <section className="frReports-banner">
        <div className="frReports-banner-icon"><TrendingUp size={27} /></div>
        <div>
          <span>YOUR STORE AT A GLANCE</span>
          <h2>Good decisions start with clear insights.</h2>
          <p>Review revenue, track orders and discover your best-selling products.</p>
        </div>
        <div className="frReports-banner-mark">↗</div>
      </section>

      <section className="frReports-controls">
        <div>
          <CalendarDays size={17} />
          <span>Reporting period</span>
        </div>
        <div className="frReports-periods">
          <button className={period === "7d" ? "active" : ""} onClick={() => setPeriod("7d")}>Last 7 days</button>
          <button className={period === "30d" ? "active" : ""} onClick={() => setPeriod("30d")}>Last 30 days</button>
        </div>
      </section>

      <section className="frReports-stats">
        <article className="frReports-stat">
          <div className="frReports-stat-top">
            <span>Total revenue</span>
            <div className="frReports-stat-icon green"><IndianRupee size={20} /></div>
          </div>
          <strong>{currency(totalRevenue)}</strong>
          <div className="frReports-trend up"><TrendingUp size={14} /> Demo period summary</div>
        </article>

        <article className="frReports-stat">
          <div className="frReports-stat-top">
            <span>Total orders</span>
            <div className="frReports-stat-icon blue"><ShoppingBag size={20} /></div>
          </div>
          <strong>{totalOrders.toLocaleString("en-IN")}</strong>
          <div className="frReports-trend neutral"><Package size={14} /> Orders in selected period</div>
        </article>

        <article className="frReports-stat">
          <div className="frReports-stat-top">
            <span>Average order value</span>
            <div className="frReports-stat-icon purple"><TrendingUp size={20} /></div>
          </div>
          <strong>{currency(totalOrders ? totalRevenue / totalOrders : 0)}</strong>
          <div className="frReports-trend neutral">Revenue ÷ orders</div>
        </article>

        <article className="frReports-stat">
          <div className="frReports-stat-top">
            <span>Active customers</span>
            <div className="frReports-stat-icon orange"><Users size={20} /></div>
          </div>
          <strong>284</strong>
          <div className="frReports-trend neutral">Illustrative sample figure</div>
        </article>
      </section>

      <section className="frReports-main-grid">
        <article className="frReports-card frReports-revenue-card">
          <div className="frReports-card-heading">
            <div>
              <h2>Revenue overview</h2>
              <p>Sales revenue across the selected period</p>
            </div>
            <select value={reportType} onChange={(event) => setReportType(event.target.value)} aria-label="Chart metric">
              <option>Revenue</option>
              <option>Orders</option>
            </select>
          </div>

          <div className="frReports-chart-summary">
            <strong>{reportType === "Revenue" ? currency(totalRevenue) : totalOrders.toLocaleString("en-IN")}</strong>
            <span>{period === "7d" ? "Last 7 days" : "Last 30 days"}</span>
          </div>

          {reportType === "Revenue" ? (
            <RevenueChart data={chartData} />
          ) : (
            <div className="frReports-order-chart">
              {chartData.map((item) => {
                const maximum = Math.max(...chartData.map((entry) => entry.orders));
                return (
                  <div className="frReports-order-bar" key={item.day}>
                    <strong>{item.orders}</strong>
                    <div className="frReports-order-track">
                      <span style={{ height: `${(item.orders / maximum) * 100}%` }} />
                    </div>
                    <small>{item.day}</small>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="frReports-card">
          <div className="frReports-card-heading">
            <div>
              <h2>Order status</h2>
              <p>Order fulfilment breakdown</p>
            </div>
            <span className="frReports-small-badge">Overview</span>
          </div>

          <div className="frReports-status-total">
            <strong>{statusItems.reduce((sum, item) => sum + item.count, 0).toLocaleString("en-IN")}</strong>
            <span>Total sample orders</span>
          </div>

          <div className="frReports-status-list">
            {statusItems.map((item) => {
              const Icon = item.icon;
              return (
                <div className="frReports-status-item" key={item.label}>
                  <div className="frReports-status-label">
                    <span className="frReports-status-icon" style={{ color: item.color, background: `${item.color}15` }}>
                      <Icon size={16} />
                    </span>
                    <span>{item.label}</span>
                    <strong>{item.count}</strong>
                  </div>
                  <div className="frReports-status-track">
                    <span style={{ width: `${item.percent}%`, background: item.color }} />
                  </div>
                  <small>{item.percent}% of orders</small>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="frReports-card frReports-products-card">
        <div className="frReports-card-heading">
          <div>
            <h2>Top-selling products</h2>
            <p>Products contributing to your store's sales</p>
          </div>
          <button className="frReports-outline-btn" onClick={downloadCSV}>
            <FileSpreadsheet size={16} /> Download report
          </button>
        </div>

        <div className="frReports-table-wrap">
          <table className="frReports-table">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>CATEGORY</th>
                <th>UNITS SOLD</th>
                <th>REVENUE</th>
                <th>PERFORMANCE</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={product.name}>
                  <td>
                    <div className="frReports-product-name">
                      <span className="frReports-product-rank">{String(index + 1).padStart(2, "0")}</span>
                      <div><strong>{product.name}</strong><small>Product performance</small></div>
                    </div>
                  </td>
                  <td><span className="frReports-category">{product.category}</span></td>
                  <td><strong>{product.sold.toLocaleString("en-IN")}</strong></td>
                  <td><strong className="frReports-product-revenue">{currency(product.revenue)}</strong></td>
                  <td>
                    <div className="frReports-product-performance">
                      <div><span style={{ width: `${(product.sold / products[0].sold) * 100}%`, background: product.color }} /></div>
                      <small>{Math.round((product.sold / products[0].sold) * 100)}%</small>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="frReports-note">
          <span><Package size={15} /> Product data shown for demonstration</span>
          <span>Sample analytics · Not connected to live orders</span>
        </div>
      </section>
    </div>
  );
}
