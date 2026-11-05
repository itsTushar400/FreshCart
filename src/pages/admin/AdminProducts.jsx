
import { useCallback, useEffect, useMemo, useState } from "react";
import "./AdminProducts.css";

const API_BASE =
  (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "") +
  "/api";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category_id: "",
  image: "",
};

function getTokenHeaders() {
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
    headers: { ...getTokenHeaders(), ...options.headers },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      payload.message ||
        payload.error ||
        `Request failed with status ${response.status}`
    );
  }

  return payload;
}

function getProducts(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.products)) return payload.data.products;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function getCategories(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.categories)) return payload.categories;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.categories)) return payload.data.categories;
  return [];
}

function productId(product) {
  return product.id ?? product.product_id ?? product.productId;
}

function productName(product) {
  return product.name ?? product.product_name ?? product.title ?? "";
}

function productPrice(product) {
  return Number(product.price ?? product.sale_price ?? product.amount ?? 0) || 0;
}

function productStock(product) {
  return Number(
    product.stock ??
      product.quantity ??
      product.stock_quantity ??
      product.inventory ??
      0
  ) || 0;
}

function productCategoryId(product) {
  return (
    product.category_id ??
    product.categoryId ??
    product.category?.id ??
    ""
  );
}

function productCategoryName(product, categories) {
  const directName =
    product.category_name ??
    product.categoryName ??
    product.category?.name;

  if (directName) return directName;

  const id = productCategoryId(product);
  const found = categories.find(
    (category) =>
      String(category.id ?? category.category_id ?? category.categoryId) ===
      String(id)
  );

  return found?.name ?? found?.category_name ?? "Uncategorized";
}

function productImage(product) {
  return (
    product.image_url ??
    product.image ??
    product.photo ??
    product.thumbnail ??
    ""
  );
}

function productDescription(product) {
  return product.description ?? product.details ?? "";
}

function getStatus(stock) {
  if (stock <= 0) return "Out of stock";
  if (stock <= 5) return "Low stock";
  return "In stock";
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function ProductThumbnail({ product }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = productImage(product);

  useEffect(() => {
    setImageFailed(false);
  }, [image]);

  if (!image || imageFailed) {
    return (
      <div className="products-thumbnail products-thumbnail-fallback">
        <span>🥬</span>
      </div>
    );
  }

  return (
    <div className="products-thumbnail">
      <img
        src={image}
        alt={productName(product)}
        loading="lazy"
        onError={() => setImageFailed(true)}
      />
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setCategoriesLoading(true);
    setError("");
    setNotice("");

    const [productResult, categoryResult] = await Promise.allSettled([
      requestJSON(`${API_BASE}/products`),
      requestJSON(`${API_BASE}/categories`),
    ]);

    if (productResult.status === "fulfilled") {
      setProducts(getProducts(productResult.value));
    } else {
      setProducts([]);
      setError(
        productResult.reason?.message ||
          "Products load nahi hue. Backend connection check karo."
      );
    }

    if (categoryResult.status === "fulfilled") {
      setCategories(getCategories(categoryResult.value));
    } else {
      setCategories([]);
    }

    setLoading(false);
    setCategoriesLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const stats = useMemo(() => {
    const totalUnits = products.reduce(
      (sum, product) => sum + productStock(product),
      0
    );
    const inventoryValue = products.reduce(
      (sum, product) => sum + productPrice(product) * productStock(product),
      0
    );
    const lowStock = products.filter(
      (product) => productStock(product) > 0 && productStock(product) <= 5
    ).length;
    const outOfStock = products.filter(
      (product) => productStock(product) <= 0
    ).length;

    return {
      total: products.length,
      totalUnits,
      inventoryValue,
      lowStock,
      outOfStock,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      const name = productName(product).toLowerCase();
      const description = productDescription(product).toLowerCase();
      const category = productCategoryName(product, categories).toLowerCase();
      const id = String(productId(product) ?? "").toLowerCase();
      const stock = productStock(product);
      const categoryId = String(productCategoryId(product));

      const matchesSearch =
        !term ||
        name.includes(term) ||
        description.includes(term) ||
        category.includes(term) ||
        id.includes(term);

      const matchesCategory =
        categoryFilter === "all" || categoryId === categoryFilter;

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in" && stock > 5) ||
        (stockFilter === "low" && stock > 0 && stock <= 5) ||
        (stockFilter === "out" && stock <= 0);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, categories, search, categoryFilter, stockFilter]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      name: productName(product),
      description: productDescription(product),
      price: String(productPrice(product)),
      stock: String(productStock(product)),
      category_id: String(productCategoryId(product) ?? ""),
      image: productImage(product),
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingProduct(null);
    setFormError("");
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setFormError("");
    setNotice("");

    const name = form.name.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!name) {
      setFormError("Product name is required.");
      return;
    }

    if (form.price === "" || !Number.isFinite(price) || price < 0) {
      setFormError("Valid product price enter karo.");
      return;
    }

    if (
      form.stock === "" ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setFormError("Stock ek valid non-negative whole number hona chahiye.");
      return;
    }

    const isEditing = Boolean(editingProduct);
    const id = productId(editingProduct);

    if (isEditing && id == null) {
      setFormError("Product ID nahi mila. Product update nahi ho sakta.");
      return;
    }

    const payload = {
      name,
      description: form.description.trim(),
      price,
      stock,
      category_id: form.category_id ? Number(form.category_id) : null,
      image: form.image.trim(),
    };

    setSaving(true);

    try {
      await requestJSON(
        isEditing
          ? `${API_BASE}/products/${encodeURIComponent(id)}`
          : `${API_BASE}/products`,
        {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );

      setModalOpen(false);
      setEditingProduct(null);
      setForm(EMPTY_FORM);
      setNotice(`Product ${isEditing ? "updated" : "added"} successfully.`);
      setRefreshKey((key) => key + 1);
    } catch (saveError) {
      setFormError(
        saveError.message || "Product save nahi hua. API check karo."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const id = productId(deleteTarget);

    if (id == null) {
      setError("Product ID nahi mila. Delete nahi kiya ja sakta.");
      setDeleteTarget(null);
      return;
    }

    setDeleting(true);
    setError("");
    setNotice("");

    try {
      await requestJSON(`${API_BASE}/products/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      setProducts((current) =>
        current.filter(
          (product) => String(productId(product)) !== String(id)
        )
      );
      setNotice("Product deleted successfully.");
      setDeleteTarget(null);
    } catch (deleteError) {
      setError(
        deleteError.message || "Product delete nahi hua. API check karo."
      );
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="products-page">
      <div className="products-breadcrumb">
        <span>Workspace</span>
        <span>/</span>
        <strong>Products</strong>
      </div>

      <header className="products-page-header">
        <div>
          <div className="products-eyebrow">
            <span />
            FRESHCART ADMIN
          </div>
          <h1>Product Management</h1>
          <p>Manage your grocery inventory, prices, categories and stock.</p>
        </div>

        <div className="products-header-actions">
          <button
            type="button"
            className="products-refresh-btn"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={loading}
          >
            <span>↻</span> Refresh
          </button>
          <button
            type="button"
            className="products-add-btn"
            onClick={openAddModal}
          >
            <span>＋</span> Add Product
          </button>
        </div>
      </header>

      {notice && (
        <div className="products-notice" role="status">
          <span>✓</span> {notice}
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="products-error" role="alert">
          <span className="products-error-icon">!</span>
          <div>
            <strong>Unable to complete the request</strong>
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

      <section className="products-stats-grid">
        <article className="products-stat-card">
          <div className="products-stat-top">
            <span>Total Products</span>
            <span className="products-stat-icon products-stat-green">▦</span>
          </div>
          <strong>{loading ? "—" : stats.total.toLocaleString("en-IN")}</strong>
          <small>Products in catalog</small>
        </article>

        <article className="products-stat-card">
          <div className="products-stat-top">
            <span>Inventory Units</span>
            <span className="products-stat-icon products-stat-blue">▤</span>
          </div>
          <strong>{loading ? "—" : stats.totalUnits.toLocaleString("en-IN")}</strong>
          <small>Total reported stock</small>
        </article>

        <article className="products-stat-card">
          <div className="products-stat-top">
            <span>Low Stock</span>
            <span className="products-stat-icon products-stat-orange">!</span>
          </div>
          <strong>{loading ? "—" : stats.lowStock}</strong>
          <small>Products with 1–5 units</small>
        </article>

        <article className="products-stat-card">
          <div className="products-stat-top">
            <span>Out of Stock</span>
            <span className="products-stat-icon products-stat-red">×</span>
          </div>
          <strong>{loading ? "—" : stats.outOfStock}</strong>
          <small>Products needing restock</small>
        </article>
      </section>

      <section className="products-inventory-summary">
        <div className="products-summary-icon">₹</div>
        <div>
          <span>Estimated Inventory Value</span>
          <strong>
            {loading ? "—" : formatPrice(stats.inventoryValue)}
          </strong>
        </div>
        <p>Calculated from current product prices × stock quantities.</p>
      </section>

      <section className="products-list-card">
        <div className="products-list-header">
          <div>
            <h2>All Products</h2>
            <p>View and manage your complete grocery inventory.</p>
          </div>
          <span className="products-total-badge">
            {loading ? "Loading..." : `${filteredProducts.length} products`}
          </span>
        </div>

        <div className="products-toolbar">
          <label className="products-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product name, description..."
              aria-label="Search products"
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

          <select
            className="products-filter"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {categories.map((category, index) => {
              const id =
                category.id ?? category.category_id ?? category.categoryId;
              const name = category.name ?? category.category_name ?? category.title;

              if (id == null) return null;

              return (
                <option key={id ?? index} value={String(id)}>
                  {name || "Unnamed category"}
                </option>
              );
            })}
          </select>

          <select
            className="products-filter"
            value={stockFilter}
            onChange={(event) => setStockFilter(event.target.value)}
            aria-label="Filter by stock"
          >
            <option value="all">All stock</option>
            <option value="in">In stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
        </div>

        {categoriesLoading && (
          <p className="products-category-hint">Loading category filters...</p>
        )}

        <div className="products-table-scroll">
          <table className="products-table">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>CATEGORY</th>
                <th>PRICE</th>
                <th>STOCK</th>
                <th>STATUS</th>
                <th className="products-actions-heading">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`product-skeleton-${index}`}>
                    <td colSpan={6}>
                      <div className="products-skeleton" />
                    </td>
                  </tr>
                ))
              ) : filteredProducts.length ? (
                filteredProducts.map((product, index) => {
                  const stock = productStock(product);
                  const status = getStatus(stock);
                  const id = productId(product);
                  const name = productName(product);

                  return (
                    <tr key={id ?? `${name}-${index}`}>
                      <td>
                        <div className="products-name-cell">
                          <ProductThumbnail product={product} />
                          <div className="products-name-info">
                            <strong>{name || "Untitled product"}</strong>
                            <small>
                              {id != null ? `ID: ${id}` : "Product"}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="products-category-label">
                          {productCategoryName(product, categories)}
                        </span>
                      </td>
                      <td>
                        <strong className="products-price">
                          {formatPrice(productPrice(product))}
                        </strong>
                      </td>
                      <td>
                        <div className="products-stock-cell">
                          <strong>{stock}</strong>
                          <small>units</small>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`products-status ${
                            stock <= 0
                              ? "products-status-out"
                              : stock <= 5
                                ? "products-status-low"
                                : "products-status-in"
                          }`}
                        >
                          <span />
                          {status}
                        </span>
                      </td>
                      <td className="products-actions-cell">
                        <div className="products-row-actions">
                          <button
                            type="button"
                            className="products-edit-btn"
                            onClick={() => openEditModal(product)}
                            aria-label={`Edit ${name}`}
                          >
                            <span>✎</span> Edit
                          </button>
                          <button
                            type="button"
                            className="products-delete-btn"
                            onClick={() => setDeleteTarget(product)}
                            aria-label={`Delete ${name}`}
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="products-empty">
                      <span className="products-empty-icon">🛒</span>
                      <h3>{error ? "Products unavailable" : "No products found"}</h3>
                      <p>
                        {error
                          ? "Check the backend connection and retry."
                          : search || categoryFilter !== "all" || stockFilter !== "all"
                            ? "Try changing the search or filters."
                            : "Add your first product to get your catalog started."}
                      </p>
                      {!error &&
                        !search &&
                        categoryFilter === "all" &&
                        stockFilter === "all" && (
                          <button type="button" onClick={openAddModal}>
                            ＋ Add your first product
                          </button>
                        )}
                      {(search || categoryFilter !== "all" || stockFilter !== "all") && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearch("");
                            setCategoryFilter("all");
                            setStockFilter("all");
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

        <footer className="products-table-footer">
          <span>
            Showing {loading ? "…" : filteredProducts.length} of{" "}
            {loading ? "…" : products.length} products
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
          className="products-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className="products-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="products-modal-title"
          >
            <header className="products-modal-header">
              <div className="products-modal-icon">🛒</div>
              <div className="products-modal-heading">
                <span>PRODUCT CATALOG</span>
                <h2 id="products-modal-title">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <p>
                  {editingProduct
                    ? "Update product information and inventory."
                    : "Enter the details for your new grocery product."}
                </p>
              </div>
              <button
                type="button"
                className="products-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
              >
                ×
              </button>
            </header>

            <form className="products-form" onSubmit={handleSave}>
              <label className="products-form-full">
                <span>Product name <b>*</b></span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  placeholder="e.g. Fresh Red Apples"
                  maxLength={150}
                  autoFocus
                  required
                />
              </label>

              <div className="products-form-grid">
                <label>
                  <span>Price (₹) <b>*</b></span>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(event) => updateForm("price", event.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </label>

                <label>
                  <span>Stock quantity <b>*</b></span>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(event) => updateForm("stock", event.target.value)}
                    placeholder="e.g. 50"
                    min="0"
                    step="1"
                    required
                  />
                </label>

                <label className="products-form-full">
                  <span>Category</span>
                  <select
                    value={form.category_id}
                    onChange={(event) =>
                      updateForm("category_id", event.target.value)
                    }
                  >
                    <option value="">Choose a category</option>
                    {categories.map((category, index) => {
                      const id =
                        category.id ??
                        category.category_id ??
                        category.categoryId;
                      const name =
                        category.name ??
                        category.category_name ??
                        category.title;

                      if (id == null) return null;

                      return (
                        <option key={id ?? index} value={String(id)}>
                          {name || "Unnamed category"}
                        </option>
                      );
                    })}
                  </select>
                  {!categories.length && (
                    <small className="products-form-hint">
                      Add categories first if your products require them.
                    </small>
                  )}
                </label>

                <label className="products-form-full">
                  <span>Image URL <small>Optional</small></span>
                  <input
                    type="url"
                    value={form.image}
                    onChange={(event) => updateForm("image", event.target.value)}
                    placeholder="https://example.com/product.jpg"
                  />
                  <small className="products-form-hint">
                    Paste a publicly accessible image URL. This form does not
                    upload local image files.
                  </small>
                </label>

                {form.image.trim() && (
                  <div className="products-image-preview products-form-full">
                    <span>Image preview</span>
                    <img
                      src={form.image.trim()}
                      alt="Product preview"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                      onLoad={(event) => {
                        event.currentTarget.style.display = "block";
                      }}
                    />
                  </div>
                )}

                <label className="products-form-full">
                  <span>Description <small>Optional</small></span>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    placeholder="Describe the product..."
                    rows={3}
                    maxLength={1000}
                  />
                </label>
              </div>

              {formError && (
                <div className="products-form-error" role="alert">
                  {formError}
                </div>
              )}

              <footer className="products-form-footer">
                <button
                  type="button"
                  className="products-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="products-submit-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingProduct
                      ? "Save Changes"
                      : "Create Product"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div
          className="products-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setDeleteTarget(null);
            }
          }}
        >
          <section
            className="products-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="products-delete-title"
          >
            <div className="products-delete-icon">!</div>
            <h2 id="products-delete-title">Delete this product?</h2>
            <p>
              You are about to delete{" "}
              <strong>{productName(deleteTarget)}</strong>. This action cannot
              be undone.
            </p>
            <div className="products-delete-actions">
              <button
                type="button"
                className="products-cancel-btn"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Keep Product
              </button>
              <button
                type="button"
                className="products-confirm-delete-btn"
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
