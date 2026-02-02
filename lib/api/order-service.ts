import { Db, ObjectId } from "mongodb"
import { Order, Company } from "@/lib/types"

/**
 * OrderService - Centralized order management logic
 * 
 * IMPORTANT: Orders are embedded in the companies collection!
 * - Each company has an `orders` array field
 * - Orders are NOT stored in a separate collection
 * 
 * This service extracts orders from companies and provides a unified API.
 */

export interface OrderServiceOptions {
  userId?: string
  isAdmin?: boolean
  limit?: number
}

/**
 * Extract orders from companies collection
 * Orders are stored as an array field within each company document
 */
export async function getOrdersFromCompanies(db: Db, options: OrderServiceOptions) {
  const { userId, isAdmin = false, limit = 100 } = options

  const query = isAdmin && !userId ? {} : { userId }

  // Fetch companies with their embedded orders
  const companies = await db
    .collection("companies")
    .find(query)
    .limit(limit)
    .toArray()

  // Extract and flatten orders from all companies
  const allOrders: any[] = []

  for (const company of companies) {
    if (company.orders && Array.isArray(company.orders)) {
      // Each order in the company's orders array
      for (const order of company.orders) {
        allOrders.push({
          ...order,
          _id: new ObjectId(order.id),
          companyId: company._id?.toString() || company.id,
          companyName: company.name,
          userId: company.userId,
          state: order.state || company.state,
        })
      }
    }
  }

  // Sort by creation date descending
  allOrders.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return dateB - dateA
  })

  return allOrders
}

/**
 * Transform database order to API response format
 */
export function transformOrder(order: any) {
  const pricing = order.pricing || {}
  
  return {
    id: order._id?.toString() || order.id,
    userId: order.userId,
    companyId: order.companyId,
    companyName: order.companyName,
    type: order.orderType || order.type || "Formation",
    packageType: order.packageType || "Standard",
    state: order.state || "N/A",
    status: order.status || "pending",
    amount: pricing.total || order.total || order.amount || 0,
    total: pricing.total || order.total || 0,
    packagePrice: pricing.packagePrice || 0,
    stateFilingFee: pricing.stateFilingFee || 0,
    addonsTotal: pricing.addonsTotal || 0,
    subtotal: pricing.subtotal || 0,
    paymentInfo: order.paymentInfo || {},
    paymentStatus: order.paymentInfo?.status || "pending",
    paymentMethod: order.paymentInfo?.method || "N/A",
    items: order.selectedAddons || order.items || [],
    purchasedAddons: order.purchasedAddons || [],
    passportDocuments: order.passportDocuments || [],
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}

/**
 * Get all orders (from companies collection)
 * This is the main entry point for fetching orders
 */
export async function processOrders(db: Db, options: OrderServiceOptions) {
  try {
    console.log("[v0] Processing orders with options:", options)
    
    // Extract orders from companies collection
    const orders = await getOrdersFromCompanies(db, options)
    
    console.log(`[v0] Found ${orders.length} orders from companies`)

    if (orders.length === 0) {
      console.log("[v0] No orders found in any companies")
      return []
    }

    // Transform orders to API response format
    const transformedOrders = orders.map(transformOrder)
    
    console.log(`[v0] Transformed ${transformedOrders.length} orders for API response`)
    
    return transformedOrders
  } catch (error) {
    console.error("[v0] Error processing orders:", error)
    throw error
  }
}

/**
 * Get single order by ID
 */
export async function getOrderById(db: Db, orderId: string) {
  try {
    const companies = await db
      .collection("companies")
      .find({})
      .toArray()

    for (const company of companies) {
      if (company.orders && Array.isArray(company.orders)) {
        const order = company.orders.find(
          (o: any) => o.id === orderId || o._id?.toString() === orderId
        )
        
        if (order) {
          return transformOrder({
            ...order,
            companyId: company._id?.toString() || company.id,
            companyName: company.name,
            userId: company.userId,
          })
        }
      }
    }

    return null
  } catch (error) {
    console.error("[v0] Error fetching order by ID:", error)
    throw error
  }
}

/**
 * Get orders for specific company
 */
export async function getCompanyOrders(db: Db, companyId: string) {
  try {
    const company = await db
      .collection("companies")
      .findOne({ _id: new ObjectId(companyId) })

    if (!company) {
      return []
    }

    if (!company.orders || !Array.isArray(company.orders)) {
      return []
    }

    return company.orders.map((order: any) =>
      transformOrder({
        ...order,
        companyId: company._id?.toString(),
        companyName: company.name,
        userId: company.userId,
      })
    )
  } catch (error) {
    console.error("[v0] Error fetching company orders:", error)
    throw error
  }
}
