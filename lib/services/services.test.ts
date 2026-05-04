import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { installMarketplaceFetchMock } from "@/test/api-fetch-mock"
import { clearCart, addToCart, getCart, removeFromCart, updateCartItem } from "./cart-service"
import { getCategories } from "./category-service"
import { getSellerOrders, verifyPickupCode } from "./order-service"
import { getProductById, getProducts } from "./product-service"
import { getSellerDashboard, getSellerProducts } from "./seller-service"

describe("service contracts", () => {
  beforeEach(async () => {
    installMarketplaceFetchMock()
    await clearCart()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("returns products and can find a product by id", async () => {
    const products = await getProducts()
    expect(products.length).toBeGreaterThan(0)

    const product = products[0]
    if (!product) throw new Error("Expected at least one mock product")

    const found = await getProductById(product.id)
    expect(found).toMatchObject({
      id: product.id,
      name: product.name,
      discountedPrice: product.discountedPrice,
    })
    expect(found).not.toBe(product)
  })

  it("returns categories", async () => {
    const categories = await getCategories()

    expect(categories.length).toBeGreaterThan(0)
    expect(categories[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        label: expect.any(String),
      }),
    )
  })

  it("returns seller orders and verifies pickup codes", async () => {
    const orders = await getSellerOrders()
    expect(orders.length).toBeGreaterThan(0)

    const order = orders.find((item) => item.pickupCode)
    if (!order) throw new Error("Expected at least one seller order with a pickup code")

    const verification = await verifyPickupCode(order.pickupCode)
    expect(verification).toMatchObject({
      status: "valid",
      orderId: order.id,
    })

    const invalidVerification = await verifyPickupCode("F4A-BAD0")
    expect(invalidVerification.status).toBe("invalid")
  })

  it("returns seller dashboard data and seller products", async () => {
    const [dashboard, products] = await Promise.all([
      getSellerDashboard(),
      getSellerProducts(),
    ])

    expect(dashboard.metrics.length).toBeGreaterThan(0)
    expect(dashboard.pendingOrders).toEqual(expect.any(Array))
    expect(dashboard.expiringProducts).toEqual(expect.any(Array))
    expect(products.length).toBeGreaterThan(0)
  })

  it("supports basic cart add, update, remove, and clear behavior", async () => {
    const products = await getProducts()
    const product = products[0]
    if (!product) throw new Error("Expected at least one mock product")

    let cart = await addToCart(product.id, 2)
    expect(cart).toHaveLength(1)
    expect(cart[0]).toMatchObject({
      id: product.id,
      quantity: 2,
      price: product.discountedPrice,
    })

    cart = await updateCartItem(product.id, 5)
    expect(cart[0]?.quantity).toBe(5)

    cart = await removeFromCart(product.id)
    expect(cart).toHaveLength(0)

    cart = await getCart()
    expect(cart).toHaveLength(0)
  })
})
