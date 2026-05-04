"use client"

import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react"
import type {
  AuthRole,
  AuthStatus,
  AuthUser,
  CartItem,
  LoginInput,
  RegisterInput,
  UserRole,
} from "@/lib/types"
import {
  defaultScreenForRole,
  resolveNavigationTarget,
  type Screen,
} from "@/lib/navigation-guards"
import {
  LOCAL_STORAGE_KEYS,
  clearLocalStorageValues,
  readLocalStorageValue,
  removeLocalStorageValue,
  writeLocalStorageValue,
} from "@/lib/local-storage"
import {
  createLoginTransition,
  createLogoutTransition,
  createRegisterTransition,
  createRoleSelectionTransition,
  getAuthStatus,
  isAuthenticated as getIsAuthenticated,
} from "@/lib/local-auth-flow"
import {
  addToCart as addToCartService,
  clearCart as clearCartService,
  getCart as getCartService,
  removeFromCart as removeFromCartService,
  updateCartItem as updateCartItemService,
} from "@/lib/services/cart-service"

export type { AuthRole, AuthStatus, AuthUser, CartItem, UserRole }
export type { Screen }
export type LoginPayload = LoginInput
export type RegisterPayload = RegisterInput

interface AppState {
  screen: Screen
  role: UserRole
  selectedRole: UserRole
  currentUser: AuthUser | null
  authStatus: AuthStatus
  isAuthenticated: boolean
  cartItems: CartItem[]
  selectedProductId: string | null
  navigate: (screen: Screen) => void
  login: (payload: LoginPayload) => void
  register: (payload: RegisterPayload) => void
  logout: () => void
  selectRole: (role: AuthRole) => void
  addToCart: (item: CartItem) => void
  updateCartQuantity: (id: string, quantity: number) => void
  incrementCartItem: (id: string) => void
  decrementCartItem: (id: string) => void
  removeFromCart: (id: string) => void
  clearCart: () => void
  selectProduct: (id: string) => void
  cartCount: number
  cartTotal: number
}

const AppStateContext = createContext<AppState | null>(null)

const MOCK_CART: CartItem[] = []
const SESSION_STORAGE_KEYS = [
  LOCAL_STORAGE_KEYS.authUser,
  LOCAL_STORAGE_KEYS.selectedRole,
  LOCAL_STORAGE_KEYS.cartItems,
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isAuthRole(value: unknown): value is AuthRole {
  return value === "buyer" || value === "seller"
}

function isUserRole(value: unknown): value is UserRole {
  return value === null || isAuthRole(value)
}

function isAuthUser(value: unknown): value is AuthUser {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    isUserRole(value.role)
  )
}

function isCartItem(value: unknown): value is CartItem {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.price === "number" &&
    Number.isFinite(value.price) &&
    typeof value.originalPrice === "number" &&
    Number.isFinite(value.originalPrice) &&
    typeof value.quantity === "number" &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0 &&
    typeof value.image === "string" &&
    typeof value.seller === "string" &&
    typeof value.location === "string" &&
    (value.pickupDate === undefined || typeof value.pickupDate === "string")
  )
}

function isCartItems(value: unknown): value is CartItem[] {
  return Array.isArray(value) && value.every(isCartItem)
}

function persistAuthState(currentUser: AuthUser | null, selectedRole: UserRole) {
  if (currentUser) {
    writeLocalStorageValue(LOCAL_STORAGE_KEYS.authUser, currentUser)
  } else {
    removeLocalStorageValue(LOCAL_STORAGE_KEYS.authUser)
  }

  if (selectedRole) {
    writeLocalStorageValue(LOCAL_STORAGE_KEYS.selectedRole, selectedRole)
  } else {
    removeLocalStorageValue(LOCAL_STORAGE_KEYS.selectedRole)
  }
}

function persistCartItems(cartItems: CartItem[]) {
  if (cartItems.length > 0) {
    writeLocalStorageValue(LOCAL_STORAGE_KEYS.cartItems, cartItems)
  } else {
    removeLocalStorageValue(LOCAL_STORAGE_KEYS.cartItems)
  }
}

function addLocalCartItem(cartItems: CartItem[], item: CartItem) {
  const existing = cartItems.find((cartItem) => cartItem.id === item.id)

  if (existing) {
    return cartItems.map((cartItem) =>
      cartItem.id === item.id
        ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
        : cartItem,
    )
  }

  return [...cartItems, item]
}

function updateLocalCartQuantity(cartItems: CartItem[], id: string, quantity: number) {
  return quantity <= 0
    ? cartItems.filter((item) => item.id !== id)
    : cartItems.map((item) => (item.id === id ? { ...item, quantity } : item))
}

function decrementLocalCartItem(cartItems: CartItem[], id: string) {
  return cartItems.flatMap((item) => {
    if (item.id !== id) return [item]

    const nextQuantity = item.quantity - 1
    return nextQuantity <= 0 ? [] : [{ ...item, quantity: nextQuantity }]
  })
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<Screen>("splash")
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>(MOCK_CART)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const skipStorageHydrationRef = useRef(false)
  const cartTouchedRef = useRef(false)

  const authStatus: AuthStatus = getAuthStatus(currentUser)
  const isAuthenticated = getIsAuthenticated(currentUser)

  useEffect(() => {
    const storedUser = readLocalStorageValue(LOCAL_STORAGE_KEYS.authUser, isAuthUser)
    const storedRole = readLocalStorageValue(LOCAL_STORAGE_KEYS.selectedRole, isAuthRole)
    const storedCartItems = readLocalStorageValue(LOCAL_STORAGE_KEYS.cartItems, isCartItems)
    let isMounted = true

    queueMicrotask(() => {
      if (!isMounted || skipStorageHydrationRef.current) return

      if (storedUser) {
        const nextRole = storedRole ?? storedUser.role
        const nextUser = { ...storedUser, role: nextRole }

        setCurrentUser(nextUser)
        setSelectedRole(nextRole)
        setScreen(nextRole ? defaultScreenForRole(nextRole) : "role-select")
      }

      if (storedCartItems) {
        setCartItems(storedCartItems)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!currentUser || selectedRole !== "buyer") return

    let ignore = false

    async function loadBuyerCart() {
      try {
        const nextItems = await getCartService()

        if (ignore || cartTouchedRef.current) return

        setCartItems(nextItems)
        persistCartItems([])
      } catch {
        // The current UI auth shell can be local-only. Keep hydrated local cart as fallback.
      }
    }

    loadBuyerCart()

    return () => {
      ignore = true
    }
  }, [currentUser, selectedRole])

  const navigate = useCallback((s: Screen) => {
    setScreen(resolveNavigationTarget(s, { currentUser, selectedRole }))
  }, [currentUser, selectedRole])

  const login = useCallback((payload: LoginPayload) => {
    skipStorageHydrationRef.current = true
    const nextState = createLoginTransition(payload)

    setCurrentUser(nextState.currentUser)
    setSelectedRole(nextState.selectedRole)
    setSelectedProductId(nextState.selectedProductId)
    setScreen(nextState.screen)
    persistAuthState(nextState.currentUser, nextState.selectedRole)
  }, [])

  const register = useCallback((payload: RegisterPayload) => {
    skipStorageHydrationRef.current = true
    const nextState = createRegisterTransition(payload)

    setCurrentUser(nextState.currentUser)
    setSelectedRole(nextState.selectedRole)
    setSelectedProductId(nextState.selectedProductId)
    setScreen(nextState.screen)
    persistAuthState(nextState.currentUser, nextState.selectedRole)
  }, [])

  const logout = useCallback(() => {
    skipStorageHydrationRef.current = true
    const nextState = createLogoutTransition()

    setCurrentUser(nextState.currentUser)
    setSelectedRole(nextState.selectedRole)
    setSelectedProductId(nextState.selectedProductId)
    setCartItems(nextState.cartItems)
    setScreen(nextState.screen)
    clearLocalStorageValues(SESSION_STORAGE_KEYS)
  }, [])

  const selectRole = useCallback((role: AuthRole) => {
    skipStorageHydrationRef.current = true
    const nextState = createRoleSelectionTransition(currentUser, role)

    setSelectedRole(nextState.selectedRole)
    setCurrentUser(nextState.currentUser)
    setScreen(nextState.screen)
    persistAuthState(nextState.currentUser, nextState.currentUser ? nextState.selectedRole : null)
  }, [currentUser])

  const selectProduct = useCallback((id: string) => {
    skipStorageHydrationRef.current = true
    setSelectedProductId(id)
  }, [])

  const addToCart = useCallback((item: CartItem) => {
    skipStorageHydrationRef.current = true
    cartTouchedRef.current = true

    async function addBackendCartItem() {
      try {
        const nextItems = await addToCartService(item.id, item.quantity)

        setCartItems(nextItems)
        persistCartItems([])
      } catch {
        setCartItems((prev) => {
          const nextItems = addLocalCartItem(prev, item)

          persistCartItems(nextItems)
          return nextItems
        })
      }
    }

    void addBackendCartItem()
  }, [])

  const updateCartQuantity = useCallback((id: string, quantity: number) => {
    skipStorageHydrationRef.current = true
    cartTouchedRef.current = true

    async function updateBackendCartItem() {
      try {
        const nextItems = await updateCartItemService(id, quantity)

        setCartItems(nextItems)
        persistCartItems([])
      } catch {
        setCartItems((prev) => {
          const nextItems = updateLocalCartQuantity(prev, id, quantity)

          persistCartItems(nextItems)
          return nextItems
        })
      }
    }

    void updateBackendCartItem()
  }, [])

  const incrementCartItem = useCallback((id: string) => {
    skipStorageHydrationRef.current = true
    cartTouchedRef.current = true

    async function incrementBackendCartItem() {
      const currentItem = cartItems.find((item) => item.id === id)

      if (!currentItem) return

      const nextQuantity = currentItem.quantity + 1

      try {
        const nextItems = await updateCartItemService(id, nextQuantity)

        setCartItems(nextItems)
        persistCartItems([])
      } catch {
        setCartItems((prev) => {
          const nextItems = updateLocalCartQuantity(prev, id, nextQuantity)

          persistCartItems(nextItems)
          return nextItems
        })
      }
    }

    void incrementBackendCartItem()
  }, [cartItems])

  const decrementCartItem = useCallback((id: string) => {
    skipStorageHydrationRef.current = true
    cartTouchedRef.current = true

    async function decrementBackendCartItem() {
      const currentItem = cartItems.find((item) => item.id === id)

      if (!currentItem) return

      const nextQuantity = currentItem.quantity - 1

      try {
        const nextItems = await updateCartItemService(id, nextQuantity)

        setCartItems(nextItems)
        persistCartItems([])
      } catch {
        setCartItems((prev) => {
          const nextItems = decrementLocalCartItem(prev, id)

          persistCartItems(nextItems)
          return nextItems
        })
      }
    }

    void decrementBackendCartItem()
  }, [cartItems])

  const removeFromCart = useCallback((id: string) => {
    skipStorageHydrationRef.current = true
    cartTouchedRef.current = true

    async function removeBackendCartItem() {
      try {
        const nextItems = await removeFromCartService(id)

        setCartItems(nextItems)
        persistCartItems([])
      } catch {
        setCartItems((prev) => {
          const nextItems = prev.filter((item) => item.id !== id)

          persistCartItems(nextItems)
          return nextItems
        })
      }
    }

    void removeBackendCartItem()
  }, [])

  const clearCart = useCallback(() => {
    skipStorageHydrationRef.current = true
    cartTouchedRef.current = true

    async function clearBackendCart() {
      try {
        const nextItems = await clearCartService()

        setCartItems(nextItems)
        persistCartItems(nextItems)
      } catch {
        setCartItems([])
        persistCartItems([])
      }

      persistCartItems([])
    }

    void clearBackendCart()
  }, [])

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <AppStateContext.Provider
      value={{
        screen,
        role: selectedRole,
        selectedRole,
        currentUser,
        authStatus,
        isAuthenticated,
        cartItems,
        selectedProductId,
        navigate,
        login,
        register,
        logout,
        selectRole,
        addToCart,
        updateCartQuantity,
        incrementCartItem,
        decrementCartItem,
        removeFromCart,
        clearCart,
        selectProduct,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider")
  return ctx
}
