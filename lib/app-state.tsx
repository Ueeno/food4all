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

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<Screen>("splash")
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>(MOCK_CART)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const skipStorageHydrationRef = useRef(false)

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
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        const nextItems = prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i,
        )
        persistCartItems(nextItems)
        return nextItems
      }
      const nextItems = [...prev, item]
      persistCartItems(nextItems)
      return nextItems
    })
  }, [])

  const updateCartQuantity = useCallback((id: string, quantity: number) => {
    skipStorageHydrationRef.current = true
    setCartItems((prev) => {
      const nextItems =
        quantity <= 0
          ? prev.filter((i) => i.id !== id)
          : prev.map((i) => (i.id === id ? { ...i, quantity } : i))

      persistCartItems(nextItems)
      return nextItems
    })
  }, [])

  const incrementCartItem = useCallback((id: string) => {
    skipStorageHydrationRef.current = true
    setCartItems((prev) => {
      const nextItems = prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i))
      persistCartItems(nextItems)
      return nextItems
    })
  }, [])

  const decrementCartItem = useCallback((id: string) => {
    skipStorageHydrationRef.current = true
    setCartItems((prev) => {
      const nextItems = prev.flatMap((i) => {
        if (i.id !== id) return [i]

        const nextQuantity = i.quantity - 1
        return nextQuantity <= 0 ? [] : [{ ...i, quantity: nextQuantity }]
      })
      persistCartItems(nextItems)
      return nextItems
    })
  }, [])

  const removeFromCart = useCallback((id: string) => {
    skipStorageHydrationRef.current = true
    setCartItems((prev) => {
      const nextItems = prev.filter((i) => i.id !== id)
      persistCartItems(nextItems)
      return nextItems
    })
  }, [])

  const clearCart = useCallback(() => {
    skipStorageHydrationRef.current = true
    setCartItems([])
    persistCartItems([])
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
