import { redisCache } from "@/lib/redis-cache"

/**
 * Cache invalidation patterns for different API operations
 */
export const cacheInvalidation = {
  // Companies
  invalidateCompanies: async (userId: string) => {
    await redisCache.invalidatePattern(`companies:*:${userId}:*`)
  },

  // Orders
  invalidateOrders: async (userId: string) => {
    await redisCache.invalidatePattern(`orders:${userId}:*`)
    await redisCache.invalidatePattern(`orders:*:admin`)
  },

  // Documents
  invalidateDocuments: async (userId: string, companyId?: string) => {
    if (companyId) {
      await redisCache.invalidatePattern(`documents:${userId}:${companyId}`)
    } else {
      await redisCache.invalidatePattern(`documents:${userId}:*`)
    }
  },

  // Notifications
  invalidateNotifications: async (userId: string, companyId?: string) => {
    if (companyId) {
      await redisCache.invalidatePattern(`notifications:${userId}:${companyId}:*`)
    } else {
      await redisCache.invalidatePattern(`notifications:${userId}:*`)
    }
  },

  // Blog
  invalidateBlog: async () => {
    await redisCache.invalidatePattern('blog:*')
  },

  // Addons
  invalidateAddons: async () => {
    await redisCache.invalidatePattern('addons:*')
  },

  // Mail
  invalidateMail: async (companyId: string) => {
    await redisCache.invalidatePattern(`mail:*:${companyId}:*`)
  },

  // Invalidate all caches (nuclear option)
  invalidateAll: async () => {
    await redisCache.clear()
  },
}
