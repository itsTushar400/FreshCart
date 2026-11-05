import { useState } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Deals from "./pages/Deals";
import Categories from "./pages/Categories";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Account from "./pages/Account";
import Profile from "./pages/Profile";
import MyOrders from "./pages/MyOrders";
import ComboPacks from "./pages/ComboPacks";
import NewArrivals from "./pages/NewArrivals";
import BestSellers from "./pages/BestSellers";
import Checkout from "./pages/Checkout";
import TrackOrder from "./pages/TrackOrder";
import RiderLocation from "./pages/RiderLocation";


// Admin layout and pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/Categories";
import AdminOrders from "./pages/admin/Orders";
import Customers from "./pages/admin/Customers";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminOrderTracking from "./pages/admin/AdminOrderTracking";

import { useShop } from "./context/ShopContext";
import "./App.css";

const navItems = [
  ["Home", "/"],
  ["Shop", "/shop"],
  ["Deals", "/deals"],
  ["Combo Packs", "/combo-packs"],
  ["New Arrivals", "/new-arrivals"],
  ["Best Sellers", "/best-sellers"],
];

const mobileItems = [
  { label: "Home", path: "/", icon: "⌂" },
  { label: "Shop", path: "/shop", icon: "▦" },
  { label: "Deals", path: "/deals", icon: "%" },
  { label: "Wishlist", path: "/wishlist", icon: "♡" },
  { label: "Account", path: "/account", icon: "♙" },
];

function MobileBottomNav() {
  const { wishlist = [] } = useShop();

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="Mobile navigation"
    >
      {mobileItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === "/"}
          className={({ isActive }) =>
            isActive ? "nav-active" : ""
          }
        >
          <span className="mobile-nav-icon">
            {item.path === "/wishlist" && wishlist.length > 0
              ? "♥"
              : item.icon}
          </span>

          <span className="mobile-nav-label">
            {item.label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}

function NotFound() {
  return (
    <section className="empty-state">
      <h2>Page not found</h2>
      <p>The page you are looking for does not exist.</p>
      <Link to="/">Back to Home</Link>
    </section>
  );
}

function AdminPlaceholder({ title, description }) {
  return (
    <section className="fc-admin-placeholder">
      <span>FRESHCART ADMIN</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}

// Admin routes
function AdminRoutes() {
  return (
    <Routes>
      <Route
        path="/admin/login"
        element={<Navigate to="/account" replace />}
      />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />

        <Route
          path="products"
          element={<AdminProducts />}
        />

        <Route
          path="categories"
          element={<AdminCategories />}
        />

        <Route
          path="orders"
          element={<AdminOrders />}
        />

        <Route
          path="tracking"
          element={<AdminOrderTracking />}
        />

        <Route
          path="customers"
          element={<Customers />}
        />

        <Route
          path="coupons"
          element={<AdminCoupons />}
        />

        <Route
          path="reports"
          element={<AdminReports />}
        />

        <Route
          path="settings"
          element={<AdminSettings />}
        />

        <Route
          path="*"
          element={
            <AdminPlaceholder
              title="Page not found"
              description="This admin page does not exist."
            />
          }
        />
      </Route>

      <Route
        path="*"
        element={<Navigate to="/account" replace />}
      />
    </Routes>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  // Admin pages use their own layout.
  if (location.pathname.startsWith("/admin")) {
    return <AdminRoutes />;
  }

  return (
    <div className="app-shell">
      <Header />

      <div
        className={`main-layout ${
          sidebarOpen
            ? "sidebar-expanded"
            : "sidebar-collapsed"
        }`}
      >
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() =>
            setSidebarOpen((previous) => !previous)
          }
        />

        <main className="content">
          <nav
            className="nav-row"
            aria-label="Main navigation"
          >
            <div className="nav-links">
              {navItems.map(([label, path]) => (
                <NavLink
                  key={path}
                  end={path === "/"}
                  to={path}
                  className={({ isActive }) =>
                    isActive ? "nav-active" : ""
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>

            <Link className="fresh-deals" to="/deals">
              🔥 Fresh Deals <span>›</span>
            </Link>
          </nav>

          <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/shop" element={<Shop />} />

            <Route path="/deals" element={<Deals />} />

            <Route
              path="/categories"
              element={<Categories />}
            />

            <Route path="/cart" element={<Cart />} />

            <Route
              path="/wishlist"
              element={<Wishlist />}
            />

            <Route
              path="/account"
              element={<Account />}
            />

            {/* Account dropdown pages */}
            <Route
              path="/profile"
              element={<Profile />}
            />

            <Route
              path="/my-orders"
              element={<MyOrders />}
            />

            <Route
              path="/combo-packs"
              element={<ComboPacks />}
            />

            <Route
              path="/new-arrivals"
              element={<NewArrivals />}
            />

            <Route
              path="/best-sellers"
              element={<BestSellers />}
            />

            <Route
              path="/checkout"
              element={<Checkout />}
            />



            <Route path="/track-order" element={<TrackOrder />} />
<Route path="/rider-location" element={<RiderLocation />} />

            <Route
              path="*"
              element={<NotFound />}
            />
          </Routes>

          <footer>
            © 2026 FreshCart. Fresh Products, Happy Life.
          </footer>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
