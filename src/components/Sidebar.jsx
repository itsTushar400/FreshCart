
import { Link } from "react-router-dom";
import { categories } from "../context/ShopContext";
import "./Sidebar.css";

export default function Sidebar({ isOpen = true, onToggle = () => {} }) {
  return (
    <aside
      className={`sidebar ${isOpen ? "sidebar-open" : "sidebar-mini"}`}
      aria-label="Product categories"
    >
      <button
        type="button"
        className="side-title"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Collapse categories" : "Expand categories"}
        title={isOpen ? "Hide categories" : "Show categories"}
      >
        <span className="side-menu-icon">☷</span>

        {isOpen && <span className="side-title-text">All Categories</span>}

        <b className="side-arrow">{isOpen ? "‹" : "›"}</b>
      </button>

      <div className="side-category-list">
        {categories.map(([icon, name]) => (
          <Link
            className="side-link"
            key={name}
            to={`/shop?category=${encodeURIComponent(name)}`}
            title={name}
          >
            <span className="side-link-icon">{icon}</span>
            {isOpen && <span className="side-link-name">{name}</span>}
          </Link>
        ))}
      </div>
    </aside>
  );
}
