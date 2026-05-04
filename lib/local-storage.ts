export const LOCAL_STORAGE_KEYS = {
  authUser: "food4all.local.authUser",
  selectedRole: "food4all.local.selectedRole",
  cartItems: "food4all.local.cartItems",
} as const

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function readLocalStorageValue<T>(
  key: string,
  isValid: (value: unknown) => value is T,
): T | null {
  const storage = getStorage()
  if (!storage) return null

  const rawValue = storage.getItem(key)
  if (rawValue === null) return null

  try {
    const parsedValue: unknown = JSON.parse(rawValue)
    return isValid(parsedValue) ? parsedValue : null
  } catch {
    return null
  }
}

export function writeLocalStorageValue<T>(key: string, value: T) {
  const storage = getStorage()
  if (!storage) return

  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    // Temporary frontend-only persistence should never break app usage.
  }
}

export function removeLocalStorageValue(key: string) {
  const storage = getStorage()
  if (!storage) return

  try {
    storage.removeItem(key)
  } catch {
    // Temporary frontend-only persistence should never break app usage.
  }
}

export function clearLocalStorageValues(keys: readonly string[]) {
  for (const key of keys) {
    removeLocalStorageValue(key)
  }
}
