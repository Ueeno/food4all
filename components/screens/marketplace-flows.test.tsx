import { useEffect, useRef, type ReactNode } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  AppStateProvider,
  useAppState,
  type AuthRole,
  type CartItem,
} from "@/lib/app-state"
import type { Order } from "@/lib/types"
import type { ApiOrder } from "@/lib/api-contracts"
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
import {
  API_SELLER_REPORTS,
  API_SELLER_PROFILE,
  apiErrorResponse,
  apiSuccessResponse,
  installMarketplaceFetchMock,
} from "@/test/api-fetch-mock"

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

const READY_API_ORDER: ApiOrder = {
  id: "ORD-SQL-READY",
  buyer: "Test Buyer",
  buyerId: "buyer-1",
  sellerId: "seller-1",
  product: "SQL Tender Juicy Hotdog",
  quantity: 2,
  total: 370,
  status: "ready",
  pickupDate: "2030-06-01",
  pickupTime: "2:00 PM",
  pickupCode: "****7X29",
  pickupLocation: "SQL Magsaysay Market, Poblacion District, Davao City",
  items: [
    {
      id: "item-1",
      orderId: "ORD-SQL-READY",
      productId: "p1",
      productName: "SQL Tender Juicy Hotdog",
      quantity: 2,
      unitPrice: 185,
      originalUnitPrice: 285,
      subtotal: 370,
    },
  ],
  createdAt: "2030-06-01T00:00:00.000Z",
  updatedAt: "2030-06-01T00:00:00.000Z",
}

const PENDING_API_ORDER: ApiOrder = {
  ...READY_API_ORDER,
  id: "ORD-SQL-PENDING",
  product: "SQL Breakfast Bundle",
  quantity: 1,
  total: 220,
  status: "reserved",
  pickupDate: "2030-06-02",
  pickupTime: "11:00 AM",
  pickupCode: "****1111",
  items: [
    {
      ...READY_API_ORDER.items[0]!,
      id: "item-2",
      orderId: "ORD-SQL-PENDING",
      productName: "SQL Breakfast Bundle",
      quantity: 1,
      unitPrice: 220,
      originalUnitPrice: 320,
      subtotal: 220,
    },
  ],
}

function getStoredCartItems() {
  const rawCart = localStorage.getItem(LOCAL_STORAGE_KEYS.cartItems)
  return rawCart ? (JSON.parse(rawCart) as CartItem[]) : []
}

function fetchCallPath(input: RequestInfo | URL) {
  if (typeof input === "string") return input
  if (input instanceof URL) return input.pathname
  return new URL(input.url, "http://localhost").pathname
}

function StateProbe() {
  const {
    cartCount,
    cartTotal,
    screen: currentScreen,
    selectedOrder,
    selectedOrderId,
    selectedProductId,
    selectedRole,
  } = useAppState()

  return (
    <div aria-label="app state probe">
      <span data-testid="screen">{currentScreen}</span>
      <span data-testid="selected-role">{selectedRole ?? "none"}</span>
      <span data-testid="selected-product">{selectedProductId ?? "none"}</span>
      <span data-testid="selected-order-id">{selectedOrderId ?? "none"}</span>
      <span data-testid="selected-order-pickup-time">{selectedOrder?.pickupTime ?? "none"}</span>
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

  useEffect(() => {
    if (selectedProductId !== productId) {
      selectProduct(productId)
    }
  }, [productId, selectProduct, selectedProductId])

  return null
}

function SeedSelectedOrder({ order }: { order: Order }) {
  const { selectOrder, selectedOrder } = useAppState()

  useEffect(() => {
    if (selectedOrder?.id !== order.id) {
      selectOrder(order)
    }
  }, [order, selectOrder, selectedOrder?.id])

  return null
}

function SeedSelectedOrderId({ orderId }: { orderId: string }) {
  const { selectOrderId, selectedOrderId } = useAppState()

  useEffect(() => {
    if (selectedOrderId !== orderId) {
      selectOrderId(orderId)
    }
  }, [orderId, selectOrderId, selectedOrderId])

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

function CheckoutPickupHarness() {
  const { screen: currentScreen } = useAppState()

  return currentScreen === "buyer-pickup-qr" ? <BuyerPickupQRScreen /> : <BuyerCheckoutScreen />
}

function CartCheckoutPickupHarness() {
  const { screen: currentScreen } = useAppState()

  if (currentScreen === "buyer-checkout") return <BuyerCheckoutScreen />
  if (currentScreen === "buyer-pickup-qr") return <BuyerPickupQRScreen />
  return <BuyerCartScreen />
}

function OrdersPickupHarness() {
  const { screen: currentScreen } = useAppState()

  return currentScreen === "buyer-pickup-qr" ? <BuyerPickupQRScreen /> : <BuyerOrdersScreen />
}

beforeEach(() => {
  installMarketplaceFetchMock()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe("rendered buyer marketplace flow", () => {
  it("renders buyer product cards from the product service boundary", async () => {
    renderWithAppState(<BuyerProductListScreen />, <SeedRole role="buyer" />)

    expect(await screen.findByRole("heading", { name: /browse products/i })).toBeInTheDocument()
    expect(
      await screen.findByRole("button", { name: /Purefoods Tender Juicy Hotdog/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /CDO Farmhouse Tocino/i })).toBeInTheDocument()
  })

  it("renders product detail add-to-cart action and updates backend cart state", async () => {
    const fetchMock = installMarketplaceFetchMock()

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
    await waitFor(() => {
      expect(screen.getByTestId("cart-count")).toHaveTextContent("1")
    })
    expect(fetchMock.mock.calls.map(([path]) => path)).toContain("/api/cart/items")
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.cartItems)).toBeNull()
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
    await waitFor(() => {
      expect(screen.getByTestId("cart-count")).toHaveTextContent("2")
    })

    fireEvent.click(screen.getByRole("button", { name: /add to cart/i }))

    await waitFor(() => {
      expect(screen.getByTestId("cart-count")).toHaveTextContent("3")
      expect(screen.getByTestId("cart-total")).toHaveTextContent("555")
    })
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
    await waitFor(() => {
      expect(screen.getByTestId("cart-count")).toHaveTextContent("2")
    })
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

    await waitFor(() => {
      expect(screen.getByLabelText("Quantity for Purefoods Tender Juicy Hotdog")).toHaveTextContent("3")
      expect(screen.getByTestId("cart-count")).toHaveTextContent("3")
      expect(screen.getByTestId("cart-total")).toHaveTextContent("555")
    })
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.cartItems)).toBeNull()

    fireEvent.click(
      screen.getByRole("button", { name: /decrease quantity for purefoods tender juicy hotdog/i }),
    )

    await waitFor(() => {
      expect(screen.getByLabelText("Quantity for Purefoods Tender Juicy Hotdog")).toHaveTextContent("2")
      expect(screen.getByTestId("cart-count")).toHaveTextContent("2")
      expect(screen.getByTestId("cart-total")).toHaveTextContent("370")
    })
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.cartItems)).toBeNull()
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
    await waitFor(() => {
      expect(screen.getByTestId("selected-role")).toHaveTextContent("buyer")
    })

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
    await waitFor(() => {
      expect(screen.getByTestId("cart-count")).toHaveTextContent("3")
    })
    fireEvent.click(screen.getByRole("button", { name: /reserve & checkout/i }))

    expect(screen.getByRole("heading", { name: /checkout/i })).toBeInTheDocument()
    expect(screen.getByText(/185.*3/)).toBeInTheDocument()
    expect(screen.getByTestId("cart-count")).toHaveTextContent("3")
    expect(screen.getByTestId("cart-total")).toHaveTextContent("555")
  })

  it("renders checkout summary and confirms the reservation through the order API", async () => {
    renderWithAppState(
      <CheckoutPickupHarness />,
      <>
        <SeedRole role="buyer" />
        <SeedCartItem />
      </>,
    )

    expect(await screen.findByRole("heading", { name: /checkout/i })).toBeInTheDocument()
    expect(screen.getByText("Order Summary")).toBeInTheDocument()
    expect(screen.getByText(/Purefoods Tender Juicy Hotdog/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /confirm reservation/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /confirm reservation/i }))

    await waitFor(() => {
      expect(screen.getByTestId("cart-count")).toHaveTextContent("0")
    })
    expect(screen.getByTestId("screen")).toHaveTextContent("buyer-pickup-qr")
    expect(screen.getByRole("heading", { name: /show qr at store/i })).toBeInTheDocument()
    expect(screen.getAllByText(/ORD-MOCK-/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Purefoods Tender Juicy Hotdog/)).toBeInTheDocument()
    expect(screen.getByLabelText(/qr code for pickup code f4a-mock/i)).toBeInTheDocument()
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.cartItems)).toBeNull()
  })

  it("uses the selected pickup slot for checkout order creation and pickup QR", async () => {
    const fetchMock = installMarketplaceFetchMock()

    renderWithAppState(
      <CartCheckoutPickupHarness />,
      <>
        <SeedRole role="buyer" />
        <SeedCartItem />
      </>,
    )

    expect(await screen.findByText("Purefoods Tender Juicy Hotdog")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /tomorrow 10:00 am/i }))
    expect(screen.getByText("Pickup: Tomorrow 10:00 AM")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /reserve & checkout/i }))

    expect(screen.getByRole("heading", { name: /checkout/i })).toBeInTheDocument()
    expect(screen.getByText("Tomorrow 10:00 AM")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /confirm reservation/i }))

    await waitFor(() => {
      expect(screen.getByTestId("screen")).toHaveTextContent("buyer-pickup-qr")
    })

    const orderCall = fetchMock.mock.calls.find(([path]) => fetchCallPath(path) === "/api/orders")
    const orderInit = orderCall?.[1] as RequestInit
    const orderBody = JSON.parse(String(orderInit.body)) as {
      pickupDate: string
      pickupTime: string
    }

    expect(orderBody.pickupTime).toBe("10:00 AM")
    expect(Number.isNaN(new Date(orderBody.pickupDate).getTime())).toBe(false)
    expect(screen.getByTestId("selected-order-pickup-time")).toHaveTextContent("10:00 AM")
    expect(screen.getAllByText(/10:00 AM/).length).toBeGreaterThan(0)
  })

  it("shows a visible checkout error when the order API fails", async () => {
    const baseFetch = installMarketplaceFetchMock()
    const failingFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
      const url = new URL(requestUrl, "http://localhost")

      if (url.pathname === "/api/orders" && (init?.method ?? "GET") === "POST") {
        return apiErrorResponse("CONFLICT", "Your cart is empty.", 409)
      }

      return baseFetch(input, init)
    })

    vi.stubGlobal("fetch", failingFetch)

    renderWithAppState(
      <BuyerCheckoutScreen />,
      <>
        <SeedRole role="buyer" />
        <SeedCartItem />
      </>,
    )

    expect(await screen.findByRole("heading", { name: /checkout/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /confirm reservation/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Your cart is empty.")
    expect(screen.getByTestId("screen")).not.toHaveTextContent("buyer-pickup-qr")
  })

  it("keeps local cart fallback when the cart API is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("Cart API unavailable")
      }),
    )

    renderWithAppState(<BuyerCartScreen />, <SeedCartItem />)

    expect(await screen.findByText("Purefoods Tender Juicy Hotdog")).toBeInTheDocument()
    expect(screen.getByTestId("cart-count")).toHaveTextContent("2")
    expect(getStoredCartItems()).toMatchObject([{ id: "p1", quantity: 2 }])
  })
})

describe("rendered remaining buyer flows", () => {
  it("shows a loading state while buyer orders load", async () => {
    const baseFetch = installMarketplaceFetchMock()
    let resolveOrders!: (response: Response) => void
    const ordersResponse = new Promise<Response>((resolve) => {
      resolveOrders = resolve
    })
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
      const url = new URL(requestUrl, "http://localhost")

      if (url.pathname === "/api/orders" && (init?.method ?? "GET") === "GET") {
        return ordersResponse
      }

      return baseFetch(input, init)
    })

    vi.stubGlobal("fetch", fetchMock)
    renderWithAppState(<OrdersPickupHarness />, <SeedRole role="buyer" />)

    expect(screen.getByRole("heading", { name: /my orders/i })).toBeInTheDocument()
    expect(screen.getByText("Loading orders...")).toBeInTheDocument()

    resolveOrders(apiSuccessResponse<{ orders: ApiOrder[] }>({ orders: [] }))

    await waitFor(() => {
      expect(screen.queryByText("Loading orders...")).not.toBeInTheDocument()
    })
  })

  it("renders buyer orders returned by the SQL-backed order service", async () => {
    const baseFetch = installMarketplaceFetchMock()
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
      const url = new URL(requestUrl, "http://localhost")

      if (url.pathname === "/api/orders" && (init?.method ?? "GET") === "GET") {
        return Promise.resolve(
          apiSuccessResponse<{ orders: ApiOrder[] }>({
            orders: [READY_API_ORDER, PENDING_API_ORDER],
          }),
        )
      }

      return baseFetch(input, init)
    })

    vi.stubGlobal("fetch", fetchMock)
    renderWithAppState(<OrdersPickupHarness />, <SeedRole role="buyer" />)

    expect(await screen.findByText("SQL Tender Juicy Hotdog")).toBeInTheDocument()
    expect(screen.getByText("Total Orders")).toBeInTheDocument()
    expect(screen.getByText("Total Saved")).toBeInTheDocument()
    expect(screen.getByText("Waste Saved")).toBeInTheDocument()
    expect(screen.getByText("****7X29")).toBeInTheDocument()
    expect(screen.getByText("Show QR")).toBeInTheDocument()
    expect(screen.queryByText(/Magsaysay Meat Depot/)).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith("/api/orders", expect.any(Object))

    fireEvent.click(screen.getByRole("button", { name: /pending/i }))

    expect(screen.getByRole("button", { name: /order ord-sql-pending, pending/i })).toBeInTheDocument()
    expect(screen.getByText("SQL Breakfast Bundle")).toBeInTheDocument()
    expect(screen.getByText(/Pickup scheduled: 2030-06-02 at 11:00 AM/)).toBeInTheDocument()
  })

  it("shows an empty state when the buyer order service returns no orders", async () => {
    renderWithAppState(<BuyerOrdersScreen />, <SeedRole role="buyer" />)

    expect(await screen.findByText("No orders yet")).toBeInTheDocument()
    expect(screen.getByText("Your order history will appear here after you reserve food.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /browse deals/i })).toBeInTheDocument()
  })

  it("shows a visible error and can retry buyer order loading", async () => {
    const baseFetch = installMarketplaceFetchMock()
    let orderReads = 0
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
      const url = new URL(requestUrl, "http://localhost")

      if (url.pathname === "/api/orders" && (init?.method ?? "GET") === "GET") {
        orderReads += 1

        return Promise.resolve(
          orderReads === 1
            ? apiErrorResponse("SERVER_ERROR", "Orders are unavailable.", 500)
            : apiSuccessResponse<{ orders: ApiOrder[] }>({ orders: [READY_API_ORDER] }),
        )
      }

      return baseFetch(input, init)
    })

    vi.stubGlobal("fetch", fetchMock)
    renderWithAppState(<BuyerOrdersScreen />, <SeedRole role="buyer" />)

    expect(await screen.findByRole("alert")).toHaveTextContent("Orders are unavailable.")
    fireEvent.click(screen.getByRole("button", { name: /try again/i }))

    expect(await screen.findByText("SQL Tender Juicy Hotdog")).toBeInTheDocument()
  })

  it("keeps ready order navigation to the pickup QR screen", async () => {
    const baseFetch = installMarketplaceFetchMock()
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
      const url = new URL(requestUrl, "http://localhost")

      if (url.pathname === "/api/orders" && (init?.method ?? "GET") === "GET") {
        return Promise.resolve(apiSuccessResponse<{ orders: ApiOrder[] }>({ orders: [READY_API_ORDER] }))
      }

      return baseFetch(input, init)
    })

    vi.stubGlobal("fetch", fetchMock)
    renderWithAppState(<OrdersPickupHarness />, <SeedRole role="buyer" />)

    const readyOrder = await screen.findByRole("button", { name: /order ord-sql-ready, ready/i })

    fireEvent.click(readyOrder)

    await waitFor(() => {
      expect(screen.getByTestId("screen")).toHaveTextContent("buyer-pickup-qr")
      expect(screen.getByRole("heading", { name: /show qr at store/i })).toBeInTheDocument()
    })
    expect(screen.getByText(/SQL Tender Juicy Hotdog/)).toBeInTheDocument()
    expect(screen.getAllByText(/ORD-SQL-READY/).length).toBeGreaterThan(0)
    expect(screen.getByLabelText(/qr code for pickup code \*\*\*\*7x29/i)).toBeInTheDocument()
  })

  it("renders selected SQL-backed order details in the pickup QR screen", async () => {
    const order: Order = {
      id: "ORD-SELECTED-QR",
      buyer: "Test Buyer",
      product: "Selected SQL Pickup Bundle",
      quantity: 4,
      total: 740,
      status: "ready",
      pickupDate: "2030-06-03",
      pickupTime: "4:00 PM",
      pickupCode: "F4A-SQL1",
      pickupLocation: "Selected SQL Pickup Counter",
    }

    renderWithAppState(
      <BuyerPickupQRScreen />,
      <>
        <SeedRole role="buyer" />
        <SeedSelectedOrder order={order} />
      </>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("selected-role")).toHaveTextContent("buyer")
      expect(screen.getByRole("heading", { name: /show qr at store/i })).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/qr code for pickup code f4a-sql1/i)).toBeInTheDocument()
    expect(screen.getByText("Pickup Code")).toBeInTheDocument()
    expect(screen.getAllByText(/ORD-SELECTED-QR/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Selected SQL Pickup Bundle/)).toBeInTheDocument()
    expect(screen.getByText(/2030-06-03.*4:00 PM/)).toBeInTheDocument()
    expect(screen.getByText("Selected SQL Pickup Counter")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /share pickup qr/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /claim pickup/i }))

    expect(screen.getByRole("heading", { name: /pickup complete/i })).toBeInTheDocument()
    expect(screen.getByText(/Selected SQL Pickup Bundle/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /view all orders/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /view all orders/i }))

    expect(screen.getByTestId("screen")).toHaveTextContent("buyer-orders")
  })

  it("fetches pickup order detail when only selected order id is available", async () => {
    const baseFetch = installMarketplaceFetchMock()
    const detailOrder: ApiOrder = {
      ...READY_API_ORDER,
      id: "ORD-DEEP-LINK",
      pickupTime: "5:15 PM",
      pickupCode: "F4A-DEEP",
      pickupLocation: "Deep Link Pickup Counter",
    }
    let resolveDetail!: (response: Response) => void
    const detailResponse = new Promise<Response>((resolve) => {
      resolveDetail = resolve
    })
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
      const url = new URL(requestUrl, "http://localhost")

      if (url.pathname === "/api/orders/ORD-DEEP-LINK") {
        return detailResponse
      }

      return baseFetch(input, init)
    })

    vi.stubGlobal("fetch", fetchMock)
    renderWithAppState(
      <BuyerPickupQRScreen />,
      <SeedSelectedOrderId orderId="ORD-DEEP-LINK" />,
    )

    expect(await screen.findByText("Loading pickup details...")).toBeInTheDocument()

    resolveDetail(apiSuccessResponse<{ order: ApiOrder }>({ order: detailOrder }))

    expect(await screen.findByRole("heading", { name: /show qr at store/i })).toBeInTheDocument()
    expect(screen.getAllByText(/ORD-DEEP-LINK/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/5:15 PM/).length).toBeGreaterThan(0)
    expect(screen.getByText("Deep Link Pickup Counter")).toBeInTheDocument()
    expect(screen.getByLabelText(/qr code for pickup code f4a-deep/i)).toBeInTheDocument()
    expect(screen.getByTestId("selected-order-id")).toHaveTextContent("ORD-DEEP-LINK")
    expect(screen.getByTestId("selected-order-pickup-time")).toHaveTextContent("5:15 PM")
    expect(fetchMock.mock.calls.map(([path]) => fetchCallPath(path))).toContain("/api/orders/ORD-DEEP-LINK")
  })

  it("shows pickup detail errors and retries by selected order id", async () => {
    const baseFetch = installMarketplaceFetchMock()
    const detailOrder: ApiOrder = {
      ...READY_API_ORDER,
      id: "ORD-RETRY",
      pickupLocation: "Retry Pickup Counter",
    }
    let detailReads = 0
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
      const url = new URL(requestUrl, "http://localhost")

      if (url.pathname === "/api/orders/ORD-RETRY") {
        detailReads += 1

        return Promise.resolve(
          detailReads === 1
            ? apiErrorResponse("SERVER_ERROR", "Pickup detail is unavailable.", 500)
            : apiSuccessResponse<{ order: ApiOrder }>({ order: detailOrder }),
        )
      }

      return baseFetch(input, init)
    })

    vi.stubGlobal("fetch", fetchMock)
    renderWithAppState(
      <BuyerPickupQRScreen />,
      <SeedSelectedOrderId orderId="ORD-RETRY" />,
    )

    expect(await screen.findByRole("alert")).toHaveTextContent("Pickup detail is unavailable.")

    fireEvent.click(screen.getByRole("button", { name: /try again/i }))

    expect(await screen.findByRole("heading", { name: /show qr at store/i })).toBeInTheDocument()
    expect(screen.getByText("Retry Pickup Counter")).toBeInTheDocument()
    expect(detailReads).toBeGreaterThanOrEqual(2)
  })

  it("shows a safe pickup fallback when no order is selected", () => {
    renderWithAppState(<BuyerPickupQRScreen />, <SeedRole role="buyer" />)

    expect(screen.getByRole("heading", { name: /pickup qr/i })).toBeInTheDocument()
    expect(screen.getByText("No pickup order selected")).toBeInTheDocument()
    expect(screen.getByText("Open a ready order from My Orders or complete checkout to view pickup details.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /view orders/i })).toBeInTheDocument()
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

  it("renders seller products from the backend-backed seller service", async () => {
    const fetchMock = installMarketplaceFetchMock()

    renderWithAppState(<SellerProductsScreen />, <SeedRole role="seller" />)

    expect(await screen.findByRole("heading", { name: /my products/i })).toBeInTheDocument()
    expect(screen.getByText("Purefoods Tender Juicy Hotdog")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /edit purefoods tender juicy hotdog/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /delete purefoods tender juicy hotdog/i })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith("/api/seller/products", expect.any(Object))
  })

  it("opens a prefilled seller product edit form and can cancel it", async () => {
    renderWithAppState(<SellerProductsScreen />, <SeedRole role="seller" />)

    expect(await screen.findByText("Purefoods Tender Juicy Hotdog")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /edit purefoods tender juicy hotdog/i }))

    expect(screen.getByRole("heading", { name: /edit product/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/product name/i)).toHaveValue("Purefoods Tender Juicy Hotdog")
    expect(screen.getByLabelText(/^brand$/i)).toHaveValue("Purefoods")
    expect(screen.getByLabelText(/original price/i)).toHaveValue(285)
    expect(screen.getByLabelText(/discounted price/i)).toHaveValue(185)
    expect(screen.getByLabelText(/available quantity/i)).toHaveValue(48)

    fireEvent.click(screen.getAllByRole("button", { name: /cancel/i })[0]!)

    expect(screen.queryByRole("heading", { name: /edit product/i })).not.toBeInTheDocument()
  })

  it("blocks invalid seller product edits with visible validation errors", async () => {
    renderWithAppState(<SellerProductsScreen />, <SeedRole role="seller" />)

    expect(await screen.findByText("Purefoods Tender Juicy Hotdog")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /edit purefoods tender juicy hotdog/i }))
    fireEvent.change(screen.getByLabelText(/product name/i), { target: { value: "" } })
    fireEvent.change(screen.getByLabelText(/discounted price/i), { target: { value: "500" } })
    fireEvent.change(screen.getByLabelText(/available quantity/i), { target: { value: "1.5" } })
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }))

    expect(screen.getByText("Product name is required.")).toBeInTheDocument()
    expect(screen.getByText("Discount must be between 0 and 100%.")).toBeInTheDocument()
    expect(screen.getByText("Quantity must be a non-negative whole number.")).toBeInTheDocument()
  })

  it("saves seller product edits through the update API and refreshes the list", async () => {
    const fetchMock = installMarketplaceFetchMock()

    renderWithAppState(<SellerProductsScreen />, <SeedRole role="seller" />)

    expect(await screen.findByText("Purefoods Tender Juicy Hotdog")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /edit purefoods tender juicy hotdog/i }))
    fireEvent.change(screen.getByLabelText(/product name/i), {
      target: { value: "Task 021 Updated Hotdog" },
    })
    fireEvent.change(screen.getByLabelText(/discounted price/i), { target: { value: "175" } })
    fireEvent.change(screen.getByLabelText(/available quantity/i), { target: { value: "9" } })
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }))

    expect(await screen.findByRole("status")).toHaveTextContent("Task 021 Updated Hotdog was updated.")
    expect(screen.queryByRole("heading", { name: /edit product/i })).not.toBeInTheDocument()
    expect(screen.getByText("Task 021 Updated Hotdog")).toBeInTheDocument()
    expect(screen.getByText("9 left")).toBeInTheDocument()
    expect(fetchMock.mock.calls.map(([path]) => fetchCallPath(path)).filter((path) => path.startsWith("/api/seller/products"))).toEqual([
      "/api/seller/products",
      "/api/seller/products/p1",
      "/api/seller/products",
    ])

    const patchCall = fetchMock.mock.calls.find(([path]) => fetchCallPath(path) === "/api/seller/products/p1")
    const patchInit = patchCall?.[1] as RequestInit

    expect(patchInit.method).toBe("PATCH")
    expect(JSON.parse(String(patchInit.body))).toMatchObject({
      name: "Task 021 Updated Hotdog",
      discountedPrice: 175,
      quantity: 9,
    })
  })

  it("shows seller product edit API failures without closing the form", async () => {
    const baseFetch = installMarketplaceFetchMock()
    const failingFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
      const url = new URL(requestUrl, "http://localhost")

      if (url.pathname === "/api/seller/products/p1" && init?.method === "PATCH") {
        return apiErrorResponse("VALIDATION_ERROR", "Please fix the highlighted fields.", 422, {
          name: "Product name is required.",
        })
      }

      return baseFetch(input, init)
    })

    vi.stubGlobal("fetch", failingFetch)
    renderWithAppState(<SellerProductsScreen />, <SeedRole role="seller" />)

    expect(await screen.findByText("Purefoods Tender Juicy Hotdog")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /edit purefoods tender juicy hotdog/i }))
    fireEvent.change(screen.getByLabelText(/product name/i), {
      target: { value: "Backend Rejected Hotdog" },
    })
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Please fix the highlighted fields.")
    expect(screen.getByText("Product name is required.")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /edit product/i })).toBeInTheDocument()
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

  it("marks a reserved order as ready and updates UI", async () => {
    renderWithAppState(<SellerOrdersScreen />, <SeedRole role="seller" />)

    expect(await screen.findByRole("heading", { name: /orders/i })).toBeInTheDocument()
    
    // In "New" tab (default)
    expect(screen.getByText("ORD-2847")).toBeInTheDocument()

    // Click "Mark Ready"
    fireEvent.click(screen.getAllByRole("button", { name: /mark ready/i })[0]!)

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()

    // Order should disappear from "New" tab
    await waitFor(() => {
      expect(screen.queryByText("ORD-2847")).not.toBeInTheDocument()
    })

    // Click "Ready" tab
    fireEvent.click(screen.getAllByRole("button", { name: /ready/i })[0]!)

    // Order should now be in the "Ready" tab
    expect(await screen.findByText("ORD-2847")).toBeInTheDocument()
  })

  it("shows an error if marking an order as ready fails", async () => {
    const baseFetch = installMarketplaceFetchMock()
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
      const url = new URL(requestUrl, "http://localhost")

      if (url.pathname.match(/\/api\/seller\/orders\/.+\/status$/) && init?.method === "PATCH") {
        return Promise.resolve(apiErrorResponse("SERVER_ERROR", "Failed to update order status.", 500))
      }

      return baseFetch(input, init)
    })

    vi.stubGlobal("fetch", fetchMock)
    renderWithAppState(<SellerOrdersScreen />, <SeedRole role="seller" />)

    expect(await screen.findByRole("heading", { name: /orders/i })).toBeInTheDocument()
    expect(screen.getByText("ORD-2850")).toBeInTheDocument()

    const markReadyButtons = screen.getAllByRole("button", { name: /mark ready/i })
    fireEvent.click(markReadyButtons[markReadyButtons.length - 1]!) // click the one for ORD-2850

    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to update order status.")
    
    // Order should still be in "New" tab since it failed
    expect(screen.getByText("ORD-2850")).toBeInTheDocument()
  })

  it("shows a visible error and can retry seller order loading", async () => {
    const baseFetch = installMarketplaceFetchMock()
    let orderReads = 0
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
      const url = new URL(requestUrl, "http://localhost")

      if (url.pathname === "/api/seller/orders" && (init?.method ?? "GET") === "GET") {
        orderReads += 1

        return Promise.resolve(
          orderReads === 1
            ? apiErrorResponse("SERVER_ERROR", "Orders are unavailable.", 500)
            : baseFetch(input, init),
        )
      }

      return baseFetch(input, init)
    })

    vi.stubGlobal("fetch", fetchMock)
    renderWithAppState(<SellerOrdersScreen />, <SeedRole role="seller" />)

    expect(await screen.findByRole("alert")).toHaveTextContent("Orders are unavailable.")
    fireEvent.click(screen.getByRole("button", { name: /try again/i }))

    expect(await screen.findByRole("heading", { name: /orders/i })).toBeInTheDocument()
    expect(screen.getByText("ORD-2847")).toBeInTheDocument()
  })

  it("renders seller pickup verification and shows validation errors", async () => {
    renderWithAppState(<SellerVerifyPickupScreen />, <SeedRole role="seller" />)

    expect(screen.getByRole("heading", { name: /verify pickup/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/pickup code input/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /confirm pickup/i }))

    expect(screen.getByText("Pickup code is required.")).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/pickup code input/i), {
      target: { value: "BAD" },
    })
    fireEvent.click(screen.getByRole("button", { name: /confirm pickup/i }))

    expect(screen.getByText("Enter a valid pickup code.")).toBeInTheDocument()
  })

  it("shows an API error when pickup verification fails", async () => {
    const baseFetch = installMarketplaceFetchMock()
    const failingFetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
      const url = new URL(requestUrl, "http://localhost")

      if (url.pathname === "/api/pickup/verify") {
        return Promise.resolve(apiErrorResponse("NOT_FOUND", "Pickup code was not found.", 404))
      }

      return baseFetch(input, init)
    })

    vi.stubGlobal("fetch", failingFetch)
    renderWithAppState(<SellerVerifyPickupScreen />, <SeedRole role="seller" />)

    fireEvent.change(screen.getByLabelText(/pickup code input/i), {
      target: { value: "F4A-BAD0" },
    })
    fireEvent.click(screen.getByRole("button", { name: /confirm pickup/i }))

    expect(await screen.findByText("Pickup code was not found.")).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: /pickup confirmed/i })).not.toBeInTheDocument()
  })

  it("calls the pickup verification API and shows success for a backend-valid code", async () => {
    const fetchMock = installMarketplaceFetchMock()
    renderWithAppState(<SellerVerifyPickupScreen />, <SeedRole role="seller" />)

    fireEvent.change(screen.getByLabelText(/pickup code input/i), {
      target: { value: "F4A-3K85" },
    })
    fireEvent.click(screen.getByRole("button", { name: /confirm pickup/i }))

    expect(await screen.findByRole("heading", { name: /pickup confirmed/i })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith("/api/pickup/verify", expect.any(Object))
    expect(screen.getByText(/ORD-2848/)).toBeInTheDocument()
    expect(screen.getByText("Juan dela Cruz")).toBeInTheDocument()
    expect(screen.getByText(/CDO Farmhouse Tocino x5/)).toBeInTheDocument()
    expect(screen.getByText("F4A-3K85")).toBeInTheDocument()
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

  it("renders seller add-product form and submits through the seller service", async () => {
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
      target: { value: "Task 019 Seller Hotdog" },
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

    expect(await screen.findByRole("status")).toHaveTextContent("Product listing published.")
    await waitFor(() => {
      expect(screen.getByTestId("screen")).toHaveTextContent("seller-products")
    })
  })

  it("shows a visible seller add-product API failure", async () => {
    const baseFetch = installMarketplaceFetchMock()
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const requestUrl =
          typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
        const url = new URL(requestUrl, "http://localhost")
        const method = input instanceof Request ? input.method : init?.method

        if (url.pathname === "/api/seller/products" && method === "POST") {
          return apiErrorResponse("VALIDATION_ERROR", "Please fix the highlighted fields.", 422, {
            brand: "Brand is required.",
          })
        }

        return baseFetch(input, init)
      }),
    )
    renderWithAppState(<SellerAddProductScreen />, <SeedRole role="seller" />)

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

    fireEvent.click(screen.getByRole("button", { name: /publish listing/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Please fix the highlighted fields.")
    expect(screen.getByText("Brand is required.")).toBeInTheDocument()
    expect(screen.getByTestId("screen")).not.toHaveTextContent("seller-products")
  })

  it("shows a loading state while seller reports load", async () => {
    const baseFetch = installMarketplaceFetchMock()
    let resolveReports!: (response: Response) => void
    const reportsResponse = new Promise<Response>((resolve) => {
      resolveReports = resolve
    })
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
      const url = new URL(requestUrl, "http://localhost")

      if (url.pathname === "/api/seller/reports") return reportsResponse

      return baseFetch(input, init)
    })

    vi.stubGlobal("fetch", fetchMock)
    renderWithAppState(<SellerReportsScreen />, <SeedRole role="seller" />)

    expect(screen.getByText("Loading seller reports...")).toBeInTheDocument()
    resolveReports(apiSuccessResponse(API_SELLER_REPORTS))

    expect(await screen.findByRole("heading", { name: /sales reports/i })).toBeInTheDocument()
  })

  it("renders seller reports from the SQL-backed report service", async () => {
    const fetchMock = installMarketplaceFetchMock()

    renderWithAppState(<SellerReportsScreen />, <SeedRole role="seller" />)

    expect(await screen.findByRole("heading", { name: /sales reports/i })).toBeInTheDocument()
    expect(screen.getByText("Weekly Revenue")).toBeInTheDocument()
    expect(screen.getByText("₱9,240")).toBeInTheDocument()
    expect(screen.getByText("Total Orders")).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()
    expect(screen.getByText(/Daily Revenue/)).toBeInTheDocument()
    expect(screen.getByRole("img", { name: /Sat:.*2250/i })).toBeInTheDocument()
    expect(screen.queryByRole("img", { name: /Sat:.*5200/i })).not.toBeInTheDocument()
    expect(screen.getByText("Environmental Impact")).toBeInTheDocument()
    expect(screen.getByText("Food Waste Reduced")).toBeInTheDocument()
    expect(screen.getByText("Recovery Earnings")).toBeInTheDocument()
    expect(screen.getByText("₱18,420")).toBeInTheDocument()
    expect(screen.getByText(/0 meals/)).toBeInTheDocument()
    expect(screen.getByText("Best-Selling Items")).toBeInTheDocument()
    expect(screen.getByText("Purefoods Tender Juicy Hotdog")).toBeInTheDocument()
    expect(screen.getByText("11 sold")).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith("/api/seller/reports", expect.any(Object))
  })

  it("shows an empty seller reports state when no completed sales exist", async () => {
    const baseFetch = installMarketplaceFetchMock()
    const emptyReports = {
      revenue: {
        weekly: 0,
        totalOrders: 0,
        recoveryEarnings: 0,
      },
      waste: {
        reducedKg: 0,
        mealsSavedEstimate: 0,
      },
      weeklyBreakdown: API_SELLER_REPORTS.weeklyBreakdown.map((day) => ({
        ...day,
        sales: 0,
        orders: 0,
      })),
      topProducts: [],
    }
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
      const url = new URL(requestUrl, "http://localhost")

      if (url.pathname === "/api/seller/reports") {
        return Promise.resolve(apiSuccessResponse(emptyReports))
      }

      return baseFetch(input, init)
    })

    vi.stubGlobal("fetch", fetchMock)
    renderWithAppState(<SellerReportsScreen />, <SeedRole role="seller" />)

    expect(await screen.findByText("No completed product sales yet")).toBeInTheDocument()
    expect(screen.getAllByText("₱0").length).toBeGreaterThan(0)
  })

  it("shows a visible reports error and can retry", async () => {
    const baseFetch = installMarketplaceFetchMock()
    let reportReads = 0
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
      const url = new URL(requestUrl, "http://localhost")

      if (url.pathname === "/api/seller/reports") {
        reportReads += 1
        return Promise.resolve(
          reportReads === 1
            ? apiErrorResponse("SERVER_ERROR", "Reports are unavailable.", 500)
            : apiSuccessResponse(API_SELLER_REPORTS),
        )
      }

      return baseFetch(input, init)
    })

    vi.stubGlobal("fetch", fetchMock)
    renderWithAppState(<SellerReportsScreen />, <SeedRole role="seller" />)

    expect(await screen.findByRole("alert")).toHaveTextContent("Reports are unavailable.")

    fireEvent.click(screen.getByRole("button", { name: /try again/i }))

    expect(await screen.findByRole("heading", { name: /sales reports/i })).toBeInTheDocument()
    expect(screen.getByText("₱9,240")).toBeInTheDocument()
  })

  it("shows a loading state while seller profile loads", async () => {
    const baseFetch = installMarketplaceFetchMock()
    let resolveProfile!: (response: Response) => void
    const profileResponse = new Promise<Response>((resolve) => {
      resolveProfile = resolve
    })
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
      const url = new URL(requestUrl, "http://localhost")

      if (url.pathname === "/api/seller/profile") return profileResponse

      return baseFetch(input, init)
    })

    vi.stubGlobal("fetch", fetchMock)
    renderWithAppState(<SellerProfileScreen />, <SeedRole role="seller" />)

    expect(screen.getByText("Loading seller profile...")).toBeInTheDocument()
    resolveProfile(apiSuccessResponse({ seller: API_SELLER_PROFILE }))

    expect(await screen.findByRole("heading", { name: /store profile/i })).toBeInTheDocument()
  })

  it("renders seller profile details from the SQL-backed profile service", async () => {
    const fetchMock = installMarketplaceFetchMock()

    renderWithAppState(<SellerProfileScreen />, <SeedRole role="seller" />)

    expect(await screen.findByRole("heading", { name: /store profile/i })).toBeInTheDocument()
    expect(screen.getByText("SQL Magsaysay Meat Depot")).toBeInTheDocument()
    expect(screen.getByText("Verified Seller")).toBeInTheDocument()
    expect(screen.getByText(/SQL Magsaysay Market/)).toBeInTheDocument()
    expect(screen.getByText("+63 912 000 1111")).toBeInTheDocument()
    expect(screen.getByText("Business Hours")).toBeInTheDocument()
    expect(screen.getByText(/Mon.*Fri/)).toBeInTheDocument()
    expect(screen.getByText("Store Status")).toBeInTheDocument()
    expect(screen.getByText("Visible to buyers")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /edit profile/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /edit store info/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /seller support/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith("/api/seller/profile", expect.any(Object))
  })

  it("shows a visible seller profile error and can retry", async () => {
    const baseFetch = installMarketplaceFetchMock()
    let profileReads = 0
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
      const url = new URL(requestUrl, "http://localhost")

      if (url.pathname === "/api/seller/profile" && (init?.method ?? "GET") === "GET") {
        profileReads += 1
        return Promise.resolve(
          profileReads === 1
            ? apiErrorResponse("SERVER_ERROR", "Profile is unavailable.", 500)
            : apiSuccessResponse({ seller: API_SELLER_PROFILE }),
        )
      }

      return baseFetch(input, init)
    })

    vi.stubGlobal("fetch", fetchMock)
    renderWithAppState(<SellerProfileScreen />, <SeedRole role="seller" />)

    expect(await screen.findByRole("alert")).toHaveTextContent("Profile is unavailable.")

    fireEvent.click(screen.getByRole("button", { name: /try again/i }))

    expect(await screen.findByText("SQL Magsaysay Meat Depot")).toBeInTheDocument()
  })

  it("persists seller store status changes through the profile API", async () => {
    const fetchMock = installMarketplaceFetchMock()

    renderWithAppState(<SellerProfileScreen />, <SeedRole role="seller" />)

    expect(await screen.findByText("SQL Magsaysay Meat Depot")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("switch", { name: /store open/i }))

    await waitFor(() => {
      expect(screen.getByText("Hidden from listings")).toBeInTheDocument()
    })
    expect(screen.getByRole("switch", { name: /store closed/i })).toHaveAttribute("aria-checked", "false")
    expect(fetchMock).toHaveBeenCalledWith("/api/seller/profile", expect.any(Object))

    const patchCall = fetchMock.mock.calls.find(
      ([path, init]) => path === "/api/seller/profile" && (init as RequestInit | undefined)?.method === "PATCH",
    )
    expect(JSON.parse(String((patchCall?.[1] as RequestInit).body))).toEqual({
      isOpen: false,
    })
  })

  it("rolls back seller store status when the profile API fails", async () => {
    const baseFetch = installMarketplaceFetchMock()
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
      const url = new URL(requestUrl, "http://localhost")

      if (url.pathname === "/api/seller/profile" && init?.method === "PATCH") {
        return Promise.resolve(apiErrorResponse("SERVER_ERROR", "Store status could not be updated.", 500))
      }

      return baseFetch(input, init)
    })

    vi.stubGlobal("fetch", fetchMock)
    renderWithAppState(<SellerProfileScreen />, <SeedRole role="seller" />)

    expect(await screen.findByText("SQL Magsaysay Meat Depot")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("switch", { name: /store open/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Store status could not be updated.")
    expect(screen.getByText("Visible to buyers")).toBeInTheDocument()
    expect(screen.getByRole("switch", { name: /store open/i })).toHaveAttribute("aria-checked", "true")
  })

  it("deletes seller products through the seller service", async () => {
    const fetchMock = installMarketplaceFetchMock()

    renderWithAppState(<SellerProductsScreen />, <SeedRole role="seller" />)

    expect(await screen.findByText("Chicken Nuggets Supreme")).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole("button", { name: /delete chicken nuggets supreme/i }),
    )

    await waitFor(() => {
      expect(screen.queryByText("Chicken Nuggets Supreme")).not.toBeInTheDocument()
    })
    expect(screen.getByRole("status")).toHaveTextContent("Chicken Nuggets Supreme was deleted.")
    expect(fetchMock.mock.calls.map(([path]) => fetchCallPath(path)).filter((path) => path.startsWith("/api/seller/products"))).toEqual([
      "/api/seller/products",
      "/api/seller/products/p3",
      "/api/seller/products",
    ])
  })
})
