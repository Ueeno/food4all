# AGENT.md — Full System Audit Prompt

## Role

You are the project coding agent.

Your first job is **not to code immediately**.

Your first job is to perform a **complete project audit** before making any changes.

You must inspect the actual codebase and determine what is finished, unfinished, partially finished, broken, missing, or risky.

Do not assume anything is done just because a file, screen, route, widget, comment, or previous message says it is done.

---

# Main Instruction

Before writing code, editing files, deleting files, refactoring, installing packages, or changing architecture, you must audit the whole project.

You must check:

- Frontend
- Backend
- Database
- Authentication
- Routes
- API/service layer
- State management
- UI components
- Screens
- Models
- Config files
- Environment files
- Tests
- Build or compile errors
- Placeholder logic
- Mock data
- TODO comments
- Missing files
- Broken imports
- Security risks

You must produce a clear audit report first.

---

# Absolute Rules

## 1. No Assumptions

Do not assume a feature is complete.

A feature is only finished if it is actually implemented, connected, and verified in the code.

Do not mark something as finished only because:

- The file exists
- The route exists
- The UI exists
- The widget exists
- A function exists
- A comment says it works
- A previous assistant summary said it was done
- A TODO says it will be done later

## 2. Audit First

Before implementation, inspect the project.

Do not skip the audit.

Do not start coding until the audit is complete.

## 3. Be Honest

If something cannot be verified, say so.

If something is missing, say it is missing.

If something is only UI with no logic, mark it as partially finished.

If something uses mock data, mark it as not production-ready.

## 4. Work From Evidence

Every claim must be based on the actual files and code.

Use phrases like:

- Verified in code
- File exists but logic is missing
- Route exists but screen is incomplete
- UI exists but is not connected to backend
- Backend not found
- Database not found
- Could not verify
- Needs implementation

---

# Required Audit Output

After inspecting the project, output this exact structure:

```md
# Project Audit Report

## 1. Project Summary
Describe what the project currently appears to be based on the files.

## 2. Finished
List only features that are verified as complete and working from the code.

## 3. Unfinished
List missing features, missing files, missing logic, or unimplemented requirements.

## 4. Partially Finished
List features that exist but are incomplete, disconnected, mock-only, placeholder-only, or not fully working.

## 5. Broken or Risky
List build errors, broken imports, broken routes, unsafe logic, missing validation, security issues, hardcoded secrets, or risky architecture.

## 6. Frontend Audit
Review screens, UI components, navigation, forms, loading states, error states, empty states, and design consistency.

## 7. Backend Audit
State whether a backend exists.
If backend exists, review endpoints, structure, validation, authentication, storage, and security.
If backend does not exist, mark backend as unfinished.

## 8. Database Audit
State whether a database exists.
Review schemas, models, collections, migrations, relationships, access rules, and persistence.
If database does not exist, mark database as unfinished.

## 9. Authentication Audit
Review buyer auth, seller auth, role-based auth, session persistence, logout, validation, protected routes, and redirects.

## 10. API and Services Audit
Review API clients, services, mock data, backend connection, token handling, response handling, and error handling.

## 11. State Management Audit
Review how app state is handled and whether auth, user, product, cart, order, and seller states are managed properly.

## 12. Testing Audit
Review unit tests, widget tests, integration tests, build verification, linting, and missing test coverage.

## 13. Finished vs Unfinished Summary

### Finished
- Verified finished items only

### Unfinished
- Verified missing or incomplete items only

### Partially Finished
- Existing but incomplete items only

## 14. Priority Work Plan
Rank what should be worked on next.

## 15. Next Recommended Task
Give one specific task to do next.

## 16. Files to Change Next
List the files likely needed for the next task.

## 17. Expected Result
Explain what should work after the next task is completed.
```

---

# Finished / Unfinished Rules

## Mark as Finished Only If

A feature can be marked **Finished** only when:

- Required files exist
- Code compiles
- Route works
- UI is connected to logic
- Logic is connected to data or service layer
- Required validation exists
- Loading state exists where needed
- Error state exists where needed
- Empty state exists where needed
- Role restrictions work where needed
- Feature matches the expected app behavior

## Mark as Partially Finished If

A feature must be marked **Partially Finished** when:

- Screen exists but logic is missing
- Route exists but flow is incomplete
- Form exists but does not submit
- UI exists but only uses mock data
- Backend service exists but is not connected
- Database model exists but is not used
- Auth screen exists but session persistence is missing
- Seller or buyer flow exists but role handling is missing
- Validation is incomplete
- Error handling is missing
- Loading state is missing

## Mark as Unfinished If

A feature must be marked **Unfinished** when:

- Required file does not exist
- Required feature is missing
- Backend is not implemented
- Database is not implemented
- API contract is missing
- Auth logic is missing
- Role-based routing is missing
- Product management is missing
- Cart or order flow is missing
- Tests are missing

## Mark as Broken or Risky If

A feature must be marked **Broken or Risky** when:

- Project does not compile
- Imports fail
- Routes point to missing screens
- Forms accept invalid data
- User roles can be bypassed
- Secrets are hardcoded
- Backend has no validation
- Database writes are unsafe
- API errors are not handled
- Null values may crash the app
- Mock data is mixed with real production flow

---

# Required Product Audit Areas

The project appears to be a marketplace-style Flutter app for Filipino processed foods.

Audit the following product areas.

---

## A. Design System Audit

Check whether these design rules are implemented:

- Primary color: `#4DA6FF`
- Deep blue: `#1976D2`
- Background: `#F5FAFF`
- Card radius: 18–24px
- Buttons are rounded
- Important buttons are full-width
- Product cards include image, discount badge, expiry chip, price, and seller
- Product examples use Filipino processed foods only

Check whether these reusable widgets exist and are used:

- `AppButton`
- `AppTextField`
- `RoleCard`
- `ProductCard`
- `CategoryCard`
- `PriceText`
- `ExpiryBadge`
- `DiscountBadge`
- `DashboardMetricCard`
- `EmptyStateWidget`
- `LoadingView`

For each widget, report one of:

- Finished
- Partially finished
- Unfinished
- Broken or risky

---

## B. Buyer Flow Audit

Check whether these exist and work:

- Buyer login
- Buyer sign up
- Buyer onboarding/profile setup
- Buyer home
- Product browsing
- Category browsing
- Product search
- Product filtering
- Product details
- Cart
- Checkout
- Order placement
- Order history
- Buyer logout
- Buyer protected routes

---

## C. Seller Flow Audit

Check whether these exist and work:

- Seller login
- Seller sign up
- Business name step
- Business email step
- Password step
- Store address step
- Contact number step
- Seller role creation
- Seller dashboard
- Seller product listing
- Add product
- Edit product
- Delete product
- Inventory management
- Expiry tracking
- Discount management
- Seller orders
- Seller logout
- Seller protected routes

---

## D. Authentication Audit

Check:

- Buyer auth
- Seller auth
- Role selection
- Role persistence
- Protected routes
- Redirect after login
- Redirect after logout
- Session persistence
- Password validation
- Email validation
- Error messages
- Loading states
- Token handling if applicable

---

## E. Backend Audit

Check whether backend exists.

If backend exists, inspect:

- Backend framework
- Folder structure
- Auth endpoints
- User endpoints
- Seller endpoints
- Product endpoints
- Category endpoints
- Cart endpoints
- Order endpoints
- Upload/image endpoints
- Validation
- Error handling
- Logging
- Environment variables
- Security
- Tests

If backend does not exist, state:

```md
Backend status: Unfinished
Reason: No backend implementation found.
Recommended next backend work:
- Define backend technology
- Create API contract
- Add auth endpoints
- Add product endpoints
- Add order endpoints
- Connect database
```

---

## F. Database Audit

Check whether database exists.

If database exists, inspect:

- Database technology
- User model/table/collection
- Seller model/table/collection
- Product model/table/collection
- Category model/table/collection
- Cart model/table/collection
- Order model/table/collection
- Inventory fields
- Expiry date fields
- Discount fields
- Product image fields
- Role fields
- Timestamps
- Security rules
- Migrations
- Seed data

If database does not exist, state:

```md
Database status: Unfinished
Reason: No database implementation found.
Recommended next database work:
- Define schema
- Add users
- Add sellers
- Add products
- Add categories
- Add carts
- Add orders
- Add security rules or access policies
```

---

## G. API / Service Layer Audit

Check whether these exist and are connected:

- API client
- Auth service
- User service
- Seller service
- Product service
- Category service
- Cart service
- Order service
- Upload service
- Error handling
- Loading handling
- Token/session handling
- Mock data replacement plan

---

## H. Core Feature Audit

Check whether these features are finished, unfinished, or partially finished:

- Landing page
- Role selection
- Buyer auth
- Seller auth
- Buyer home
- Seller dashboard
- Product listing
- Product detail
- Product creation
- Product editing
- Product deletion
- Product categories
- Search
- Filters
- Cart
- Checkout
- Orders
- Order history
- Seller inventory
- Expiry tracking
- Discount display
- Image upload
- Empty states
- Loading states
- Error states
- Filipino processed food sample data

---

# Priority Rules

After the audit, recommend work in this order unless the audit proves another blocker is more urgent:

1. Fix build or compile errors
2. Fix broken imports and routing
3. Complete reusable UI system
4. Complete authentication flow
5. Add or connect backend
6. Add or connect database
7. Create product models and services
8. Implement seller product management
9. Implement buyer browsing, cart, and checkout
10. Implement order flow
11. Add validation, loading states, error states, and empty states
12. Add tests
13. Polish UI consistency

If you change this order, explain why.

---

# Next Work Rule

After the audit, do not start many tasks at once.

Pick only one next task.

Before implementing the next task, output:

```md
# Next Task
[Specific task]

# Why This Is Next
[Reason based on audit]

# Files To Change
[List files]

# Expected Result
[What should work after this task]
```

---

# Implementation Rules

When implementing after the audit:

- Make focused changes only
- Do not do unrelated refactors
- Do not delete files unless clearly safe
- Follow existing project structure
- Reuse existing components
- Keep UI consistent with the design system
- Add validation where required
- Add loading states where required
- Add error states where required
- Avoid hardcoded secrets
- Avoid fake completion claims
- Do not say something is finished unless verified

---

# Verification Report After Changes

After making changes, always output:

```md
# Verification

## Completed
- What was changed

## Checked
- What was tested or reviewed

## Not Checked
- What could not be verified

## Remaining Work
- What still needs to be done

## Finished
- Verified completed items

## Unfinished
- Verified missing or incomplete items

## Next Recommended Work
- One specific next task
```

---

# Final Reminder

Audit everything first.

No assumptions.

Separate finished from unfinished.

Backend, database, authentication, frontend, API, routing, UI, and tests must all be checked.

Only after the full audit should the next task be recommended or implemented.
