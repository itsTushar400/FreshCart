
import { useCallback, useEffect, useMemo, useState } from "react";
import "./Categories.css";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "") + "/api";

function getCategoryId(category) {
  return category.id ?? category.category_id ?? category.categoryId;
}

function getCategoryName(category) {
  return category.name ?? category.category_name ?? category.title ?? "";
}

function getCategoryDescription(category) {
  return category.description ?? category.details ?? "";
}

function getProductCount(category) {
  return Number(
    category.product_count ??
      category.products_count ??
      category.totalProducts ??
      category.productCount ??
      (Array.isArray(category.products) ? category.products.length : 0)
  ) || 0;
}

function extractCategories(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.categories)) return payload.categories;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.categories)) return payload.data.categories;
  return [];
}

function getErrorMessage(payload, fallback) {
  return payload?.message || payload?.error || fallback;
}

const categoryIcons = ["🥬", "🍎", "🥛", "🍞", "🥚", "🥕", "🍚", "🧃"];

function getCategoryIcon(category, index) {
  const value = `${getCategoryName(category)} ${getCategoryDescription(category)}`.toLowerCase();

  if (/fruit|apple|mango|banana|orange|fruits/.test(value)) return "🍎";
  if (/vegetable|veg|green|spinach|potato|onion/.test(value)) return "🥬";
  if (/milk|dairy|cheese|butter|curd|yogurt/.test(value)) return "🥛";
  if (/bread|bakery|cake|biscuit|cookie/.test(value)) return "🍞";
  if (/egg|poultry/.test(value)) return "🥚";
  if (/rice|grain|flour|atta|cereal/.test(value)) return "🍚";
  if (/drink|juice|beverage|water|juice/.test(value)) return "🧃";
  if (/meat|chicken|fish|seafood/.test(value)) return "🍗";

  return categoryIcons[index % categoryIcons.length];
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const getHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    setNotice("");

    try {
      const response = await fetch(`${API_BASE}/categories`, {
        headers: getHeaders(),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload,
            `Categories load nahi hui (HTTP ${response.status}).`
          )
        );
      }

      setCategories(extractCategories(payload));
    } catch (error) {
      setCategories([]);
      setLoadError(
        error.message || "Categories load nahi ho paayi. Backend check karo."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories, refreshKey]);

  const totalProducts = useMemo(
    () => categories.reduce((sum, category) => sum + getProductCount(category), 0),
    [categories]
  );

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return categories;

    return categories.filter((category) => {
      const name = getCategoryName(category).toLowerCase();
      const description = getCategoryDescription(category).toLowerCase();
      const id = String(getCategoryId(category) ?? "").toLowerCase();

      return name.includes(term) || description.includes(term) || id.includes(term);
    });
  }, [categories, search]);

  const openAddModal = () => {
    setEditingCategory(null);
    setForm({ name: "", description: "" });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setForm({
      name: getCategoryName(category),
      description: getCategoryDescription(category),
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingCategory(null);
    setFormError("");
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setFormError("");
    setNotice("");

    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      setFormError("Category name is required.");
      return;
    }

    const isEditing = Boolean(editingCategory);
    const categoryId = getCategoryId(editingCategory);
    const endpoint = isEditing
      ? `${API_BASE}/categories/${encodeURIComponent(categoryId)}`
      : `${API_BASE}/categories`;

    setSaving(true);

    try {
      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: getHeaders(),
        body: JSON.stringify({ name, description }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload,
            `Category ${isEditing ? "update" : "create"} nahi hui (HTTP ${response.status}).`
          )
        );
      }

      setModalOpen(false);
      setEditingCategory(null);
      setForm({ name: "", description: "" });
      setNotice(`Category ${isEditing ? "updated" : "created"} successfully.`);
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setFormError(error.message || "Category save nahi ho paayi.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const categoryId = getCategoryId(deleteTarget);

    if (categoryId == null) {
      setLoadError("Category ID nahi mila. Delete nahi ki ja sakti.");
      setDeleteTarget(null);
      return;
    }

    setDeleting(true);
    setLoadError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API_BASE}/categories/${encodeURIComponent(categoryId)}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        }
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload,
            `Category delete nahi hui (HTTP ${response.status}).`
          )
        );
      }

      setCategories((current) =>
        current.filter((category) => String(getCategoryId(category)) !== String(categoryId))
      );
      setNotice("Category deleted successfully.");
      setDeleteTarget(null);
    } catch (error) {
      setLoadError(error.message || "Category delete nahi ho paayi.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="categories-page">
      <div className="categories-breadcrumb">
        <span>Workspace</span>
        <span className="categories-breadcrumb-separator">/</span>
        <span>Categories</span>
      </div>

      <header className="categories-page-header">
        <div>
          <div className="categories-eyebrow">
            <span className="categories-eyebrow-dot" />
            FRESHCART ADMIN
          </div>
          <h1>Category Management</h1>
          <p>
            Organize your grocery catalog and keep products easy to discover.
          </p>
        </div>

        <div className="categories-header-actions">
          <button
            type="button"
            className="categories-refresh-btn"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={loading}
          >
            <span>↻</span> Refresh
          </button>
          <button
            type="button"
            className="categories-add-btn"
            onClick={openAddModal}
          >
            <span>＋</span> Add Category
          </button>
        </div>
      </header>

      {notice && (
        <div className="categories-notice" role="status">
          <span>✓</span> {notice}
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {loadError && (
        <div className="categories-error" role="alert">
          <span className="categories-error-symbol">!</span>
          <div>
            <strong>Something needs attention</strong>
            <p>{loadError}</p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
          >
            Retry
          </button>
        </div>
      )}

      <section className="categories-stats-grid">
        <article className="categories-stat-card">
          <div className="categories-stat-top">
            <span className="categories-stat-label">Total Categories</span>
            <span className="categories-stat-icon categories-stat-green">▦</span>
          </div>
          <strong className="categories-stat-number">
            {loading ? "—" : categories.length.toLocaleString("en-IN")}
          </strong>
          <span className="categories-stat-note">In your catalog</span>
        </article>

        <article className="categories-stat-card">
          <div className="categories-stat-top">
            <span className="categories-stat-label">With Products</span>
            <span className="categories-stat-icon categories-stat-blue">▤</span>
          </div>
          <strong className="categories-stat-number">
            {loading
              ? "—"
              : categories.filter((category) => getProductCount(category) > 0).length}
          </strong>
          <span className="categories-stat-note">Categories with linked products</span>
        </article>

        <article className="categories-stat-card">
          <div className="categories-stat-top">
            <span className="categories-stat-label">Total Products</span>
            <span className="categories-stat-icon categories-stat-purple">◈</span>
          </div>
          <strong className="categories-stat-number">
            {loading ? "—" : totalProducts.toLocaleString("en-IN")}
          </strong>
          <span className="categories-stat-note">Across reported categories</span>
        </article>
      </section>

      <section className="categories-list-card">
        <div className="categories-list-header">
          <div>
            <h2>Your Categories</h2>
            <p>Manage category names and keep your catalog organized.</p>
          </div>
          <span className="categories-count-badge">
            {loading ? "Loading..." : `${filteredCategories.length} categories`}
          </span>
        </div>

        <div className="categories-toolbar">
          <label className="categories-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search categories..."
              aria-label="Search categories"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
                ×
              </button>
            )}
          </label>
          <span className="categories-toolbar-hint">
            <span className="categories-online-dot" /> Catalog overview
          </span>
        </div>

        <div className="categories-table-scroll">
          <table className="categories-table">
            <thead>
              <tr>
                <th>CATEGORY</th>
                <th>DESCRIPTION</th>
                <th>PRODUCTS</th>
                <th>CATALOG STATUS</th>
                <th className="categories-action-heading">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={`category-skeleton-${index}`}>
                    <td colSpan={5}>
                      <div className="categories-skeleton" />
                    </td>
                  </tr>
                ))
              ) : filteredCategories.length > 0 ? (
                filteredCategories.map((category, index) => {
                  const id = getCategoryId(category);
                  const name = getCategoryName(category);
                  const description = getCategoryDescription(category);
                  const count = getProductCount(category);

                  return (
                    <tr key={id ?? `${name}-${index}`}>
                      <td>
                        <div className="categories-name-cell">
                          <span className="categories-emoji">
                            {getCategoryIcon(category, index)}
                          </span>
                          <div className="categories-name-info">
                            <strong>{name || "Untitled category"}</strong>
                            <small>
                              {id != null ? `Category ID: ${id}` : "Category"}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="categories-description">
                          {description || "No description added"}
                        </span>
                      </td>
                      <td>
                        <span className="categories-product-count">
                          {count}
                          <small>{count === 1 ? " product" : " products"}</small>
                        </span>
                      </td>
                      <td>
                        <span
                          className={`categories-status ${
                            count > 0 ? "categories-status-active" : "categories-status-empty"
                          }`}
                        >
                          <span />
                          {count > 0 ? "Has products" : "No products"}
                        </span>
                      </td>
                      <td className="categories-action-cell">
                        <div className="categories-row-actions">
                          <button
                            type="button"
                            className="categories-edit-btn"
                            onClick={() => openEditModal(category)}
                            aria-label={`Edit ${name}`}
                          >
                            <span>✎</span> Edit
                          </button>
                          <button
                            type="button"
                            className="categories-delete-btn"
                            onClick={() => setDeleteTarget(category)}
                            aria-label={`Delete ${name}`}
                          >
                            <span>×</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5}>
                    <div className="categories-empty">
                      <span className="categories-empty-icon">▦</span>
                      <h3>{loadError ? "Categories unavailable" : "No categories found"}</h3>
                      <p>
                        {loadError
                          ? "Check your backend connection and retry."
                          : search
                            ? "Try another search or clear your search term."
                            : "Create your first category to start organizing products."}
                      </p>
                      {!search && !loadError && (
                        <button type="button" onClick={openAddModal}>
                          ＋ Add your first category
                        </button>
                      )}
                      {search && (
                        <button type="button" onClick={() => setSearch("")}>
                          Clear search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="categories-table-footer">
          <span>
            Showing {loading ? "…" : filteredCategories.length} of{" "}
            {loading ? "…" : categories.length} categories
          </span>
          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={loading}
          >
            ↻ Refresh data
          </button>
        </footer>
      </section>

      {modalOpen && (
        <div
          className="categories-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className="categories-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="categories-modal-title"
          >
            <header className="categories-modal-header">
              <div className="categories-modal-heading-icon">▦</div>
              <div className="categories-modal-heading-text">
                <span>CATEGORY SETTINGS</span>
                <h2 id="categories-modal-title">
                  {editingCategory ? "Edit Category" : "Create Category"}
                </h2>
                <p>
                  {editingCategory
                    ? "Update the details for this category."
                    : "Add a category to organize your grocery products."}
                </p>
              </div>
              <button
                type="button"
                className="categories-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
              >
                ×
              </button>
            </header>

            <form className="categories-form" onSubmit={handleSave}>
              <label>
                <span>Category name <b>*</b></span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="e.g. Fresh Vegetables"
                  maxLength={100}
                  autoFocus
                  required
                />
              </label>

              <label>
                <span>Description <small>Optional</small></span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Briefly describe this category..."
                  rows={4}
                  maxLength={500}
                />
              </label>

              {formError && (
                <div className="categories-form-error" role="alert">
                  {formError}
                </div>
              )}

              <div className="categories-form-footer">
                <button
                  type="button"
                  className="categories-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="categories-submit-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingCategory
                      ? "Save Changes"
                      : "Create Category"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div
          className="categories-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setDeleteTarget(null);
            }
          }}
        >
          <section
            className="categories-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="categories-delete-title"
          >
            <div className="categories-delete-icon">!</div>
            <h2 id="categories-delete-title">Delete this category?</h2>
            <p>
              You are about to delete{" "}
              <strong>{getCategoryName(deleteTarget)}</strong>. This action
              cannot be undone. If products are linked to it, the backend may
              reject the deletion.
            </p>
            <div className="categories-delete-actions">
              <button
                type="button"
                className="categories-cancel-btn"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Keep Category
              </button>
              <button
                type="button"
                className="categories-confirm-delete-btn"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
