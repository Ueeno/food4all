import { useEffect, useRef, type ReactNode } from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  AppStateProvider,
  useAppState,
  type AuthRole,
  type CartItem,
} from "@/lib/app-state"
import {
  BuyerCartScreen,
  BuyerCheckoutScreen,
} from "@/components/screens/buyer-cart-screen"
import {
  BuyerOrdersScreen,
  BuyerPickupQRScreen,
  BuyerProfileScreen,
} from "@/components/screens/buyer-pickup-screen"
import { BuyerProductDetailScreen } from "@/components/screens/buyer-product-detail-screen"
import { BuyerProductListScreen } from "@/components/screens/buyer-products-screen"
import { SellerDashboardScreen } from "@/components/screens/seller-dashboard-screen"
import {
  SellerAddProductScreen,
  SellerOrdersScreen,
  SellerProfileScreen,
  SellerProductsScreen,
  SellerReportsScreen,
  SellerVerifyPickupScreen,
} from "@/components/screens/seller-screens"
import { LOCAL_STORAGE_KEYS } from "@/lib/local-storage"

const TEST_CART_ITEM: CartItem = {
  id: "p1",
  name: "Purefoods Tender Juicy Hotdog",
  price: 185,
  originalPrice: 285,
  quantity: 2,
  image: "/images/hotdogs.jpg",
  seller: "Magsaysay Meat Depot",
  location: "Magsaysay Market, Davao City",
}

function getStoredCartItems() {
  const rawCart = localStorage.getItem(LOCAL_STORAGE_KEYS.cartItems)
  return rawCart ? (JSON.parse(rawCart) as CartItem[]) : []
}

function StateProbe() {
  const {
    cartCount,
    cartTotal,
    screen: currentScreen,
    selectedProductId,
    selectedRole,
  } = useAppState()

  return (
    <div aria-label="app state probe">
      <span data-testid="screen">{currentScreen}</span>
      <span data-testid="selected-role">{selectedRole ?? "none"}</span>
      <span data-testid="selected-product">{selectedProductId ?? "none"}</span>
      <span data-testid="cart-count">{cartCount}</span>
      <span data-testid="cart-total">{cartTotal}</span>
    </div>
  )
}

function SeedRole({ role }: { role: AuthRole }) {
  const { currentUser, login, selectedRole, selectRole } = useAppState()
  const seededRef = useRef(false)

  useEffect(() => {
    if (!seededRef.current && !currentUser) {
      seededRef.current = true
      login({ email: `${role}@food4all.local`, password: "password123" })
      return
    }

    if (seededRef.current && currentUser && selectedRole !== role) {
      selectRole(role)
    }
  }, [currentUser, login, role, selectedRole, selectRole])

  return null
}

function SeedCartItem({ item = TEST_CART_ITEM }: { item?: CartItem }) {
  const { addToCart, cartItems } = useAppState()
  const seededRef = useRef(false)

  useEffect(() => {
    if (!seededRef.current && cartItems.length === 0) {
      seededRef.current = true
      addToCart(item)
    }
  }, [addToCart, cartItems.length, item])

  return null
}

function SeedSelectedProduct({ productId }: { productId: string }) {
  const { selectedProductId, selectProduct } = useAppState()
  const seededRef = useRef(false)

  useEffect(() => {
    if (!seededRef.current && selectedProductId !== productId) {
      seededRef.current = true
      selectProduct(productId)
    }
  }, [productId, selectProduct, selectedProductId])

  return null
}

function renderWithAppState(ui: ReactNode, seed?: ReactNode) {
  return render(
    <AppStateProvider>
      {seed}
      {ui}
      <StateProbe />
    </AppStateProvider>,
  )
}

function CartCheckoutHarness() {
  const { screen: currentScreen } = useAppState()

  return currentScreen === "buyer-checkout" ? <BuyerCheckoutScreen /> : <BuyerCartScreen />
}

async function advanceTimers(milliseconds: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds)
  })
}

afterEach(() => {
  vi.useRealTimers()
})

describe("rendered buyer marketplace flow", () => {
  it("renders buyer product cards from the mock service", async () => {
    renderWithAppState(<BuyerProductListScreen />, <SeedRole role="buyer" />)

    expect(await screen.findByRole("heading", { name: /browse products/i })).toBeInTheDocument()
    expect(
      await screen.findByRole("button", { name: /Purefoods Tender Juicy Hotdog/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /CDO Farmhouse Tocino/i })).toBeInTheDocument()
  })

  it("renders product detail add-to-cart action and updates local cart state", async () => {
    renderWithAppState(
      <BuyerProductDetailScreen />,
      <>
        <SeedRole role="buyer" />
        <SeedSelectedProduct productId="p1" />
      </>,
    )

    expect(await screen.findByRole("heading", { name: /Purefoods Tender Juicy Hotdog/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /add to cart/i }))

    expect(screen.getByRole("button", { name: /added/i })).toBeInTheDocument()
    expect(screen.getByTestId("cart-count")).toHaveTextContent("1")
    expect(getStoredCartItems()).toMatchObject([{ id: "p1", quantity: 1 }])
  })

  it("adding the same product twice increases quantity", async () => {
    renderWithAppState(
      <BuyerProductDetailScreen />,
      <>
        <SeedRole role="buyer" />
        <SeedCartItem />
        <SeedSelectedProduct productId="p1" />
      </>,
    )

    expect(await screen.findByRole("heading", { name: /Purefoods Tender Juicy Hotdog/i })).toBeInTheDocument()
    expect(screen.getByTestId("cart-count")).toHaveTextContent("2")

    fireEvent.click(screen.getByRole("button", { name: /add to cart/i }))

    expect(screen.getByTestId("cart-count")).toHaveTextContent("3")
    expect(screen.getByTestId("cart-total")).toHaveTextContent("555")
  })

  it("renders the empty cart state", () => {
    renderWithAppState(<BuyerCartScreen />, <SeedRole role="buyer" />)

    expect(screen.getByRole("heading", { name: /my cart/i })).toBeInTheDocument()
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /browse products/i })).toBeInTheDocument()
  })

  it("renders seeded cart items and removes an item", async () => {
    renderWithAppState(
      <BuyerCartScreen />,
      <>
        <SeedRole role="buyer" />
        <SeedCartItem />
      </>,
    )

    expect(await screen.findByText("Purefoods Tender Juicy Hotdog")).toBeInTheDocument()
    expect(screen.getByTestId("cart-count")).toHaveTextContent("2")
    expect(screen.getByRole("button", { name: /reserve & checkout/i })).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole("button", { name: /remove purefoods tender juicy hotdog from cart/i }),
    )

    await waitFor(() => {
      expect(screen.getByText("Your cart is empty")).toBeInTheDocument()
    })
    expect(screen.getByTestId("cart-count")).toHaveTextContent("0")
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.cartItems)).toBeNull()
  })

  it("increments and decrements cart item quantity and updates totals", async () => {
    renderWithAppState(
      <BuyerCartScreen />,
      <>
        <SeedRole role="buyer" />
        <SeedCartItem />
      </>,
    )

    expect(await screen.findByText("Purefoods Tender Juicy Hotdog")).toBeInTheDocument()
    expect(screen.getByLabelText("Quantity for Purefoods Tender Juicy Hotdog")).toHaveTextContent("2")
    expect(screen.getByTestId("cart-total")).toHaveTextContent("370")

    fireEvent.click(
      screen.getByRole("button", { name: /increase quantity for purefoods tender juicy hotdog/i }),
    )

    expect(screen.getByLabelText("Quantity for Purefoods Tender Juicy Hotdog")).toHaveTextContent("3")
    expect(screen.getByTestId("cart-count")).toHaveTextContent("3")
    expect(screen.getByTestId("cart-total")).toHaveTextContent("555")
    expect(getStoredCartItems()).toMatchObject([{ id: "p1", quantity: 3 }])

    fireEvent.click(
      screen.getByRole("button", { name: /decrease quantity for purefoods tender juicy hotdog/i }),
    )

    expect(screen.getByLabelText("Quantity for Purefoods Tender Juicy Hotdog")).toHaveTextContent("2")
    expect(screen.getByTestId("cart-count")).toHaveTextContent("2")
    expect(screen.getByTestId("cart-total")).toHaveTextContent("370")
    expect(getStoredCartItems()).toMatchObject([{ id: "p1", quantity: 2 }])
  })

  it("removes cart item when decrementing at quantity one", async () => {
    renderWithAppState(
      <BuyerCartScreen />,
      <>
        <SeedRole role="buyer" />
        <SeedCartItem item={{ ...TEST_CART_ITEM, quantity: 1 }} />
      </>,
    )

    expect(await screen.findByText("Purefoods Tender Juicy Hotdog")).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole("button", { name: /decrease quantity for purefoods tender juicy hotdog/i }),
    )

    await waitFor(() => {
      expect(screen.getByText("Your cart is empty")).toBeInTheDocument()
    })
    expect(screen.getByTestId("cart-count")).toHaveTextContent("0")
    expect(screen.getByTestId("cart-total")).toHaveTextContent("0")
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.cartItems)).toBeNull()
  })

  it("moves from cart to checkout through the primary action", async () => {
    renderWithAppState(
      <BuyerCartScreen />,
      <>
        <SeedRole role="buyer" />
        <SeedCartItem />
      </>,
    )

    expect(await screen.findByText("Purefoods Tender Juicy Hotdog")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /reserve & checkout/i }))

    expect(screen.getByTestId("screen")).toHaveTextContent("buyer-checkout")
  })

  it("checkout summary reflects updated cart quantities", async () => {
    renderWithAppState(
      <CartCheckoutHarness />,
      <>
        <SeedRole role="buyer" />
        <SeedCartItem />
      </>,
    )

    expect(await screen.findByText("Purefoods Tender Juicy Hotdog")).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole("button", { name: /increase quantity for purefoods tender juicy hotdog/i }),
    )
    fireEvent.click(screen.getByRole("button", { name: /reserve & checkout/i }))

    expect(screen.getByRole("heading", { name: /checkout/i })).toBeInTheDocument()
    expect(screen.getByText(/185.*3/)).toBeInTheDocument()
    expect(screen.getByTestId("cart-count")).toHaveTextContent("3")
    expect(screen.getByTestId("cart-total")).toHaveTextContent("555")
  })

  it("renders checkout summary and confirms the mock reservation", async () => {
    renderWithAppState(
      <BuyerCheckoutScreen />,
      <>
        <SeedRole role="buyer" />
        <SeedCartItem />
      </>,
    )

    expect(await screen.findByRole("heading", { name: /checkout/i })).toBeInTheDocument()
    expect(screen.getByText("Order Summary")).toBeInTheDocument()
    expect(screen.getByText("Purefoods Tender Juicy Hotdog")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /confirm reservation/i })).toBeInTheDocument()

    vi.useFakeTimers()
    fireEvent.click(screen.getByRole("button", { name: /confirm reservation/i }))
    await advanceTimers(1600)

    expect(screen.getByTestId("cart-count")).toHaveTextContent("0")
    expect(screen.getByTestId("screen")).toHaveTextContent("buyer-pickup-qr")
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.cartItems)).toBeNull()
  })
})

describe("rendered remaining buyer mock flows", () => {
  it("renders buyer order history with mock order cards and pickup action", async () => {
    renderWithAppState(<BuyerOrdersScreen />, <SeedRole role="buyer" />)

    expect(screen.getByRole("heading", { name: /my orders/i })).toBeInTheDocument()
    expect(screen.getByText("Total Orders")).toBeInTheDocument()
    expect(screen.getByText("Total Saved")).toBeInTheDocument()
    expect(screen.getByText("Waste Saved")).toBeInTheDocument()

    const readyOrder = screen.getByRole("button", { name: /order ord-2847, ready/i })
    expect(readyOrder).toBeInTheDocument()
    expect(screen.getByText("Purefoods Tender Juicy Hotdog")).toBeInTheDocument()
    expect(screen.getByText(/Magsaysay Meat Depot/)).toBeInTheDocument()
    expect(screen.getAllByText("Ready").length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText("F4A-7X29")).toBeInTheDocument()
    expect(screen.getByText("Show QR")).toBeInTheDocument()

    fireEvent.click(readyOrder)

    expect(screen.getByTestId("screen")).toHaveTextContent("buyer-pickup-qr")
  })

  it("switches buyer order-history tabs and renders status-specific mock details", () => {
    renderWithAppState(<BuyerOrdersScreen />, <SeedRole role="buyer" />)

    fireEvent.click(screen.getByRole("button", { name: /pending/i }))
    expect(screen.getByRole("button", { name: /order ord-2850, pending/i })).toBeInTheDocument()
    expect(screen.getByText("Mega Protein Bundle Deal")).toBeInTheDocument()
    expect(screen.getByText(/Pickup scheduled: May 2, 2026 at 11:00 AM/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /claimed/i }))
    expect(screen.getByRole("button", { name: /order ord-2831, claimed/i })).toBeInTheDocument()
    expect(screen.getByText("CDO Farmhouse Tocino")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /cancelled/i }))
    expect(screen.getByRole("button", { name: /order ord-2798, cancelled/i })).toBeInTheDocument()
    expect(screen.getByText("Hacienda Bacon Strips")).toBeInTheDocument()
  })

  it("renders buyer pickup QR details and claimed confirmation state", () => {
    renderWithAppState(<BuyerPickupQRScreen />, <SeedRole role="buyer" />)

    expect(screen.getByRole("heading", { name: /show qr at store/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/qr code for pickup code f4a-7x29/i)).toBeInTheDocument()
    expect(screen.getByText("Pickup Code")).toBeInTheDocument()
    expect(screen.getByText(/ORD-2847/)).toBeInTheDocument()
    expect(screen.getByText(/Magsaysay Market/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /share pickup qr/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /claim pickup/i }))

    expect(screen.getByRole("heading", { name: /pickup complete/i })).toBeInTheDocument()
    expect(screen.getByText(/Purefoods Tender Juicy Hotdog/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /view all orders/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /view all orders/i }))

    expect(screen.getByTestId("screen")).toHaveTextContent("buyer-orders")
  })

  it("renders buyer profile details and profile actions", async () => {
    renderWithAppState(<BuyerProfileScreen />, <SeedRole role="buyer" />)

    await waitFor(() => {
      expect(screen.getByTestId("selected-role")).toHaveTextContent("buyer")
    })

    expect(screen.getByRole("heading", { name: /food4all user/i })).toBeInTheDocument()
    expect(screen.getByText("buyer@food4all.local")).toBeInTheDocument()
    expect(screen.getByText(/4.9 verified buyer/i)).toBeInTheDocument()
    expect(screen.getByText("Your Impact")).toBeInTheDocument()
    expect(screen.getByText("Saved Pickup Branches")).toBeInTheDocument()
    expect(screen.getAllByRole("switch")).toHaveLength(2)
    expect(screen.getByRole("button", { name: /my orders/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /my orders/i }))

    expect(screen.getByTestId("screen")).toHaveTextContent("buyer-orders")
  })
})

describe("rendered seller marketplace flow", () => {
  it("renders seller dashboard metrics from the mock service", async () => {
    renderWithAppState(<SellerDashboardScreen />, <SeedRole role="seller" />)

    expect(await screen.findByText("Today's Revenue")).toBeInTheDocument()
    expect(screen.getByText("Pending Orders")).toBeInTheDocument()
    expect(screen.getByText("Items Expiring")).toBeInTheDocument()
    expect(screen.getByText("Total Sales")).toBeInTheDocument()
  })

  it("renders seller products from the mock service", async () => {
    renderWithAppState(<SellerProductsScreen />, <SeedRole role="seller" />)

    expect(await screen.findByRole("heading", { name: /my products/i })).toBeInTheDocument()
    expect(screen.getByText("Purefoods Tender Juicy Hotdog")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /edit purefoods tender juicy hotdog/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /delete purefoods tender juicy hotdog/i })).toBeInTheDocument()
  })

  it("renders seller orders and switches order tabs", async () => {
    renderWithAppState(<SellerOrdersScreen />, <SeedRole role="seller" />)

    expect(await screen.findByRole("heading", { name: /orders/i })).toBeInTheDocument()
    expect(screen.getByText("ORD-2847")).toBeInTheDocument()
    expect(screen.getByText("Maria Santos")).toBeInTheDocument()
    expect(screen.getByText("Purefoods Tender Juicy Hotdog")).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole("button", { name: /ready/i })[0]!)

    expect(screen.getByText("ORD-2848")).toBeInTheDocument()
    expect(screen.getByText("Juan dela Cruz")).toBeInTheDocument()
    expect(screen.getByText(/F4A-3K85/)).toBeInTheDocument()
  })

  it("renders seller pickup verification and shows invalid code errors", async () => {
    vi.useFakeTimers()
    renderWithAppState(<SellerVerifyPickupScreen />, <SeedRole role="seller" />)

    expect(screen.getByRole("heading", { name: /verify pickup/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/pickup code input/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/pickup code input/i), {
      target: { value: "F4A-BAD0" },
    })
    fireEvent.click(screen.getByRole("button", { name: /confirm pickup/i }))
    await advanceTimers(1200)

    expect(screen.getByText("Pickup code was not found in mock orders.")).toBeInTheDocument()
  })

  it("renders seller pickup verification success for a valid mock code", async () => {
    vi.useFakeTimers()
    renderWithAppState(<SellerVerifyPickupScreen />, <SeedRole role="seller" />)

    fireEvent.change(screen.getByLabelText(/pickup code input/i), {
      target: { value: "F4A-7X29" },
    })
    fireEvent.click(screen.getByRole("button", { name: /confirm pickup/i }))
    await advanceTimers(1200)

    expect(screen.getByRole("heading", { name: /pickup confirmed/i })).toBeInTheDocument()
    expect(screen.getByText(/ORD-2847/)).toBeInTheDocument()
    expect(screen.getByText("Maria Santos")).toBeInTheDocument()
    expect(screen.getByText(/Purefoods Tender Juicy Hotdog x3/)).toBeInTheDocument()
  })
})

describe("rendered remaining seller mock flows", () => {
  it("blocks empty seller add-product submissions and shows validation errors", async () => {
    renderWithAppState(<SellerAddProductScreen />, <SeedRole role="seller" />)

    await waitFor(() => {
      expect(screen.getByTestId("selected-role")).toHaveTextContent("seller")
    })

    fireEvent.click(screen.getByRole("button", { name: /publish listing/i }))

    expect(screen.getByText("Product name is required.")).toBeInTheDocument()
    expect(screen.getByText("Original price is required.")).toBeInTheDocument()
    expect(screen.getByText("Discounted price is required.")).toBeInTheDocument()
    expect(screen.getByText("Expiry date is required.")).toBeInTheDocument()
    expect(screen.getByTestId("screen")).not.toHaveTextContent("seller-products")
  })

  it("blocks invalid seller add-product price, discount, and quantity values", async () => {
    renderWithAppState(<SellerAddProductScreen />, <SeedRole role="seller" />)

    await waitFor(() => {
      expect(screen.getByTestId("selected-role")).toHaveTextContent("seller")
    })

    fireEvent.change(screen.getByLabelText(/product name/i), {
      target: { value: "Frozen Breakfast Bundle" },
    })
    fireEvent.change(screen.getByLabelText(/original price/i), { target: { value: "-1" } })
    fireEvent.change(screen.getByLabelText(/discounted price/i), { target: { value: "0" } })
    fireEvent.change(screen.getByLabelText(/available quantity/i), { target: { value: "-2" } })
    fireEvent.change(screen.getByLabelText(/expiry date/i), { target: { value: "2026-05-12" } })

    fireEvent.click(screen.getByRole("button", { name: /publish listing/i }))

    expect(screen.getByText("Original price must be a positive number.")).toBeInTheDocument()
    expect(screen.getByText("Discounted price must be a positive number.")).toBeInTheDocument()
    expect(screen.getByText("Quantity must be a non-negative whole number.")).toBeInTheDocument()
    expect(screen.getByTestId("screen")).not.toHaveTextContent("seller-products")

    fireEvent.change(screen.getByLabelText(/original price/i), { target: { value: "100" } })
    fireEvent.change(screen.getByLabelText(/discounted price/i), { target: { value: "150" } })
    fireEvent.change(screen.getByLabelText(/available quantity/i), { target: { value: "1.5" } })

    fireEvent.click(screen.getByRole("button", { name: /publish listing/i }))

    expect(screen.getByText("Discount must be between 0 and 100%.")).toBeInTheDocument()
    expect(screen.getByText("Quantity must be a non-negative whole number.")).toBeInTheDocument()
    expect(screen.getByTestId("screen")).not.toHaveTextContent("seller-products")
  })

  it("renders seller add-product form and submits the valid mock listing flow", async () => {
    vi.useFakeTimers()
    renderWithAppState(<SellerAddProductScreen />, <SeedRole role="seller" />)

    expect(screen.getByRole("heading", { name: /upload product/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /take photo/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /upload image/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/product name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^brand$/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /hotdogs/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/original price/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/discounted price/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/available quantity/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/expiry date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/pickup address/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /take photo/i }))
    expect(screen.getByAltText("Product preview")).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/product name/i), {
      target: { value: "Purefoods Tender Juicy Hotdog" },
    })
    fireEvent.change(screen.getByLabelText(/^brand$/i), { target: { value: "Purefoods" } })
    fireEvent.change(screen.getByLabelText(/original price/i), { target: { value: "285" } })
    fireEvent.change(screen.getByLabelText(/discounted price/i), { target: { value: "185" } })
    fireEvent.change(screen.getByLabelText(/available quantity/i), { target: { value: "48" } })
    fireEvent.change(screen.getByLabelText(/expiry date/i), { target: { value: "2026-05-12" } })
    fireEvent.change(screen.getByLabelText(/pickup address/i), {
      target: { value: "Magsaysay Market, Davao City" },
    })
    fireEvent.change(screen.getByLabelText(/store hours/i), { target: { value: "7:00 AM - 5:00 PM" } })

    expect(screen.getByText("35% OFF")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /publish listing/i }))
    await advanceTimers(1400)

    expect(screen.getByTestId("screen")).toHaveTextContent("seller-products")
  })

  it("renders seller reports with metric cards, chart bars, and top products", async () => {
    renderWithAppState(<SellerReportsScreen />, <SeedRole role="seller" />)

    expect(await screen.findByRole("heading", { name: /sales reports/i })).toBeInTheDocument()
    expect(screen.getByText("Weekly Revenue")).toBeInTheDocument()
    expect(screen.getByText("Total Orders")).toBeInTheDocument()
    expect(screen.getByText(/Daily Revenue/)).toBeInTheDocument()
    expect(screen.getByRole("img", { name: /Sat:.*5200/i })).toBeInTheDocument()
    expect(screen.getByText("Environmental Impact")).toBeInTheDocument()
    expect(screen.getByText("Food Waste Reduced")).toBeInTheDocument()
    expect(screen.getByText("Recovery Earnings")).toBeInTheDocument()
    expect(screen.getByText("Best-Selling Items")).toBeInTheDocument()
    expect(screen.getByText("Purefoods Tender Juicy Hotdog")).toBeInTheDocument()
  })

  it("renders seller profile details, settings actions, and store status toggle", async () => {
    renderWithAppState(<SellerProfileScreen />, <SeedRole role="seller" />)

    await waitFor(() => {
      expect(screen.getByTestId("selected-role")).toHaveTextContent("seller")
    })

    expect(screen.getByRole("heading", { name: /store profile/i })).toBeInTheDocument()
    expect(screen.getByText("Magsaysay Meat Depot")).toBeInTheDocument()
    expect(screen.getByText("Verified Seller")).toBeInTheDocument()
    expect(screen.getByText(/Magsaysay Market/)).toBeInTheDocument()
    expect(screen.getByText("+63 912 345 6789")).toBeInTheDocument()
    expect(screen.getByText("Business Hours")).toBeInTheDocument()
    expect(screen.getByText(/Mon.*Fri/)).toBeInTheDocument()
    expect(screen.getByText("Store Status")).toBeInTheDocument()
    expect(screen.getByText("Visible to buyers")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /edit profile/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /edit store info/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /seller support/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("switch", { name: /store open/i }))

    expect(screen.getByText("Hidden from listings")).toBeInTheDocument()
    expect(screen.getByRole("switch", { name: /store closed/i })).toHaveAttribute("aria-checked", "false")
  })
})
