
import { useShop } from "../context/ShopContext";
import "./ProductCard.css";

export default function ProductCard({ product }) {
  const {
    cart,
    addToCart,
    changeQty,
    wishlist,
    toggleWishlist,
  } = useShop();

  const saved = wishlist.some(
    (item) => item.id === product.id
  );

  const cartItem = cart.find(
    (item) => item.id === product.id
  );

  const quantity = cartItem ? cartItem.qty : 0;

  return (
    <article className="product-card">
      <span className="discount">{product.off}% OFF</span>

      <button
        type="button"
        className={`wish-btn ${saved ? "is-saved" : ""}`}
        aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={saved}
        onClick={() => toggleWishlist(product)}
      >
        {saved ? "♥" : "♡"}
      </button>

      <div className="product-image-wrap">
        <img
          className="product-image"
          src={`https://images.unsplash.com/${product.image}?auto=format&fit=crop&w=500&q=85`}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.visibility = "hidden";
          }}
        />
      </div>

      <div className="product-info">
        <h3>{product.name}</h3>
        <p>{product.weight}</p>

        <div className="price">
          ₹{product.price}
          <del>₹{product.old}</del>
        </div>

        {quantity === 0 ? (
          <button
            type="button"
            className="add-to-cart"
            onClick={() => addToCart(product)}
          >
            Add to Cart
          </button>
        ) : (
          <div className="quantity-control">
            <button
              type="button"
              className="qty-btn qty-minus"
              aria-label={`Decrease ${product.name} quantity`}
              onClick={() => changeQty(product.id, -1)}
            >
              −
            </button>

            <span className="qty-value" aria-live="polite">
              {quantity}
            </span>

            <button
              type="button"
              className="qty-btn qty-plus"
              aria-label={`Increase ${product.name} quantity`}
              onClick={() => changeQty(product.id, 1)}
            >
              +
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
