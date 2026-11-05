# FreshCart Backend

Node.js + Express + MySQL REST API for the FreshCart React/Vite storefront.

## Requirements
- Node.js 18 or newer
- MySQL 8+
- Your React app runs at `http://localhost:5173` by default

## Setup (Windows PowerShell)

1. Extract this folder.
2. Open PowerShell in the `freshcart-backend` folder.
3. Install dependencies:

   ```powershell
   npm install
   ```

4. Create your database using MySQL Workbench or command line:

   ```powershell
   mysql -u root -p < db/schema.sql
   ```

   Alternatively open `db/schema.sql` in MySQL Workbench and execute it.

5. Create `.env` from `.env.example`, then put your actual MySQL password and a long random JWT secret in it. Never upload `.env` to GitHub.

6. Seed the 55 catalogue records:

   ```powershell
   npm run seed
   ```

   Add matching image files under your React app's `public/images/` folder. Example: `/images/potato-wafers.jpg`. The seed script sets paths but does not download images.

7. Start the API:

   ```powershell
   npm run dev
   ```

8. Test:
   - `http://localhost:5000/`
   - `http://localhost:5000/api/health`
   - `http://localhost:5000/api/products`

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API and DB health |
| GET | `/api/products` | Product list |
| GET | `/api/products?category=Pet%20Care` | Filter by category |
| GET | `/api/products?search=soap` | Search products |
| GET | `/api/products/:id` | Single product |
| GET | `/api/categories` | Categories from DB |
| POST | `/api/auth/register` | Create customer account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Current user (`Authorization: Bearer TOKEN`) |
| POST | `/api/products` | Admin: create product, optional `imageFile` upload |
| PUT | `/api/products/:id` | Admin: update product, optional `imageFile` upload |
| DELETE | `/api/products/:id` | Admin: delete product |
| POST | `/api/orders` | Place order with customer details and item IDs/quantities |
| GET | `/api/orders` | Customer's orders or all orders for admin |
| PATCH | `/api/orders/:id/status` | Admin: update order status |

## Make the first admin

Register an account through `/api/auth/register`, then promote that account in MySQL Workbench:

```sql
USE freshcart;
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

Log in again to receive a token with the admin role. Do not expose admin tokens or your `.env`.

## Frontend connection

Create `src/config.js` in React:

```js
export const API_BASE_URL = "http://localhost:5000/api";
```

Example product fetch:

```js
import { API_BASE_URL } from "./config";

const response = await fetch(`${API_BASE_URL}/products`);
const data = await response.json();
const products = data.products;
```

Product images stored as `/uploads/...` should be displayed using the backend origin (`http://localhost:5000`) plus the image path. For frontend public images such as `/images/potato-wafers.jpg`, use the path directly.

## Notes
- This is a starter backend, not yet connected to your existing frontend components automatically.
- For production deployment, use a managed database, HTTPS, a strong secret, and persistent object storage for uploaded images. Local `uploads/` files may not persist on some hosting platforms.
- Order creation recalculates totals from database prices and checks stock. Payment processing is not included.
