import { Link } from "react-router-dom";
import { categories, photo } from "../context/ShopContext";
import { products } from "../context/ShopContext";
import ProductCard from "../components/ProductCard";
import heroImage from "../assets/grocery-hero.png";
import "./Home.css";
const categoryImages=[
 "photo-1540420773420-3366772f4999","photo-1563636619-e9143da7973b","photo-1586201375761-83865001e31c","photo-1474979266404-7eaacbcd87c5","photo-1566478989037-eec170784d0b","photo-1608248543803-ba4f8c70ae0b","photo-1585421514738-01798e348b17","photo-1604917877934-07d8d248d396","photo-1542838132-92c53300491e","photo-1450778869180-41d0601e046e"
];
export default function Home(){
 return <>
 <section className="hero"><img className="hero-image" src={heroImage} alt="Fresh fruits and vegetables"/><div className="hero-copy"><p>🌿 <span>Fresh &amp; Healthy</span></p><h1>Fresh Groceries<br/>Delivered to Your Home</h1><div>Get fresh fruits, vegetables, groceries and daily essentials<br className="desktop-break"/> at the best prices.</div><Link className="hero-button" to="/shop">Shop Now →</Link></div><div className="offer-burst">Upto<strong>50%</strong>OFF</div></section>
 <section className="benefits">{[["♧","Free Delivery","On orders above ₹299"],["♢","Secure Payment","100% safe & secure"],["％","Best Offers","Save more every day"],["♧","Fresh Products","Direct from farmers"],["♧","24/7 Support","We are here to help"]].map(([icon,title,text])=><div className="benefit" key={title}><span>{icon}</span><div><strong>{title}</strong><small>{text}</small></div></div>)}</section>
 <section className="home-section"><div className="section-heading"><h2>Shop by Category</h2><Link to="/categories">View All →</Link></div><div className="category-grid">{categories.map(([emoji,name],i)=><Link className="category-card" key={name} to={`/shop?category=${encodeURIComponent(name)}`}><img src={photo(categoryImages[i])} alt={name} onError={e=>e.currentTarget.style.visibility="hidden"}/><strong>{name}</strong></Link>)}</div></section>
 <section className="home-section"><div className="section-heading"><h2>Today’s Best Deals</h2><Link to="/deals">View All →</Link></div><div className="product-grid">{products.filter(p=>p.type==="deal"||p.off>=15).map(p=><ProductCard key={p.id} product={p}/>)}</div></section>
 </>;
}
