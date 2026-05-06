# FOOD4ALL

A Next.js-based food marketplace platform with buyer and seller functionality, powered by Prisma and SQLite.

## Tech Stack

- **Runtime**: Next.js 16 with TypeScript
- **Frontend**: React 19 with Tailwind CSS
- **Backend**: Next.js Route Handlers (API Routes)
- **ORM**: Prisma 7.8
- **Local Database**: SQLite via better-sqlite3
- **Production Database**: PostgreSQL (Prisma schema is production-ready)
- **Authentication**: Server-managed sessions with bcrypt password hashing
- **Validation**: Zod for request/response validation
- **Testing**: Vitest
- **Package Manager**: pnpm with corepack

## Project Structure

```
app/              # Next.js app router
├── api/          # Backend API routes
├── layout.tsx    # Root layout
├── page.tsx      # Home page
└── globals.css   # Global styles

components/       # React components
├── food4all/     # FOOD4ALL-specific components
├── ui/           # Reusable UI components
└── screens/      # Page-level screens

lib/              # Shared utilities and types
├── api/          # API request/response helpers
├── generated/    # Prisma client (auto-generated)
├── services/     # Service modules (some SQL-backed)
├── api-contracts.ts  # TypeScript API contracts
├── types.ts      # Shared types
└── prisma.ts     # Prisma client singleton

prisma/           # Database schema and migrations
├── schema.prisma # Database schema
└── seed.ts       # Seed script

styles/           # Global styles
hooks/            # Custom React hooks
public/           # Static assets
test/             # Test utilities
```

## Installation

### Prerequisites

- Node.js 18+ with corepack enabled
- pnpm (via corepack)

### Setup

```bash
# Install dependencies
corepack pnpm install

# Generate Prisma client
corepack pnpm prisma:generate

# Validate Prisma schema
corepack pnpm prisma:validate

# Optional: Seed test data
corepack pnpm prisma:seed
```

## Development

### Start Development Server

```bash
corepack pnpm dev
```

The app will be available at `http://localhost:3000`.

### Database Management

```bash
# Generate Prisma client after schema changes
corepack pnpm prisma:generate

# Run migrations
corepack pnpm prisma:migrate

# Seed initial data
corepack pnpm prisma:seed

# Reset database (deletes all data, runs migrations, seeds)
corepack pnpm db:reset
```

## Building and Deployment

### Production Build

```bash
corepack pnpm build
```

### Start Production Server

```bash
corepack pnpm start
```

### Code Quality

```bash
# Run type checking
corepack pnpm typecheck

# Run linting
corepack pnpm lint

# Run all tests
corepack pnpm test
```

## Demo & Presentation

A structured walkthrough for demonstrating the application's key features can be found in the [Demo Script](docs/demo-script.md). The application is optimized for an **Android-first mobile experience** via Chrome.

## API Features

### Implemented Features (SQL-Backed)

- **Authentication**: Register, login, logout, session management, role selection
- **Products**: Browse products, search by category, view product details
- **Categories**: View product categories
- **Cart**: Add/remove items, manage quantities, persist cart state
- **Orders**: Place orders, view order history, track order status
- **Buyer Checkout**: Complete order placement with pickup date/time
- **Order Pickup**: QR code generation and verification for pickup
- **Seller Dashboard**: View sales metrics and revenue
- **Seller Products**: Create, update, list, and delete products
- **Seller Orders**: View orders, update order status, manage pickup verification
- **Seller Profile**: View profile information (partial SQL-backing)
- **Seller Reports**: Generate sales reports (basic/fallback values)

### Partially Implemented Features

- **Buyer Profile**: Basic SQL storage; full profile customization is presentation-only
- **Seller Profile Stats**: Some stats use neutral fallback values (not derived from actual data)
- **Seller Business Hours**: Stored in schema but not fully implemented in UI
- **Seller Waste Reports**: Reports return neutral fallback values pending business logic
- **Seller Meal Count**: Reports return neutral fallback values pending business logic

### Not Yet Implemented

- **Image Upload**: Endpoint structure exists; file upload backend is not finalized
- **Payment Processing**: Checkout flow is order placement only; no payment gateway integration
- **Notifications**: Real-time notifications are not implemented
- **Reviews/Ratings**: Customer review system is not implemented
- **Advanced Search**: Full-text search beyond category filtering
- **Wishlist**: Product wishlist feature
- **Multi-Language Support**: Currently English only
- **Production Database Migration**: Database setup automation for PostgreSQL is not finalized

## Testing

The project includes comprehensive tests for backend API routes and service logic.

```bash
# Run all tests
corepack pnpm test

# Run tests in watch mode
corepack pnpm test -- --watch

# Run specific test file
corepack pnpm test -- backend-routes.test.ts
```

Test coverage includes:
- Authentication flows (register, login, logout, role selection)
- Product operations (list, detail, search)
- Cart management (add, remove, update)
- Order creation and status management
- Seller operations (product management, order handling)
- Pickup verification flow
- Validation and error handling

## Database Schema

The application uses Prisma ORM with the following core models:

- **User**: Stores user account information, email, passwordHash, role
- **Session**: Server-managed session tokens for authentication
- **SellerProfile**: Extended profile for seller accounts
- **Category**: Product categories with icons and colors
- **Product**: Product listings with pricing, stock, and expiry tracking
- **CartItem**: Shopping cart items per user
- **Order**: Customer orders with status tracking
- **OrderItem**: Line items in orders with price snapshots
- **PickupCode**: QR codes for order pickup verification

See [prisma/schema.prisma](prisma/schema.prisma) for the complete schema.

## Security

- Passwords are hashed with bcrypt before storage
- Sessions use HTTP-only, secure, same-site cookies
- CSRF protection via Next.js built-in mechanisms
- Input validation on all API endpoints
- Role-based access control (buyer/seller)

## Contributing

Before committing:

1. Ensure all tests pass: `corepack pnpm test`
2. Ensure no lint errors: `corepack pnpm lint`
3. Ensure type safety: `corepack pnpm typecheck`
4. Ensure build succeeds: `corepack pnpm build`

## Production Deployment

The application is designed to work with PostgreSQL in production while using SQLite in development.

### For PostgreSQL

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Set the `DATABASE_URL` environment variable to your PostgreSQL connection string.

Run migrations:

```bash
corepack pnpm prisma:migrate
```

## Troubleshooting

### Prisma Generate Issues

If you encounter Prisma client issues, regenerate it:

```bash
corepack pnpm prisma:generate
```

### Database Corruption

To reset the local database:

```bash
corepack pnpm db:reset
```

### Session Errors

Clear browser cookies and restart the development server if session issues occur.

## License

Proprietary. All rights reserved.
