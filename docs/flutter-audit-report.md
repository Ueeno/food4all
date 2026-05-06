# Task 048 Flutter APK Conversion Audit

## 1. Current System Verdict
**Stable.** The Next.js + Prisma SQL-backed system is fully functional. All 207 tests pass (regression verified), linting is clean, and the production build succeeds. The existing backend is ready to serve as the API source for the Flutter client.

## 2. Existing Flutter Project Status
**Fresh / Placeholder.** There are two Flutter projects: one at the root (`c:\FOOD4ALL`) and another in `components/food4all_flutter/`. Both contain only the default "Counter" template. The root project will be used as the primary location for the Android client.

## 3. Backend API Reuse Plan
Flutter will call the existing Next.js route handlers in `app/api/`:
- **Auth**: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/me`, `/api/auth/role`
- **Marketplace**: `/api/products`, `/api/categories`

## 4. Authentication/Cookie Risk
**High Risk.** The backend uses HTTP-only session cookies. Flutter's default `http` package does not persist cookies across sessions.
- **Mitigation**: Use the `dio` package along with `dio_cookie_manager` and `cookie_jar` to automatically handle session persistence, or implement manual cookie extraction/replay in the API client layer.

## 5. Android SDK / APK Build Status
**BLOCKED.** `flutter build apk` fails because the Android SDK is not found on this system.
- **Current Status**: `flutter doctor` reports "Unable to locate Android SDK."
- **Required Setup**:
    1. Install Android Studio.
    2. Install Android SDK Command-line Tools.
    3. Install Android SDK Platform 34 (or latest).
    4. Set `ANDROID_HOME` to the SDK location.
    5. Accept all Android licenses via `flutter doctor --android-licenses`.

## 6. Conversion Strategy
**Phased.**
- **Phase 1**: Foundation, API Client, Models, and Auth/Browsing screens.
- **Phase 2**: Buyer Cart & Checkout.
- **Phase 3**: Seller Product Management.
- **Phase 4**: Seller Orders & Reports.

## 7. Files to Change in Phase 1
- `pubspec.yaml` (Add dependencies: `dio`, `dio_cookie_manager`, `cookie_jar`, `provider` or `riverpod`, `shared_preferences`)
- `lib/` (Implement the structure: `config/`, `models/`, `services/`, `state/`, `screens/`, `widgets/`)
- `AGENT.md` (Log progress)

## 8. Proceed / Do Not Proceed
**Safe to Proceed with Phase 1 (Code only).** While APK builds are blocked by the environment, the Dart/Flutter code can still be implemented, analyzed, and tested. I will focus on building the functional foundation and connecting to the backend.
