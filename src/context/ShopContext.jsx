
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ShopContext = createContext(null);

export const categories = [
  ["🍎", "Fruits & Vegetables"],
  ["🥛", "Dairy & Breakfast"],
  ["🌾", "Atta, Rice & Dal"],
  ["🫒", "Oil, Ghee & Masala"],
  ["🥨", "Snacks & Beverages"],
  ["🧴", "Personal Care"],
  ["🧼", "Home Care"],
  ["🍼", "Baby Care"],
  ["📦", "Packaged Food"],
  ["🐾", "Pet Care"],
  ["🎁", "Combo Packs"],
];

export const products = [
  // Fruits & Vegetables
  { id: 1, name: "Fresh Tomato", category: "Fruits & Vegetables", weight: "1 kg", price: 24, old: 30, off: 20, image: "photo-1546094096-0df4bcaaa337", type: "deal" },
  { id: 2, name: "Potato", category: "Fruits & Vegetables", weight: "1 kg", price: 28, old: 34, off: 18, image: "photo-1518977676601-b53f82aba655", type: "deal" },
  { id: 3, name: "Onion", category: "Fruits & Vegetables", weight: "1 kg", price: 26, old: 34, off: 23, image: "photo-1508313880080-c4bef0730395", type: "deal" },
  { id: 4, name: "Banana", category: "Fruits & Vegetables", weight: "1 dozen", price: 50, old: 60, off: 16, image: "photo-1571771894821-ce9b6c11b08e", type: "new" },
  { id: 5, name: "Fresh Apples", category: "Fruits & Vegetables", weight: "1 kg", price: 120, old: 150, off: 20, image: "photo-1560806887-1e4cd0b6cbd6", type: "bestseller" },

  // Dairy & Breakfast
  { id: 6, name: "Amul Taaza Milk", category: "Dairy & Breakfast", weight: "1 L", price: 56, old: 62, off: 10, image: "photo-1563636619-e9143da7973b", type: "bestseller" },
  { id: 7, name: "Fresh Curd", category: "Dairy & Breakfast", weight: "400 g", price: 35, old: 40, off: 12, image: "photo-1488477181946-6428a0291777", type: "deal" },
  { id: 8, name: "Butter", category: "Dairy & Breakfast", weight: "100 g", price: 58, old: 65, off: 11, image: "photo-1589985270826-4b7bb135bc9d", type: "bestseller" },
  { id: 9, name: "Cheese Slices", category: "Dairy & Breakfast", weight: "200 g", price: 110, old: 125, off: 12, image: "photo-1486297678162-eb2a19b0a32d", type: "new" },
  { id: 10, name: "Brown Bread", category: "Dairy & Breakfast", weight: "400 g", price: 45, old: 50, off: 10, image: "photo-1509440159596-0249088772ff", type: "deal" },

  // Atta, Rice & Dal
  { id: 11, name: "Aashirvaad Atta", category: "Atta, Rice & Dal", weight: "5 kg", price: 245, old: 279, off: 12, image: "photo-1627485937980-221c88ac04f9", type: "bestseller" },
  { id: 12, name: "Basmati Rice", category: "Atta, Rice & Dal", weight: "1 kg", price: 95, old: 120, off: 21, image: "photo-1586201375761-83865001e31c", type: "deal" },
  { id: 13, name: "Toor Dal", category: "Atta, Rice & Dal", weight: "1 kg", price: 135, old: 155, off: 13, image: "photo-1515543904379-3d757afe72e4", type: "new" },
  { id: 14, name: "Moong Dal", category: "Atta, Rice & Dal", weight: "1 kg", price: 110, old: 130, off: 15, image: "photo-1518977676601-b53f82aba655", type: "deal" },
  { id: 15, name: "Chana Dal", category: "Atta, Rice & Dal", weight: "1 kg", price: 85, old: 100, off: 15, image: "photo-1604335399105-a0c585fd81a1", type: "bestseller" },

  // Oil, Ghee & Masala
  { id: 16, name: "Sunflower Oil", category: "Oil, Ghee & Masala", weight: "1 L", price: 134, old: 158, off: 15, image: "photo-1474979266404-7eaacbcd87c5", type: "deal" },
  { id: 17, name: "Pure Desi Ghee", category: "Oil, Ghee & Masala", weight: "500 ml", price: 290, old: 330, off: 12, image: "photo-1631452180519-c014fe946bc7", type: "bestseller" },
  { id: 18, name: "Turmeric Powder", category: "Oil, Ghee & Masala", weight: "200 g", price: 48, old: 55, off: 13, image: "photo-1615485500704-8e990f9900f4", type: "new" },
  { id: 19, name: "Red Chilli Powder", category: "Oil, Ghee & Masala", weight: "200 g", price: 65, old: 75, off: 13, image: "photo-1596040033229-a9821ebd058d", type: "deal" },
  { id: 20, name: "Garam Masala", category: "Oil, Ghee & Masala", weight: "100 g", price: 70, old: 80, off: 12, image: "photo-1599909533730-f9d3b4a1b4e9", type: "bestseller" },

  // Snacks & Beverages
  { id: 21, name: "Lay's Classic", category: "Snacks & Beverages", weight: "52 g", price: 20, old: 25, off: 20, image: "photo-1566478989037-eec170784d0b", type: "new" },
  { id: 22, name: "Chocolate Cookies", category: "Snacks & Beverages", weight: "200 g", price: 60, old: 75, off: 20, image: "photo-1499636136210-6f4ee915583e", type: "deal" },
  { id: 23, name: "Orange Juice", category: "Snacks & Beverages", weight: "1 L", price: 95, old: 110, off: 13, image: "photo-1600271886742-f049cd451bba", type: "bestseller" },
  { id: 24, name: "Mixed Nuts", category: "Snacks & Beverages", weight: "200 g", price: 180, old: 210, off: 14, image: "photo-1508061253366-f7da158b6d46", type: "new" },
  { id: 25, name: "Potato Wafers", category: "Snacks & Beverages", weight: "100 g", price: 35, old: 40, off: 12, image: "photo-1566478989037-eec170784d0b", type: "deal" },

  // Personal Care
  { id: 26, name: "Face Wash", category: "Personal Care", weight: "100 ml", price: 99, old: 129, off: 23, image: "photo-1556229010-6c3f2c9ca5f8", type: "deal" },
  { id: 27, name: "Shampoo", category: "Personal Care", weight: "180 ml", price: 149, old: 175, off: 15, image: "photo-1608248543803-ba4f8c70ae0b", type: "bestseller" },
  { id: 28, name: "Bath Soap", category: "Personal Care", weight: "Pack of 4", price: 110, old: 125, off: 12, image: "photo-1600857544200-b2f666a9a2ec", type: "new" },
  { id: 29, name: "Toothpaste", category: "Personal Care", weight: "150 g", price: 85, old: 100, off: 15, image: "photo-1609840114035-3c981b782dfe", type: "deal" },
  { id: 30, name: "Body Lotion", category: "Personal Care", weight: "200 ml", price: 175, old: 210, off: 17, image: "photo-1608248543803-ba4f8c70ae0b", type: "bestseller" },

  // Home Care
  { id: 31, name: "Dishwash Liquid", category: "Home Care", weight: "500 ml", price: 99, old: 120, off: 17, image: "photo-1585421514738-01798e348b17", type: "deal" },
  { id: 32, name: "Laundry Detergent", category: "Home Care", weight: "1 kg", price: 115, old: 135, off: 15, image: "photo-1605276374104-dee2a0ed3cd6", type: "bestseller" },
  { id: 33, name: "Floor Cleaner", category: "Home Care", weight: "1 L", price: 120, old: 145, off: 17, image: "photo-1584622650111-993a426fbf0a", type: "new" },
  { id: 34, name: "Toilet Cleaner", category: "Home Care", weight: "500 ml", price: 85, old: 100, off: 15, image: "photo-1563453392212-326f5e854473", type: "deal" },
  { id: 35, name: "Cleaning Sponges", category: "Home Care", weight: "Pack of 3", price: 45, old: 55, off: 18, image: "photo-1583947215259-38e31be8751f", type: "bestseller" },

  // Baby Care
  { id: 36, name: "Baby Diapers", category: "Baby Care", weight: "Pack of 10", price: 199, old: 230, off: 13, image: "photo-1604917877934-07d8d248d396", type: "deal" },
  { id: 37, name: "Baby Wipes", category: "Baby Care", weight: "Pack of 72", price: 99, old: 115, off: 14, image: "photo-1600857544200-b2f666a9a2ec", type: "new" },
  { id: 38, name: "Baby Shampoo", category: "Baby Care", weight: "200 ml", price: 145, old: 170, off: 15, image: "photo-1608248543803-ba4f8c70ae0b", type: "bestseller" },
  { id: 39, name: "Baby Lotion", category: "Baby Care", weight: "200 ml", price: 160, old: 185, off: 14, image: "photo-1556229010-6c3f2c9ca5f8", type: "deal" },
  { id: 40, name: "Baby Powder", category: "Baby Care", weight: "200 g", price: 110, old: 130, off: 15, image: "photo-1608571423902-eed4a5ad8108", type: "new" },

  // Packaged Food
  { id: 41, name: "Instant Noodles", category: "Packaged Food", weight: "Pack of 4", price: 56, old: 64, off: 12, image: "photo-1569718212165-3a8278d5f624", type: "deal" },
  { id: 42, name: "Breakfast Cereal", category: "Packaged Food", weight: "500 g", price: 180, old: 210, off: 14, image: "photo-1517093157656-b9eccef91cb1", type: "bestseller" },
  { id: 43, name: "Peanut Butter", category: "Packaged Food", weight: "340 g", price: 160, old: 190, off: 15, image: "photo-1563805042-7684c019e1cb", type: "new" },
  { id: 44, name: "Tomato Ketchup", category: "Packaged Food", weight: "500 g", price: 95, old: 110, off: 13, image: "photo-1606313564200-e75d5e30476c", type: "deal" },
  { id: 45, name: "Pasta", category: "Packaged Food", weight: "500 g", price: 75, old: 90, off: 16, image: "photo-1551462147-ff29053bfc14", type: "bestseller" },

  // Pet Care
  { id: 46, name: "Dog Food", category: "Pet Care", weight: "1 kg", price: 220, old: 260, off: 15, image: "photo-1589924691995-400dc9ecc119", type: "deal" },
  { id: 47, name: "Cat Food", category: "Pet Care", weight: "1 kg", price: 240, old: 280, off: 14, image: "photo-1514888286974-6c03e2ca1dba", type: "bestseller" },
  { id: 48, name: "Pet Shampoo", category: "Pet Care", weight: "200 ml", price: 180, old: 210, off: 14, image: "photo-1583337130417-3346a1be7dee", type: "new" },
  { id: 49, name: "Dog Treats", category: "Pet Care", weight: "200 g", price: 130, old: 155, off: 16, image: "photo-1582798358481-d199fb7347bb", type: "deal" },
  { id: 50, name: "Pet Feeding Bowl", category: "Pet Care", weight: "1 piece", price: 150, old: 180, off: 17, image: "photo-1583337130417-3346a1be7dee", type: "bestseller" },

  // Combo Packs
  { id: 51, name: "Daily Grocery Combo", category: "Combo Packs", weight: "5 items", price: 299, old: 399, off: 25, image: "photo-1542838132-92c53300491e", type: "deal" },
  { id: 52, name: "Breakfast Combo", category: "Combo Packs", weight: "4 items", price: 249, old: 299, off: 17, image: "photo-1533089860892-a7c6f0a88666", type: "bestseller" },
  { id: 53, name: "Snacks Party Combo", category: "Combo Packs", weight: "6 items", price: 199, old: 249, off: 20, image: "photo-1621937081930-5e3f5d4b6b0f", type: "new" },
  { id: 54, name: "Personal Care Combo", category: "Combo Packs", weight: "4 items", price: 349, old: 449, off: 22, image: "photo-1608248543803-ba4f8c70ae0b", type: "deal" },
  { id: 55, name: "Family Essentials Combo", category: "Combo Packs", weight: "7 items", price: 499, old: 599, off: 17, image: "photo-1586201375761-83865001e31c", type: "bestseller" },
];

export const photo = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=500&q=85`;

// Safe localStorage reader
function readStorage(key) {
  try {
    const saved = localStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Could not read ${key}:`, error);
    return [];
  }
}

export function ShopProvider({ children }) {
  const [cart, setCart] = useState(() => readStorage("freshcart_cart"));
  const [wishlist, setWishlist] = useState(() =>
    readStorage("freshcart_wishlist")
  );

  // Save cart whenever items or quantities change
  useEffect(() => {
    try {
      localStorage.setItem("freshcart_cart", JSON.stringify(cart));
    } catch (error) {
      console.error("Could not save cart:", error);
    }
  }, [cart]);

  // Save wishlist whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        "freshcart_wishlist",
        JSON.stringify(wishlist)
      );
    } catch (error) {
      console.error("Could not save wishlist:", error);
    }
  }, [wishlist]);

  const addToCart = (product) => {
    setCart((old) => {
      const found = old.find((item) => item.id === product.id);

      if (found) {
        return old.map((item) =>
          item.id === product.id
            ? { ...item, qty: Number(item.qty || 1) + 1 }
            : item
        );
      }

      return [...old, { ...product, qty: 1 }];
    });
  };

  const changeQty = (id, delta) => {
    setCart((old) =>
      old
        .map((item) =>
          item.id === id
            ? {
                ...item,
                qty: Math.max(0, Number(item.qty || 1) + delta),
              }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((old) => old.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (product) => {
    setWishlist((old) =>
      old.some((item) => item.id === product.id)
        ? old.filter((item) => item.id !== product.id)
        : [...old, product]
    );
  };

  const value = useMemo(
    () => ({
      products,
      categories,
      cart,
      wishlist,
      addToCart,
      changeQty,
      removeFromCart,
      clearCart,
      toggleWishlist,
    }),
    [cart, wishlist]
  );

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
}

export const useShop = () => useContext(ShopContext);
