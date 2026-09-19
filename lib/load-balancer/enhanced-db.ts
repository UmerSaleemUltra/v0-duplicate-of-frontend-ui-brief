/**
 * Enhanced Database Wrapper
 * Uses connection pooling and caching for optimized database access
 */

import { Db, Collection, Document } from 'mongodb'
import { getPooledDatabase, releaseDatabase } from './db-connection-pool'
import { advancedCache } from './advanced-cache'

interface QueryOptions {
  cache?: boolean
  ttl?: number
  tags?: string[]
}

class DatabaseWrapper {
  private db: Db | null = null

  private async getDb(): Promise<Db> {
    if (!this.db) {
      this.db = await getPooledDatabase()
    }
    return this.db
  }

  async findOne<T extends Document>(
    collectionName: string,
    query: Record<string, any>,
    options: QueryOptions = {}
  ): Promise<T | null> {
    const cacheKey = `db:${collectionName}:one:${JSON.stringify(query)}`

    // Check cache first
    if (options.cache) {
      const cached = await advancedCache.get<T | null>(cacheKey)
      if (cached !== undefined) {
        return cached
      }
    }

    try {
      const db = await this.getDb()
      const collection = db.collection<T>(collectionName)
      const result = await collection.findOne(query)

      // Cache result
      if (options.cache) {
        await advancedCache.set(cacheKey, result, {
          ttl: options.ttl,
          tags: options.tags,
        })
      }

      return result
    } finally {
      if (this.db) {
        releaseDatabase(this.db)
      }
    }
  }

  async find<T extends Document>(
    collectionName: string,
    query: Record<string, any> = {},
    options: QueryOptions & { limit?: number; skip?: number } = {}
  ): Promise<T[]> {
    const cacheKey = `db:${collectionName}:many:${JSON.stringify(query)}:${options.limit}:${options.skip}`

    // Check cache first
    if (options.cache) {
      const cached = await advancedCache.get<T[]>(cacheKey)
      if (cached) {
        return cached
      }
    }

    try {
      const db = await this.getDb()
      const collection = db.collection<T>(collectionName)
      let cursor = collection.find(query)

      if (options.skip) {
        cursor = cursor.skip(options.skip)
      }
      if (options.limit) {
        cursor = cursor.limit(options.limit)
      }

      const results = await cursor.toArray()

      // Cache results
      if (options.cache) {
        await advancedCache.set(cacheKey, results, {
          ttl: options.ttl,
          tags: options.tags,
        })
      }

      return results
    } finally {
      if (this.db) {
        releaseDatabase(this.db)
      }
    }
  }

  async insertOne<T extends Document>(
    collectionName: string,
    document: T,
    invalidateTags?: string[]
  ): Promise<string> {
    try {
      const db = await this.getDb()
      const collection = db.collection<T>(collectionName)
      const result = await collection.insertOne(document)

      // Invalidate related cache
      if (invalidateTags) {
        for (const tag of invalidateTags) {
          await advancedCache.invalidateByTag(tag)
        }
      }

      return result.insertedId.toString()
    } finally {
      if (this.db) {
        releaseDatabase(this.db)
      }
    }
  }

  async updateOne<T extends Document>(
    collectionName: string,
    query: Record<string, any>,
    update: Record<string, any>,
    invalidateTags?: string[]
  ): Promise<number> {
    try {
      const db = await this.getDb()
      const collection = db.collection<T>(collectionName)
      const result = await collection.updateOne(query, { $set: update })

      // Invalidate related cache
      if (invalidateTags) {
        for (const tag of invalidateTags) {
          await advancedCache.invalidateByTag(tag)
        }
      }

      return result.modifiedCount
    } finally {
      if (this.db) {
        releaseDatabase(this.db)
      }
    }
  }

  async deleteOne(
    collectionName: string,
    query: Record<string, any>,
    invalidateTags?: string[]
  ): Promise<number> {
    try {
      const db = await this.getDb()
      const collection = db.collection(collectionName)
      const result = await collection.deleteOne(query)

      // Invalidate related cache
      if (invalidateTags) {
        for (const tag of invalidateTags) {
          await advancedCache.invalidateByTag(tag)
        }
      }

      return result.deletedCount
    } finally {
      if (this.db) {
        releaseDatabase(this.db)
      }
    }
  }
}

export const enhancedDb = new DatabaseWrapper()
