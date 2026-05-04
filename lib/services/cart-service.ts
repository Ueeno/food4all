import { apiRequest } from "@/lib/api-client"
import type { AddCartItemRequest, ApiCartItem, UpdateCartItemRequest } from "@/lib/api-contracts"
import type { CartItem } from "@/lib/types"

type CartPayload = {
  items: ApiCartItem[]
  itemCount: number
  subtotal: number
  total: number
}

function toCartItems(payload: CartPayload): CartItem[] {
  return payload.items.map((item) => ({
    id: item.productId,
    name: item.name,
    price: item.price,
    originalPrice: item.originalPrice,
    quantity: item.quantity,
    image: item.image,
    seller: item.seller,
    location: item.location,
    pickupDate: item.pickupDate,
  }))
}

export async function getCart(): Promise<CartItem[]> {
  return toCartItems(await apiRequest<CartPayload>("/api/cart"))
}

export async function addToCart(productId: string, quantity: number): Promise<CartItem[]> {
  return toCartItems(
    await apiRequest<CartPayload, AddCartItemRequest>("/api/cart/items", {
      method: "POST",
      body: {
        productId,
        quantity,
      },
    }),
  )
}

export async function updateCartItem(productId: string, quantity: number): Promise<CartItem[]> {
  return toCartItems(
    await apiRequest<CartPayload, UpdateCartItemRequest>(
      `/api/cart/items/${encodeURIComponent(productId)}`,
      {
        method: "PATCH",
        body: {
          quantity,
        },
      },
    ),
  )
}

export async function removeFromCart(productId: string): Promise<CartItem[]> {
  return toCartItems(
    await apiRequest<CartPayload>(`/api/cart/items/${encodeURIComponent(productId)}`, {
      method: "DELETE",
    }),
  )
}

export async function clearCart(): Promise<CartItem[]> {
  return toCartItems(
    await apiRequest<CartPayload>("/api/cart", {
      method: "DELETE",
    }),
  )
}
