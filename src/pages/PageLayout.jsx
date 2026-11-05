
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { products } from "../context/ShopContext";
import ProductCard from "../components/ProductCard";
import "./Pages.css";

export default function PageLayout({ title, mode = "all" }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const query = (params.get("q") || "").toLowerCase();
  const category = params.get("category") || "";

  const list = useMemo(
    () =>
      products.filter((p) => {
        const matchesSearch =
          !query ||
          `${p.name} ${p.category}`.toLowerCase().includes(query);

        const matchesCategory =
          !category || p.category === category;

        const matchesDeals =
          mode !== "deals" || p.type === "deal" || p.off >= 15;

        const matchesNew =
          mode !== "new" || p.type === "new";

        const matchesBest =
          mode !== "best" || p.type === "bestseller";

        const matchesCombo =
          mode !== "combo" || p.category === "Combo Packs";

        return (
          matchesSearch &&
          matchesCategory &&
          matchesDeals &&
          matchesNew &&
          matchesBest &&
          matchesCombo
        );
      }),
    [query, category, mode]
  );

  return (
    <section className="page-content">
      <div className="page-heading">
        <div>
          <h1>{title}</h1>

          {category && <p>Category: {category}</p>}

          {query && <p>Search results for “{query}”</p>}
        </div>

        <span>{list.length} products</span>
      </div>

      {list.length > 0 ? (
        <div className="product-grid">
          {list.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No products found</h2>
          <p>Try another category or search term.</p>
        </div>
      )}
    </section>
  );
}
