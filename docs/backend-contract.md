# FOOD4ALL Backend Contract

Status: planning contract only. This document does not implement backend, database, route handlers, network calls, or persistence beyond the existing temporary frontend `localStorage` layer for auth/session/cart.

## Recommended Architecture

Use Next.js route handlers under `app/api/**/route.ts` for the first backend implementation.

Recommended stack:

- Runtime: Next.js route handlers in the existing app.
- ORM: Prisma.
- Local database: SQLite for fast local development.
- Production database: PostgreSQL-ready Prisma schema.
- Password hashing: bcrypt or a compatible strong password hashing library.
- Session strategy: server-managed opaque session IDs stored in an HTTP-only, secure, same-site cookie, backed by a `Session` table.
- Image uploads: deferred. Store `imageUrl` as a string first; later replace it with object storage such as S3/R2/Vercel Blob.

Why this fits the repo:

- The app is already a Next.js React project, so route handlers avoid adding a separate server framework.
- The frontend already has typed service modules under `lib/services/`; those can later swap their mock implementations for calls to route handlers.
- Prisma gives a single schema for SQLite development and PostgreSQL production.
- Server-owned opaque sessions are easier to revoke than stateless JWTs and avoid storing tokens in frontend state.
- The current mock/local app state can remain intact during migration while endpoints are implemented one service at a time.

## Current Boundary

Current frontend services are mock-only:

- `lib/services/auth-service.ts`
- `lib/services/product-service.ts`
- `lib/services/category-service.ts`
- `lib/services/cart-service.ts`
- `lib/services/order-service.ts`
- `lib/services/seller-service.ts`

Task 014 does not replace these services. The next backend implementation task should add route handlers and tests first, then migrate service modules only after API behavior is verified.

## Shared API Rules

All JSON responses should use one envelope.

Success:

```ts
{
  ok: true,
  data: unknown
}
```

Error:

```ts
{
  ok: false,
  error: {
    code:
      | "BAD_REQUEST"
      | "UNAUTHENTICATED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "CONFLICT"
      | "VALIDATION_ERROR"
      | "SERVER_ERROR",
    message: string,
    fieldErrors?: Record<string, string>
  }
}
```

General status code mapping:

- `200` for successful reads and updates.
- `201` for successful creation.
- `204` only for empty successful deletes if the route does not use the response envelope.
- `400` for malformed requests.
- `401` for missing or invalid session.
- `403` for authenticated users without the required role or ownership.
- `404` for missing resources.
- `409` for conflicts such as duplicate email or invalid order transition.
- `422` for validation errors.
- `500` for unexpected server failures.

Dates should be ISO-8601 strings in API responses. Prices should remain numeric pesos in the frontend contract for now to match existing types; the database should store integer cents to avoid rounding drift.

## TypeScript Contract

`lib/api-contracts.ts` contains request/response DTO types only. It must not make API calls, import backend code, or replace current services.

Key exported contracts:

- `ApiResponse<T>`, `ApiSuccessResponse<T>`, `ApiErrorResponse`
- `ApiEndpoint`
- `ApiUser`, `ApiSellerProfile`, `ApiCategory`, `ApiProduct`, `ApiCartItem`, `ApiOrder`, `ApiOrderItem`
- Auth request/response types
- Product, category, cart, order, pickup, seller dashboard/report/profile request/response types

Because it is type-only, no contract tests are required in Task 014.

## API Endpoints

### Auth

#### POST `/api/auth/register`

Public. Creates a user and optionally assigns an initial role.

Request:

```ts
{
  firstName: string
  lastName: string
  phone?: string
  email: string
  password: string
  role?: "buyer" | "seller"
}
```

Response:

```ts
{
  ok: true,
  data: { user: ApiUser }
}
```

Validation:

- `firstName`, `lastName`, `email`, and `password` are required.
- Email must be normalized to lowercase and unique.
- Password must meet the frontend minimum of 8 characters initially; strengthen later if needed.
- Password must be stored only as `passwordHash`.
- Response must never include password or `passwordHash`.

#### POST `/api/auth/login`

Public. Creates a server session and sets an HTTP-only cookie.

Request:

```ts
{
  email: string
  password: string
}
```

Response:

```ts
{
  ok: true,
  data: { user: ApiUser }
}
```

Validation:

- Return generic invalid credentials errors.
- Do not reveal whether email or password failed.
- Do not return session IDs or tokens in JSON.

#### POST `/api/auth/logout`

Authenticated. Revokes the current session and clears the session cookie.

Request: empty JSON body or no body.

Response:

```ts
{
  ok: true,
  data: { loggedOut: true }
}
```

#### GET `/api/auth/me`

Public-safe. Returns the current user if a valid session exists.

Response:

```ts
{
  ok: true,
  data: { user: ApiUser | null }
}
```

#### PATCH `/api/auth/role`

Authenticated. Recommended addition to support the current role-selection flow.

Request:

```ts
{
  role: "buyer" | "seller"
}
```

Response:

```ts
{
  ok: true,
  data: { user: ApiUser }
}
```

Rules:

- A buyer role can be selected directly.
- A seller role should create or require a `SellerProfile`.
- If later business verification is required, allow seller onboarding but gate product publishing until verified.

### Products

#### GET `/api/products`

Public. Lists active products.

Query:

```ts
{
  search?: string
  categoryId?: string
  sellerId?: string
  maxDaysUntilExpiry?: number
  featured?: boolean
  hot?: boolean
  page?: number
  pageSize?: number
}
```

Response:

```ts
{
  ok: true,
  data: {
    products: ApiProduct[]
    pagination: { page: number; pageSize: number; total: number }
  }
}
```

Rules:

- Only return `active` products with stock greater than 0 by default.
- Expired or removed products should not appear in public listings.
- Search should match name, brand, seller, category, and barangay.

#### GET `/api/products/:id`

Public. Returns one active product.

Response:

```ts
{
  ok: true,
  data: { product: ApiProduct }
}
```

Rules:

- Return `404` for missing, removed, or non-public products.

#### POST `/api/seller/products`

Seller-only. Creates a product owned by the current seller.

Request:

```ts
{
  name: string
  brand: string
  categoryId: string
  originalPrice: number
  discountedPrice: number
  quantity: number
  unit: string
  expiryDate: string
  pickupAddress: string
  pickupHours: string
  description: string
  weight: string
  packSize: string
  imageUrl?: string
}
```

Response:

```ts
{
  ok: true,
  data: { product: ApiProduct }
}
```

Validation:

- Product name is required.
- Category is required and must exist.
- Original and discounted prices must be positive.
- Discount percentage must be 0 through 100.
- Quantity must be a non-negative whole number.
- Expiry date is required and must be a valid date.
- Seller must own the created product.

#### PATCH `/api/seller/products/:id`

Seller-only and owner-only. Updates an existing product.

Request: partial `SellerProductRequest`.

Response:

```ts
{
  ok: true,
  data: { product: ApiProduct }
}
```

Rules:

- Only the seller who owns the product can update it.
- Disallow changing `sellerId`.
- Recalculate discount fields after price changes.

#### DELETE `/api/seller/products/:id`

Seller-only and owner-only. Soft-removes a product.

Response:

```ts
{
  ok: true,
  data: { product: ApiProduct }
}
```

Rules:

- Prefer soft delete with `status = "removed"` to preserve order history.

### Categories

#### GET `/api/categories`

Public. Lists categories.

Response:

```ts
{
  ok: true,
  data: { categories: ApiCategory[] }
}
```

Rules:

- Sort by `sortOrder`, then label.

### Cart

Cart routes are buyer-only. Cart belongs to the authenticated buyer and must not expose another user's cart.

#### GET `/api/cart`

Response:

```ts
{
  ok: true,
  data: { items: ApiCartItem[] }
}
```

#### POST `/api/cart/items`

Request:

```ts
{
  productId: string
  quantity: number
}
```

Response:

```ts
{
  ok: true,
  data: { items: ApiCartItem[] }
}
```

Rules:

- Product must exist and be active.
- Quantity must be a positive whole number.
- Adding an existing product increments quantity.
- Quantity must not exceed available stock.

#### PATCH `/api/cart/items/:productId`

Request:

```ts
{
  quantity: number
}
```

Response:

```ts
{
  ok: true,
  data: { items: ApiCartItem[] }
}
```

Rules:

- Quantity `0` may remove the item, or callers can use DELETE.
- Quantity must not exceed available stock.

#### DELETE `/api/cart/items/:productId`

Response:

```ts
{
  ok: true,
  data: { items: ApiCartItem[] }
}
```

#### DELETE `/api/cart`

Clears the buyer cart.

Response:

```ts
{
  ok: true,
  data: { items: [] }
}
```

### Orders

#### POST `/api/orders`

Buyer-only. Creates an order from current cart items.

Request:

```ts
{
  pickupDate: string
  pickupTime: string
}
```

Response:

```ts
{
  ok: true,
  data: { order: ApiOrder }
}
```

Rules:

- Cart must not be empty.
- All products must still be active and in stock.
- Order creation must decrement product stock atomically.
- Store price snapshots on `OrderItem`.
- Generate a pickup code after order creation.
- Clear cart after successful order creation.

#### GET `/api/orders`

Buyer-only. Lists current buyer orders.

Response:

```ts
{
  ok: true,
  data: { orders: ApiOrder[] }
}
```

Rules:

- Buyer can only see their own orders.

#### GET `/api/seller/orders`

Seller-only. Lists orders containing the seller's products.

Response:

```ts
{
  ok: true,
  data: { orders: ApiOrder[] }
}
```

Rules:

- Seller can only see orders for their own seller profile.

#### PATCH `/api/seller/orders/:id/status`

Seller-only and seller-order-only. Updates order status.

Request:

```ts
{
  status: "preparing" | "ready" | "completed" | "cancelled"
}
```

Response:

```ts
{
  ok: true,
  data: { order: ApiOrder }
}
```

Rules:

- Allowed transitions:
  - `reserved` to `preparing`
  - `reserved` to `ready`
  - `preparing` to `ready`
  - `ready` to `completed`
  - `reserved`, `preparing`, or `ready` to `cancelled`
- Completed and cancelled orders are terminal.
- Cancelling should restock items unless stock policy says otherwise.

### Pickup

#### POST `/api/pickup/verify`

Seller-only. Verifies a buyer pickup code.

Request:

```ts
{
  code: string
}
```

Response:

```ts
{
  ok: true,
  data: {
    code: string
    orderId?: string
    status: "valid" | "invalid"
    message: string
  }
}
```

Rules:

- Normalize code by trimming and uppercasing.
- Seller can only verify pickup codes for their own orders.
- Valid pickup should mark the order completed or return enough data for a follow-up status update.
- Invalid pickup should return `ok: true` with `status: "invalid"` unless the request itself is malformed.
- Store verification timestamp and seller user id.

### Seller

#### GET `/api/seller/dashboard`

Seller-only. Returns dashboard metrics and pending/expiring products.

Response:

```ts
{
  ok: true,
  data: { dashboard: SellerDashboard }
}
```

#### GET `/api/seller/reports`

Seller-only. Returns report metrics.

Response:

```ts
{
  ok: true,
  data: {
    revenue: {
      weekly: number
      totalOrders: number
      recoveryEarnings: number
    }
    waste: {
      reducedKg: number
      mealsSavedEstimate: number
    }
    topProducts: ApiProduct[]
  }
}
```

#### GET `/api/seller/profile`

Seller-only. Returns current seller profile.

Response:

```ts
{
  ok: true,
  data: { seller: ApiSellerProfile }
}
```

#### PATCH `/api/seller/profile`

Seller-only. Updates seller profile.

Request:

```ts
{
  businessName?: string
  address?: string
  barangay?: string
  contactNumber?: string
  isOpen?: boolean
}
```

Response:

```ts
{
  ok: true,
  data: { seller: ApiSellerProfile }
}
```

Rules:

- Seller can update only their own profile.
- `verificationStatus` should not be user-editable.

## Database Model Contract

Use string IDs. `cuid` or UUID is acceptable. Use timestamps on every persisted entity.

### User

Fields:

- `id`
- `email` unique, normalized lowercase
- `passwordHash`
- `name`
- `phone`
- `role`: `buyer`, `seller`, or null until role selection
- `createdAt`
- `updatedAt`
- `deletedAt` optional soft-delete field

Relationships:

- One optional `SellerProfile`
- Many `CartItem`
- Many buyer `Order`
- Many `Session`

### Session

Recommended support model for opaque cookie sessions.

Fields:

- `id`
- `userId`
- `sessionHash`
- `expiresAt`
- `createdAt`
- `revokedAt`

Relationships:

- Belongs to `User`

Rules:

- Store only a hashed session secret.
- Set session ID/secret in an HTTP-only, secure, same-site cookie.
- Rotate or revoke on logout.

### SellerProfile

Fields:

- `id`
- `userId` unique
- `businessName`
- `address`
- `barangay`
- `contactNumber`
- `rating`
- `isOpen`
- `verificationStatus`: `pending`, `verified`, `rejected`
- `createdAt`
- `updatedAt`

Relationships:

- Belongs to `User`
- Has many `Product`
- Has many seller-side `Order`

### Category

Fields:

- `id`
- `slug` unique
- `label`
- `icon`
- `color`
- `sortOrder`
- `createdAt`
- `updatedAt`

Relationships:

- Has many `Product`

### Product

Fields:

- `id`
- `sellerId`
- `categoryId`
- `name`
- `brand`
- `originalPriceCents`
- `discountedPriceCents`
- `discountPercent`
- `imageUrl`
- `stockQuantity`
- `unit`
- `expiryDate`
- `daysUntilExpiry` as computed response value, not required as stored data
- `pickupAddress`
- `pickupBarangay`
- `pickupHours`
- `description`
- `weight`
- `packSize`
- `isHot`
- `isFeatured`
- `status`: `draft`, `active`, `sold_out`, `expired`, `removed`
- `createdAt`
- `updatedAt`

Relationships:

- Belongs to `SellerProfile`
- Belongs to `Category`
- Has many `CartItem`
- Has many `OrderItem`
- Has many optional `ProductImage`

Rules:

- `discountPercent` should be calculated from prices.
- Stock changes must be transactional when orders are created or cancelled.
- Removed products remain available for historical order snapshots.

### ProductImage (Optional)

Fields:

- `id`
- `productId`
- `url`
- `alt`
- `sortOrder`
- `createdAt`
- `updatedAt`

Relationships:

- Belongs to `Product`

### CartItem

Fields:

- `id`
- `userId`
- `productId`
- `quantity`
- `createdAt`
- `updatedAt`

Relationships:

- Belongs to `User`
- Belongs to `Product`

Constraints:

- Unique pair: `userId`, `productId`

### Order

Fields:

- `id`
- `buyerId`
- `sellerId`
- `status`: `reserved`, `preparing`, `ready`, `completed`, `cancelled`
- `totalCents`
- `pickupDate`
- `pickupTime`
- `pickupCodeId`
- `createdAt`
- `updatedAt`
- `completedAt`
- `cancelledAt`

Relationships:

- Belongs to buyer `User`
- Belongs to `SellerProfile`
- Has many `OrderItem`
- Has one `PickupCode`

Rules:

- Start with one seller per order. If cart has multiple sellers, either reject checkout or split into multiple orders.
- Keep `OrderItem` snapshots so future product edits do not change historical orders.

### OrderItem

Fields:

- `id`
- `orderId`
- `productId`
- `productName`
- `quantity`
- `unitPriceCents`
- `originalUnitPriceCents`
- `subtotalCents`
- `createdAt`

Relationships:

- Belongs to `Order`
- Optionally references `Product`

### PickupCode / PickupVerification

Fields:

- `id`
- `orderId` unique
- `codeHash`
- `displayCodeLast4` optional
- `expiresAt`
- `verifiedAt`
- `verifiedBySellerUserId`
- `createdAt`
- `updatedAt`

Relationships:

- Belongs to `Order`

Rules:

- Prefer storing a hash of the pickup code.
- Compare normalized submitted code against the stored hash.
- A code can be verified once.

## Role and Access Rules

Public routes:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/categories`

Authenticated routes:

- `POST /api/auth/logout`
- `PATCH /api/auth/role`

Buyer-only routes:

- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:productId`
- `DELETE /api/cart/items/:productId`
- `DELETE /api/cart`
- `POST /api/orders`
- `GET /api/orders`

Seller-only routes:

- `POST /api/seller/products`
- `PATCH /api/seller/products/:id`
- `DELETE /api/seller/products/:id`
- `GET /api/seller/orders`
- `PATCH /api/seller/orders/:id/status`
- `POST /api/pickup/verify`
- `GET /api/seller/dashboard`
- `GET /api/seller/reports`
- `GET /api/seller/profile`
- `PATCH /api/seller/profile`

Owner-only rules:

- Sellers can mutate only their own products.
- Sellers can view and update only orders for their own seller profile.
- Buyers can view only their own cart and orders.
- Pickup verification is allowed only for seller-owned orders.

## Validation Rules

Auth:

- Normalize email.
- Require unique email.
- Hash password with bcrypt or equivalent.
- Never return password hash.

Product:

- Required: name, category, original price, discounted price, expiry date.
- Prices must be positive.
- Discount must be between 0 and 100.
- Quantity must be a non-negative whole number.
- Expiry date must be a valid date.
- Seller profile must exist.

Cart:

- Product must be active.
- Quantity must be a positive whole number for add.
- Quantity must be non-negative for update.
- Quantity must not exceed stock.

Order:

- Cart must not be empty.
- Product stock must be checked transactionally.
- Order status transitions must be explicit.
- Completed and cancelled orders are terminal.

Seller profile:

- Business name, address, and contact number are required before publishing products.
- Verification status is server-controlled.

Pickup:

- Code is required.
- Normalize code before comparison.
- Store verification event.
- Reject repeat verification of completed orders.

## Migration Plan From Mock Services

Phase 1: Backend foundation

- Install backend dependencies in a future task only.
- Add Prisma schema and migrations.
- Add route handler test setup.
- Implement session helpers and password hashing.
- Seed categories and sample products.

Phase 2: Auth and role selection

- Implement auth route handlers.
- Migrate `auth-service.ts` or app-state auth operations from local mock helpers to API-backed behavior.
- Keep temporary localStorage only as a short-lived UI cache if still needed.

Phase 3: Products and categories

- Implement product and category route handlers.
- Replace product/category mock service reads.
- Keep `lib/types.ts` and `lib/api-contracts.ts` aligned.

Phase 4: Cart and checkout

- Implement cart route handlers.
- Replace temporary cart `localStorage` persistence with API-backed cart state.
- Implement order creation from cart in a database transaction.

Phase 5: Seller workflows

- Implement seller product mutation routes.
- Implement seller orders, pickup verification, dashboard, reports, and profile routes.
- Replace seller mock services one module at a time.

Phase 6: Hardening

- Add API integration tests and browser/e2e tests.
- Add authorization regression tests.
- Add production database setup.
- Add image upload storage.
- Add rate limiting and audit logging for auth and pickup verification.

## Non-Goals For Task 014

- No backend route handlers.
- No database schema or migrations.
- No Prisma install.
- No auth library install.
- No password hashing implementation.
- No network calls from frontend services.
- No product/order persistence.
- No UI redesign.
