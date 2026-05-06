import { useEffect, useRef, type ReactNode } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AppStateProvider, useAppState, type AuthRole } from "@/lib/app-state"
import { BuyerProfileScreen } from "@/components/screens/buyer-pickup-screen"
import { LoginScreen } from "@/components/screens/login-screen"
import { RegisterScreen } from "@/components/screens/register-screen"
import { RoleSelectScreen } from "@/components/screens/role-select-screen"
import { SellerProfileScreen } from "@/components/screens/seller-screens"
import { LOCAL_STORAGE_KEYS } from "@/lib/local-storage"
import { installMarketplaceFetchMock } from "@/test/api-fetch-mock"

function StateProbe() {
  const {
    authStatus,
    cartCount,
    currentUser,
    isAuthenticated,
    screen: currentScreen,
    selectedProductId,
    selectedRole,
  } = useAppState()

  return (
    <div aria-label="app state probe">
      <span data-testid="auth-status">{authStatus}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="screen">{currentScreen}</span>
      <span data-testid="selected-role">{selectedRole ?? "none"}</span>
      <span data-testid="selected-product">{selectedProductId ?? "none"}</span>
      <span data-testid="current-user-id">{currentUser?.id ?? "none"}</span>
      <span data-testid="current-user-email">{currentUser?.email ?? "none"}</span>
      <span data-testid="cart-count">{cartCount}</span>
    </div>
  )
}

function SeedAuthenticatedUser() {
  const { currentUser, login } = useAppState()
  const seededRef = useRef(false)

  useEffect(() => {
    if (!seededRef.current && !currentUser) {
      seededRef.current = true
      void login({ email: "test@food4all.local", password: "password123" })
    }
  }, [currentUser, login])

  return null
}

function SeedRole({ role }: { role: AuthRole }) {
  const { currentUser, login, selectedRole, selectRole } = useAppState()
  const seededRef = useRef(false)

  useEffect(() => {
    if (!seededRef.current && !currentUser) {
      seededRef.current = true
      void login({ email: `${role}@food4all.local`, password: "password123" })
      return
    }

    if (seededRef.current && currentUser && selectedRole !== role) {
      void selectRole(role)
    }
  }, [currentUser, login, role, selectedRole, selectRole])

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

beforeEach(() => {
  installMarketplaceFetchMock()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe("rendered auth screens", () => {
  it("hydrates persisted local auth role and cart state", async () => {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.authUser,
      JSON.stringify({
        id: "mock-buyer-food4all-local",
        name: "Test Buyer",
        email: "buyer@food4all.local",
        role: "buyer",
      }),
    )
    localStorage.setItem(LOCAL_STORAGE_KEYS.selectedRole, JSON.stringify("buyer"))
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.cartItems,
      JSON.stringify([
        {
          id: "p1",
          name: "Purefoods Tender Juicy Hotdog",
          price: 185,
          originalPrice: 285,
          quantity: 2,
          image: "/images/hotdogs.jpg",
          seller: "Magsaysay Meat Depot",
          location: "Magsaysay Market, Davao City",
        },
      ]),
    )

    renderWithAppState(<div />)

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("true")
    })
    expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated")
    expect(screen.getByTestId("current-user-email")).toHaveTextContent("buyer@food4all.local")
    expect(screen.getByTestId("selected-role")).toHaveTextContent("buyer")
    expect(screen.getByTestId("cart-count")).toHaveTextContent("2")
    expect(screen.getByTestId("screen")).toHaveTextContent("buyer-home")
  })

  it("ignores malformed persisted local auth and cart state", async () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.authUser, "{not-json")
    localStorage.setItem(LOCAL_STORAGE_KEYS.selectedRole, JSON.stringify("admin"))
    localStorage.setItem(LOCAL_STORAGE_KEYS.cartItems, JSON.stringify([{ id: "p1" }]))

    renderWithAppState(<div />)

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("false")
    })
    expect(screen.getByTestId("selected-role")).toHaveTextContent("none")
    expect(screen.getByTestId("cart-count")).toHaveTextContent("0")
  })

  it("renders the login form", () => {
    renderWithAppState(<LoginScreen />)

    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument()
  })

  it("shows login validation errors for empty email and password", () => {
    renderWithAppState(<LoginScreen />)

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    expect(screen.getByText("Email is required.")).toBeInTheDocument()
    expect(screen.getByText("Password is required.")).toBeInTheDocument()
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false")
  })

  it("shows a login validation error for invalid email", () => {
    renderWithAppState(<LoginScreen />)

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "invalid-email" },
    })
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    })
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument()
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false")
  })

  it("calls backend login, stores the returned user, and navigates on success", async () => {
    const fetchMock = installMarketplaceFetchMock()
    renderWithAppState(<LoginScreen />)

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "login@food4all.local" },
    })
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    })
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("true")
    })
    expect(fetchMock.mock.calls.map(([path]) => path)).toContain("/api/auth/login")
    expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated")
    expect(screen.getByTestId("current-user-id")).toHaveTextContent("api-user-login-food4all-local")
    expect(screen.getByTestId("current-user-email")).toHaveTextContent("login@food4all.local")
    expect(screen.getByTestId("selected-role")).toHaveTextContent("none")
    expect(screen.getByTestId("screen")).toHaveTextContent("role-select")
  })

  it("shows a visible login API error for invalid credentials", async () => {
    renderWithAppState(<LoginScreen />)

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "invalid@food4all.local" },
    })
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    })
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password.")
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false")
  })

  it("renders the register form", () => {
    renderWithAppState(<RegisterScreen />)

    expect(screen.getByRole("heading", { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
  })

  it("shows register validation errors for empty required fields", () => {
    renderWithAppState(<RegisterScreen />)

    fireEvent.click(screen.getByRole("button", { name: /^create account$/i }))

    expect(screen.getByText("First name is required.")).toBeInTheDocument()
    expect(screen.getByText("Last name is required.")).toBeInTheDocument()
    expect(screen.getByText("Email is required.")).toBeInTheDocument()
    expect(screen.getByText("Password is required.")).toBeInTheDocument()
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false")
  })

  it("shows register validation errors for invalid email and weak password", () => {
    renderWithAppState(<RegisterScreen />)

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Maria" } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Santos" } })
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "maria" } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "short" } })
    fireEvent.click(screen.getByRole("button", { name: /^create account$/i }))

    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument()
    expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument()
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false")
  })

  it("calls backend register, stores the returned user, and navigates on success", async () => {
    const fetchMock = installMarketplaceFetchMock()
    renderWithAppState(<RegisterScreen />)

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Maria" } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Santos" } })
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: "maria@food4all.local" },
    })
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    })
    fireEvent.click(screen.getByRole("button", { name: /^create account$/i }))

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("true")
    })
    expect(fetchMock.mock.calls.map(([path]) => path)).toContain("/api/auth/register")
    expect(screen.getByTestId("current-user-id")).toHaveTextContent("api-user-maria-food4all-local")
    expect(screen.getByTestId("current-user-email")).toHaveTextContent("maria@food4all.local")
    expect(screen.getByTestId("selected-role")).toHaveTextContent("none")
    expect(screen.getByTestId("screen")).toHaveTextContent("role-select")
  })

  it("shows a visible register API error for duplicate email", async () => {
    renderWithAppState(<RegisterScreen />)

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Maria" } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Santos" } })
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: "duplicate@food4all.local" },
    })
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    })
    fireEvent.click(screen.getByRole("button", { name: /^create account$/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "An account already exists for this email.",
    )
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false")
  })

  it("hydrates the current user and role from /api/auth/me", async () => {
    await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "session@food4all.local", password: "password123" }),
    })

    renderWithAppState(<div />)

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("true")
    })
    expect(screen.getByTestId("current-user-id")).toHaveTextContent("api-user-session-food4all-local")
    expect(screen.getByTestId("current-user-email")).toHaveTextContent("session@food4all.local")
    expect(screen.getByTestId("screen")).toHaveTextContent("role-select")
  })

  it("renders role options", async () => {
    renderWithAppState(<RoleSelectScreen />, <SeedAuthenticatedUser />)

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("true")
    })

    expect(screen.getByRole("button", { name: /i'm a buyer/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /i'm a seller/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /continue as \.\.\./i })).toBeDisabled()
  })

  it("selects buyer role and moves to buyer area", async () => {
    renderWithAppState(<RoleSelectScreen />, <SeedAuthenticatedUser />)

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("true")
    })

    const fetchMock = installMarketplaceFetchMock()
    fireEvent.click(screen.getByRole("button", { name: /i'm a buyer/i }))
    fireEvent.click(screen.getByRole("button", { name: /continue as buyer/i }))

    await waitFor(() => {
      expect(screen.getByTestId("selected-role")).toHaveTextContent("buyer")
    })
    expect(fetchMock.mock.calls.map(([path]) => path)).toContain("/api/auth/role")
    expect(screen.getByTestId("screen")).toHaveTextContent("buyer-home")
  })

  it("selects seller role and moves to seller area", async () => {
    renderWithAppState(<RoleSelectScreen />, <SeedAuthenticatedUser />)

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("true")
    })

    fireEvent.click(screen.getByRole("button", { name: /i'm a seller/i }))
    fireEvent.click(screen.getByRole("button", { name: /continue as seller/i }))

    await waitFor(() => {
      expect(screen.getByTestId("selected-role")).toHaveTextContent("seller")
    })
    expect(screen.getByTestId("screen")).toHaveTextContent("seller-dashboard")
  })
})

describe("rendered profile logout buttons", () => {
  it("renders buyer logout and clears shared auth state", async () => {
    renderWithAppState(<BuyerProfileScreen />, <SeedRole role="buyer" />)

    await waitFor(() => {
      expect(screen.getByTestId("selected-role")).toHaveTextContent("buyer")
    })

    const logoutButton = screen.getByRole("button", { name: /sign out/i })
    expect(logoutButton).toBeInTheDocument()
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.authUser)).not.toBeNull()
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.selectedRole)).not.toBeNull()
    localStorage.setItem(LOCAL_STORAGE_KEYS.cartItems, JSON.stringify([{ id: "stale-cart" }]))

    const fetchMock = installMarketplaceFetchMock()

    fireEvent.click(logoutButton)

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("false")
    })
    expect(fetchMock.mock.calls.map(([path]) => path)).toContain("/api/auth/logout")
    expect(screen.getByTestId("auth-status")).toHaveTextContent("unauthenticated")
    expect(screen.getByTestId("selected-role")).toHaveTextContent("none")
    expect(screen.getByTestId("selected-product")).toHaveTextContent("none")
    expect(screen.getByTestId("cart-count")).toHaveTextContent("0")
    expect(screen.getByTestId("screen")).toHaveTextContent("login")
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.authUser)).toBeNull()
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.selectedRole)).toBeNull()
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.cartItems)).toBeNull()
  })

  it("renders seller logout and clears shared auth state", async () => {
    renderWithAppState(<SellerProfileScreen />, <SeedRole role="seller" />)

    await waitFor(() => {
      expect(screen.getByTestId("selected-role")).toHaveTextContent("seller")
    })
    await screen.findByText("SQL Magsaysay Meat Depot")

    const logoutButton = screen.getByRole("button", { name: /sign out/i })
    expect(logoutButton).toBeInTheDocument()

    fireEvent.click(logoutButton)

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("false")
    })
    expect(screen.getByTestId("auth-status")).toHaveTextContent("unauthenticated")
    expect(screen.getByTestId("selected-role")).toHaveTextContent("none")
    expect(screen.getByTestId("selected-product")).toHaveTextContent("none")
    expect(screen.getByTestId("cart-count")).toHaveTextContent("0")
    expect(screen.getByTestId("screen")).toHaveTextContent("login")
  })
})
