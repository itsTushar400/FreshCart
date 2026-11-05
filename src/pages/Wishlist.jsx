import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import ProductCard from "../components/ProductCard";
import "./Pages.css";
export default function Wishlist(){const {wishlist}=useShop();return <section className="page-content"><div className="page-heading"><h1>My Wishlist</h1><span>{wishlist.length} saved</span></div>{wishlist.length?<div className="product-grid">{wishlist.map(p=><ProductCard key={p.id} product={p}/>)}</div>:<div className="empty-state"><h2>Your wishlist is empty</h2><p>Tap the heart on any product to save it here.</p><Link className="primary-link" to="/shop">Explore Products</Link></div>}</section>}