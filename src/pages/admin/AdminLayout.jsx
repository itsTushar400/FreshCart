import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  Users,
  TicketPercent,
  BarChart3,
  Settings,
  MapPinned,
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  LogOut,
  UserRound,
  CheckCheck,
  ShoppingBag,
  AlertTriangle,
  CircleCheck,
  Clock3,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import "./AdminLayout.css";

const INITIAL_NOTIFICATIONS = [
  {
    id: "welcome",
    title: "Welcome to FreshCart Admin",
    message: "Your admin notification panel is ready.",
    type: "success",
    time: "Just now",
    read: false,
    path: "/admin",
  },
];

const NOTIFICATION_KEY = "freshcart-admin-notifications";

const navGroups = [
  {
    title: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        path: "/admin",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    title: "STORE MANAGEMENT",
    items: [
      { label: "Products", path: "/admin/products", icon: Package },
      { label: "Categories", path: "/admin/categories", icon: Tags },
      { label: "Orders", path: "/admin/orders", icon: ShoppingCart },
      { label: "Live Order Tracking", path: "/admin/tracking", icon: MapPinned },
      { label: "Customers", path: "/admin/customers", icon: Users },
      { label: "Coupons", path: "/admin/coupons", icon: TicketPercent },
    ],
  },
  {
    title: "ANALYTICS",
    items: [
      { label: "Reports", path: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    title: "PREFERENCES",
    items: [
      { label: "Settings", path: "/admin/settings", icon: Settings },
    ],
  },
];

const pageInfo = {
  "/admin": {
    title: "Dashboard",
    description: "Here's what's happening with your store today.",
  },
  "/admin/products": {
    title: "Products",
    description: "Manage your products and inventory.",
  },
  "/admin/categories": {
    title: "Categories",
    description: "Organize your store categories.",
  },
  "/admin/orders": {
    title: "Orders",
    description: "Review and manage customer orders.",
  },
  "/admin/tracking": {
    title: "Live Order Tracking",
    description: "Track delivery riders, routes and estimated arrival times.",
  },
  "/admin/customers": {
    title: "Customers",
    description: "View and manage your customers.",
  },
  "/admin/coupons": {
    title: "Coupons",
    description: "Manage promotional codes and discounts.",
  },
  "/admin/reports": {
    title: "Reports",
    description: "Review store performance and sales reports.",
  },
  "/admin/settings": {
    title: "Settings",
    description: "Manage your store preferences.",
  },
};

function getInitialNotifications() {
  try {
    const saved = localStorage.getItem(NOTIFICATION_KEY);

    if (!saved) return INITIAL_NOTIFICATIONS;

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : INITIAL_NOTIFICATIONS;
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

function getAdminName() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const admin = JSON.parse(localStorage.getItem("admin") || "null");

    return (
      admin?.name ||
      admin?.username ||
      admin?.email ||
      user?.name ||
      user?.username ||
      user?.email ||
      localStorage.getItem("userEmail") ||
      "Administrator"
    );
  } catch {
    return localStorage.getItem("userEmail") || "Administrator";
  }
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [adminName, setAdminName] = useState(getAdminName);
  const [notifications, setNotifications] = useState(
    getInitialNotifications
  );

  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  const unreadCount = notifications.filter(
    (item) => !item.read
  ).length;

  const currentPage = pageInfo[location.pathname] || {
    title: "Admin Panel",
    description: "Manage your FreshCart store.",
  };

  // Keep notifications saved.
  useEffect(() => {
    try {
      localStorage.setItem(
        NOTIFICATION_KEY,
        JSON.stringify(notifications)
      );
    } catch (error) {
      console.error("Unable to save notifications:", error);
    }
  }, [notifications]);

  // Refresh the displayed admin name when navigating.
  useEffect(() => {
    setAdminName(getAdminName());
  }, [location.pathname]);

  // Close dropdowns when clicking outside.
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  // Close mobile menus when changing pages.
  useEffect(() => {
    setSidebarOpen(false);
    setProfileOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  // LOGOUT: clear session and redirect to shared Account page.
  const handleLogout = () => {
    const confirmed = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmed) return;

    const authKeys = [
      "token",
      "user",
      "userEmail",
      "isLoggedIn",
      "adminLoggedIn",
      "admin",
      "adminToken",
    ];

    authKeys.forEach((key) => {
      localStorage.removeItem(key);
    });

    ["token", "user", "admin"].forEach((key) => {
      sessionStorage.removeItem(key);
    });

    setProfileOpen(false);
    setNotificationsOpen(false);

    navigate("/account", { replace: true });
  };

  // Mark all notifications as read.
  const markAllRead = () => {
    setNotifications((previous) =>
      previous.map((item) => ({
        ...item,
        read: true,
      }))
    );
  };

  // Open a notification.
  const handleNotificationClick = (notification) => {
    setNotifications((previous) =>
      previous.map((item) =>
        item.id === notification.id
          ? { ...item, read: true }
          : item
      )
    );

    setNotificationsOpen(false);

    if (notification.path) {
      navigate(notification.path);
    }
  };

  // Add a sample notification for testing.
  const addDemoNotification = () => {
    const demoNotification = {
      id: `demo-${Date.now()}`,
      title: "New order notification",
      message: "This is a sample notification for testing the dropdown.",
      type: "order",
      time: "Just now",
      read: false,
      path: "/admin/orders",
    };

    setNotifications((previous) => [
      demoNotification,
      ...previous,
    ]);

    setNotificationsOpen(true);
  };

  // Filter sidebar menu.
  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.label
          .toLowerCase()
          .includes(searchValue.trim().toLowerCase())
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div
      className={`fc-admin-shell ${
        sidebarCollapsed ? "fc-sidebar-collapsed" : ""
      }`}
    >
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="fc-sidebar-overlay"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fc-admin-sidebar ${
          sidebarOpen ? "is-open" : ""
        }`}
      >
        <div className="fc-sidebar-brand">
          <Link to="/admin" className="fc-brand-link">
            <span className="fc-brand-icon">
              <ShoppingBag size={23} strokeWidth={2.3} />
            </span>

            <span className="fc-brand-text">
              <strong>FreshCart</strong>
              <small>ADMIN PANEL</small>
            </span>
          </Link>

          <button
            type="button"
            className="fc-mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="fc-sidebar-store">
          <span className="fc-store-avatar">
            <ShoppingBag size={18} />
          </span>

          <span className="fc-store-details">
            <strong>FreshCart Store</strong>
            <small>Store management</small>
          </span>

          <span className="fc-online-dot" title="Online" />
        </div>

        <nav className="fc-admin-nav">
          {filteredGroups.map((group) => (
            <div className="fc-nav-group" key={group.title}>
              <p className="fc-nav-heading">{group.title}</p>

              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    title={
                      sidebarCollapsed ? item.label : undefined
                    }
                    className={({ isActive }) =>
                      `fc-nav-link ${isActive ? "active" : ""}`
                    }
                  >
                    <Icon size={19} strokeWidth={1.9} />

                    <span className="fc-nav-label">
                      {item.label}
                    </span>

                    {item.label === "Orders" && (
                      <span className="fc-nav-badge">
                        Manage
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="fc-sidebar-bottom">
          <div className="fc-help-card">
            <span className="fc-help-icon">
              <CircleCheck size={19} />
            </span>

            <div>
              <strong>Everything in control</strong>
              <p>Manage your store from one place.</p>
            </div>
          </div>

          <button
            type="button"
            className="fc-sidebar-collapse"
            onClick={() =>
              setSidebarCollapsed((value) => !value)
            }
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}

            <span>
              {sidebarCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"}
            </span>
          </button>

          <div className="fc-sidebar-footer">
            <span>FreshCart Admin</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </aside>

      {/* Main admin section */}
      <div className="fc-admin-main">
        {/* Topbar */}
        <header className="fc-admin-topbar">
          <div className="fc-topbar-left">
            <button
              type="button"
              className="fc-icon-button fc-mobile-menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={21} />
            </button>

            <div className="fc-breadcrumb">
              <span>FreshCart</span>
              <span className="fc-breadcrumb-divider">/</span>
              <strong>{currentPage.title}</strong>
            </div>
          </div>

          <div className="fc-topbar-right">
            {/* Sidebar search */}
            <label className="fc-search-box">
              <Search size={18} />

              <input
                type="search"
                placeholder="Search menu..."
                value={searchValue}
                onChange={(event) =>
                  setSearchValue(event.target.value)
                }
                aria-label="Search admin menu"
              />

              <kbd>⌘ K</kbd>
            </label>

            {/* Notifications */}
            <div
              className="fc-dropdown-wrap"
              ref={notificationRef}
            >
              <button
                type="button"
                className={`fc-icon-button fc-notification-button ${
                  notificationsOpen ? "is-active" : ""
                }`}
                onClick={() => {
                  setNotificationsOpen((value) => !value);
                  setProfileOpen(false);
                }}
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
              >
                <Bell size={20} />

                {unreadCount > 0 && (
                  <span className="fc-notification-count">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="fc-dropdown fc-notification-dropdown">
                  <div className="fc-dropdown-heading">
                    <div>
                      <h3>Notifications</h3>

                      <p>
                        {unreadCount > 0
                          ? `${unreadCount} unread notification${
                              unreadCount === 1 ? "" : "s"
                            }`
                          : "You're all caught up"}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="fc-text-action"
                      onClick={markAllRead}
                      disabled={unreadCount === 0}
                    >
                      <CheckCheck size={15} />
                      Mark all read
                    </button>
                  </div>

                  <div className="fc-notification-list">
                    {notifications.length === 0 ? (
                      <div className="fc-empty-notifications">
                        <span>
                          <Bell size={23} />
                        </span>

                        <strong>No notifications yet</strong>
                        <p>New alerts will appear here.</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          type="button"
                          className={`fc-notification-item ${
                            notification.read
                              ? "is-read"
                              : "is-unread"
                          }`}
                          key={notification.id}
                          onClick={() =>
                            handleNotificationClick(notification)
                          }
                        >
                          <span
                            className={`fc-notification-icon ${notification.type}`}
                          >
                            {notification.type === "stock" ? (
                              <AlertTriangle size={18} />
                            ) : notification.type === "success" ? (
                              <CircleCheck size={18} />
                            ) : (
                              <ShoppingBag size={18} />
                            )}
                          </span>

                          <span className="fc-notification-copy">
                            <strong>{notification.title}</strong>

                            <span>
                              {notification.message}
                            </span>

                            <small>
                              <Clock3 size={12} />
                              {notification.time}
                            </small>
                          </span>

                          {!notification.read && (
                            <span className="fc-unread-dot" />
                          )}
                        </button>
                      ))
                    )}
                  </div>

                  <div className="fc-notification-footer">
                    <button
                      type="button"
                      onClick={addDemoNotification}
                    >
                      Test notification
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigate("/admin/orders");
                      }}
                    >
                      View orders
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="fc-topbar-divider" />

            {/* Admin profile */}
            <div className="fc-dropdown-wrap" ref={profileRef}>
              <button
                type="button"
                className={`fc-profile-trigger ${
                  profileOpen ? "is-active" : ""
                }`}
                onClick={() => {
                  setProfileOpen((value) => !value);
                  setNotificationsOpen(false);
                }}
                aria-expanded={profileOpen}
                aria-label="Open admin profile menu"
              >
                <span className="fc-profile-avatar">
                  <UserRound size={21} />
                </span>

                <span className="fc-profile-info">
                  <strong>{adminName}</strong>
                  <small>Administrator</small>
                </span>

                <ChevronDown
                  size={16}
                  className={`fc-profile-chevron ${
                    profileOpen ? "rotate" : ""
                  }`}
                />
              </button>

              {profileOpen && (
                <div className="fc-dropdown fc-profile-dropdown">
                  <div className="fc-profile-dropdown-header">
                    <span className="fc-profile-avatar large">
                      <UserRound size={24} />
                    </span>

                    <div>
                      <strong>{adminName}</strong>
                      <span>Store Administrator</span>
                    </div>
                  </div>

                  <div className="fc-profile-menu">
                    <button
                      type="button"
                      className="fc-profile-menu-item"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/admin/settings");
                      }}
                    >
                      <Settings size={17} />
                      <span>Account settings</span>
                    </button>

                    <div className="fc-profile-menu-divider" />

                    <button
                      type="button"
                      className="fc-profile-menu-item fc-logout-btn"
                      onClick={handleLogout}
                    >
                      <LogOut size={17} />
                      <span>Logout</span>
                    </button>
                  </div>

                  <div className="fc-profile-dropdown-footer">
                    Secure admin session
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="fc-admin-content">
          <div className="fc-page-heading">
            <div>
              <div className="fc-page-eyebrow">
                STORE MANAGEMENT
              </div>

              <h1>{currentPage.title}</h1>
              <p>{currentPage.description}</p>
            </div>

            <div className="fc-page-heading-right">
              <span className="fc-status-pill">
                <span />
                Admin workspace
              </span>
            </div>
          </div>

          <div className="fc-admin-outlet">
            <Outlet />
          </div>

          <footer className="fc-admin-page-footer">
            <span>© 2026 FreshCart. All rights reserved.</span>
            <span>Built for smarter store management.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}