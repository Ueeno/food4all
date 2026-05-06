"use client"

import { AppStateProvider, useAppState } from "@/lib/app-state"
import { SplashScreen } from "@/components/screens/splash-screen"
import { LoginScreen } from "@/components/screens/login-screen"
import { RegisterScreen } from "@/components/screens/register-screen"
import { RoleSelectScreen } from "@/components/screens/role-select-screen"
import { BuyerHomeScreen } from "@/components/screens/buyer-home-screen"
import {
  BuyerProductListScreen,
  BuyerCategoriesScreen,
} from "@/components/screens/buyer-products-screen"
import { BuyerProductDetailScreen } from "@/components/screens/buyer-product-detail-screen"
import {
  BuyerCartScreen,
  BuyerCheckoutScreen,
} from "@/components/screens/buyer-cart-screen"
import {
  BuyerPickupQRScreen,
  BuyerOrdersScreen,
  BuyerProfileScreen,
} from "@/components/screens/buyer-pickup-screen"
import { SellerDashboardScreen } from "@/components/screens/seller-dashboard-screen"
import {
  SellerAddProductScreen,
  SellerProductsScreen,
  SellerOrdersScreen,
  SellerVerifyPickupScreen,
  SellerReportsScreen,
  SellerProfileScreen,
} from "@/components/screens/seller-screens"

function AppRouter() {
  const { screen } = useAppState()

  const screens: Record<typeof screen, React.ReactNode> = {
    splash: <SplashScreen />,
    login: <LoginScreen />,
    register: <RegisterScreen />,
    "role-select": <RoleSelectScreen />,
    "buyer-home": <BuyerHomeScreen />,
    "buyer-categories": <BuyerCategoriesScreen />,
    "buyer-product-list": <BuyerProductListScreen />,
    "buyer-product-detail": <BuyerProductDetailScreen />,
    "buyer-cart": <BuyerCartScreen />,
    "buyer-checkout": <BuyerCheckoutScreen />,
    "buyer-pickup-qr": <BuyerPickupQRScreen />,
    "buyer-orders": <BuyerOrdersScreen />,
    "buyer-profile": <BuyerProfileScreen />,
    "seller-dashboard": <SellerDashboardScreen />,
    "seller-add-product": <SellerAddProductScreen />,
    "seller-products": <SellerProductsScreen />,
    "seller-orders": <SellerOrdersScreen />,
    "seller-verify-pickup": <SellerVerifyPickupScreen />,
    "seller-reports": <SellerReportsScreen />,
    "seller-profile": <SellerProfileScreen />,
  }

  return (
    /**
     * Responsive scaffold:
     * - Mobile  (<640px): fills 100vw / 100dvh — full screen app feel
     * - Tablet  (640–1023px): centred phone frame 480px wide, full height
     * - Desktop (≥1024px): centred phone frame 430px wide, capped 900px tall
     *   with a deep sky background showing around the frame.
     */
    <div
      className="
        relative overflow-hidden bg-background
        w-full h-[100dvh] flex flex-col
        sm:w-[480px] sm:h-[100dvh] sm:rounded-[2.5rem] sm:shadow-[0_0_80px_oklch(0.45_0.18_232_/_0.3),0_0_0_1px_oklch(1_0_0_/_0.15)]
        lg:w-[430px] lg:max-h-[900px] lg:rounded-[3rem]
      "
    >
      {screens[screen]}
    </div>
  )
}

export function Food4AllApp() {
  return (
    <AppStateProvider>
      {/* Outer shell: full viewport, centred, sky gradient shows on tablet/desktop */}
      <div className="min-h-dvh w-full flex items-center justify-center sm:sky-gradient-deep sm:p-4 lg:p-8">
        <AppRouter />
      </div>
    </AppStateProvider>
  )
}
