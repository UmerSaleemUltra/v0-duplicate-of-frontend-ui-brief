import { Db, ObjectId } from "mongodb"
import { Order, Company } from "@/lib/types"

/**
 * OrderService - Centralized order management logic
 * Handles fetching, creating, and transforming order data
 */

export interface OrderServiceOptions {
  userId?: string
  isAdmin?: boolean
  limit?: number
}

/**
 * Get orders from database with optional filtering
 */
export async function getOrdersFromDatabase(db: Db, options: OrderServiceOptions) {
  const { userId, isAdmin = false, limit = 100 } = options

  const query = isAdmin && !userId ? {} : { userId }

  const orders = await db
    .collection("orders")
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()

  return orders
}

/**
 * Transform database order to API response format
 */
export function transformOrder(order: any) {
  return {
    id: order._id?.toString() || order.id,
    userId: order.userId,
    companyId: order.companyId,
    companyName: order.companyName,
    type: order.type,
    status: order.status,
    amount: order.amount,
    total: order.total,
    packagePrice: order.packagePrice,
    stateFilingFee: order.stateFilingFee,
    addonsTotal: order.addonsTotal,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    items: order.items || [],
    purchasedAddons: order.purchasedAddons || [],
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}

/**
 * Convert company record to order record
 * This should only be used when displaying company data as orders (UI fallback)
 * NOT for creating actual orders in the database
 */
export function companyToOrder(company: any, userId?: string) {
  return {
    _id: new ObjectId(),
    userId: company.userId || userId,
    companyId: company._id?.toString() || company.id,
    companyName: company.name,
    type: company.type || "Formation",
    packageType: company.packageType || "Standard",
    status: company.status || "active",
    amount: company.revenue || 0,
    total: company.revenue || 0,
    packagePrice: company.packagePrice || 0,
    stateFilingFee: company.stateFilingFee || 0,
    addonsTotal: company.addonsTotal || 0,
    paymentStatus: "completed",
    paymentMethod: "N/A",
    items: company.items || [],
    purchasedAddons: company.purchasedAddons || [],
    createdAt: company.createdAt || new Date().toISOString(),
    updatedAt: company.updatedAt || new Date().toISOString(),
  }
}

/**
 * Get companies for fallback order display
 */
export async function getCompaniesForOrders(db: Db, options: OrderServiceOptions) {
  const { userId, isAdmin = false, limit = 100 } = options

  const query = isAdmin && !userId ? {} : { userId }

  const companies = await db
    .collection("companies")
    .find(query)
    .limit(limit)
    .toArray()

  return companies
}

/**
 * Process orders - returns real orders or company-based fallback
 * @param db Database instance
 * @param options Configuration options
 * @returns Transformed order data ready for API response
 */
export async function processOrders(db: Db, options: OrderServiceOptions) {
  const { userId } = options

  // Step 1: Try to fetch real orders from database
  const orders = await getOrdersFromDatabase(db, options)

  // Step 2: If orders exist, return them
  if (orders.length > 0) {
    console.log(`[v0] Found ${orders.length} orders in database`)
    return orders.map(transformOrder)
  }

  // Step 3: If no orders, fallback to company data for display purposes
  // This is NOT creating orders - just displaying company data in order format
  console.log("[v0] No orders found, using company data for display fallback")
  const companies = await getCompaniesForOrders(db, options)

  if (companies.length > 0) {
    console.log(`[v0] Creating display orders from ${companies.length} companies`)
    return companies.map((company) => transformOrder(companyToOrder(company, userId)))
  }

  // Step 4: No data available
  console.log("[v0] No orders or companies found")
  return []
}
