# FOOD4ALL Presentation & Demo Script

This guide provides a structured walkthrough for demonstrating the FOOD4ALL marketplace. It covers both the Buyer and Seller journeys, highlighting key features and current project status.

## 1. Setup & Demo Accounts

To ensure a smooth demo, it is recommended to run `corepack pnpm db:reset` beforehand to have a clean, pre-seeded state.

> [!TIP]
> **Recommended Environment:** This app is optimized for **Android Chrome** (mobile view). For the best presentation experience, use Chrome DevTools mobile emulation (e.g., Pixel 7) or a physical Android device.

### Pre-seeded Accounts
*   **Buyer Account**
    *   **Email:** `buyer@food4all.local`
    *   **Password:** `password123`
*   **Seller Account**
    *   **Email:** `seller@food4all.local`
    *   **Password:** `password123`

---

## 2. Demo Walkthrough

### Part A: The Buyer Journey
1.  **Onboarding**: 
    *   Start at the Splash screen.
    *   Navigate to **Register** and create a new buyer account (e.g., `demo-user@example.com`).
    *   Showcase the **Role Selection** screen; select "Buyer".
2.  **Marketplace Browsing**:
    *   Browse the **Home** screen with Featured and Hot deals.
    *   Navigate to **Categories** and filter for "Hotdogs" or "Frozen Foods".
    *   Click on **Purefoods Tender Juicy Hotdog** to see the detailed product view (expiry, weight, seller info).
3.  **Cart & Checkout**:
    *   Add the product to the **Cart**.
    *   Open the Cart and increment the quantity.
    *   Proceed to **Checkout**.
    *   Select a **Pickup Slot** (e.g., "Tomorrow 2:00 PM").
    *   Complete the order.
4.  **Order Confirmation**:
    *   Show the **Pickup QR Code** and the 8-character verification code (e.g., `F4A-XXXX`).
    *   Navigate to **Orders** to see the new order in "Reserved" status.

### Part B: The Seller Journey
1.  **Login**:
    *   Log out from the buyer profile.
    *   Log in as `seller@food4all.local`.
    *   Select "Seller" role.
2.  **Dashboard**:
    *   View real-time **Dashboard Metrics** (Revenue, Pending Orders, Expiring Items).
    *   Show the **Notification Badge** on the Orders tab indicating the new pending order.
3.  **Product Management**:
    *   Go to **Products** and edit an existing item (e.g., update price or stock).
    *   (Optional) Demonstrate **Delete Confirmation** for a sample product.
4.  **Order Fulfillment**:
    *   Go to **Orders** and find the buyer's reserved order.
    *   Click **Mark Ready**.
5.  **Pickup Verification**:
    *   Go to **Verify Pickup**.
    *   Enter the buyer's 8-character pickup code manually.
    *   Click **Verify**. Show the success state and the order moving to "Completed".
6.  **Reports & Profile**:
    *   Visit **Reports** to see the updated revenue and top products.
    *   Visit **Profile** and toggle the "Store Open/Closed" status.

---

## 3. Known Limitations

As this is a Phase 1 MVP, the following features are not yet implemented or are simulated:

*   **Payment Processing**: The checkout flow is a reservation-only system. No real payment gateway (Stripe/PayPal) is integrated yet.
*   **Image Management**: Product images currently use placeholders or static paths from the `public/images` directory. Real file upload to cloud storage (S3/Firebase) is pending.
*   **Real-time Notifications**: Badges and status updates require navigation or page refresh to sync. WebSockets or Push Notifications are not yet implemented.
*   **Pickup Location Persistence**: The pickup address is derived from the seller's current profile or product data rather than being snapshotted at the exact moment of checkout.
*   **Buyer Profiles**: Advanced buyer features like "Saved Branches" or "Order Ratings" are currently UI-only.
*   **Scanning**: The "Scan QR" button is a UI placeholder; verification is handled via manual code entry.

---

## 4. Troubleshooting for Presenters
*   **Session Issues**: If the login state feels "stuck" after role changes, use the Profile -> Logout button to clear the local session and re-login.
*   **Database Reset**: If data becomes messy during practice, run `corepack pnpm db:reset` to return to the baseline seeded state.
*   **Port Conflicts**: Ensure no other process is using port `3000`.
