import { getProductById } from "@/lib/services/product-service"
import type { CartItem } from "@/lib/types"

let mockCart: CartItem[] = []

function cloneCartItem(item: CartItem): CartItem {
  return { ...item }
}

export async function getCart(): Promise<CartItem[]> {
  return mockCart.map(cloneCartItem)
}

export async function addToCart(productId: string, quantity: number): Promise<CartItem[]> {
  const product = await getProductById(productId)

  if (!product) return getCart()

  const cartItem: CartItem = {
    id: product.id,
    name: product.name,
    price: product.discountedPrice,
    originalPrice: product.originalPrice,
    quantity,
    image: product.image,
    seller: product.seller,
    location: product.location,
  }

  const existing = mockCart.find((item) => item.id === productId)
  mockCart = existing
    ? mockCart.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity + quantity } : item,
      )
    : [...mockCart, cartItem]

  return getCart()
}

export async function updateCartItem(productId: string, quantity: number): Promise<CartItem[]> {
  mockCart =
    quantity <= 0
      ? mockCart.filter((item) => item.id !== productId)
      : mockCart.map((item) => (item.id === productId ? { ...item, quantity } : item))

  return getCart()
}

export async function removeFromCart(productId: string): Promise<CartItem[]> {
  mockCart = mockCart.filter((item) => item.id !== productId)
  return getCart()
}

export async function clearCart(): Promise<CartItem[]> {
  mockCart = []
  return []
}
