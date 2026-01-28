/**
 * Database Connection Pool Manager
 * Manages MongoDB connection pooling with load distribution
 */

import { MongoClient, type Db } from 'mongodb'

interface PooledConnection {
  client: MongoClient
  db: Db
  activeRequests: number
  lastUsed: number
  healthy: boolean
}

class ConnectionPool {
  private connections: Map<string, PooledConnection> = new Map()
  private readonly maxPoolSize = 5
  private readonly connectionTimeout = 30000
  private readonly healthCheckInterval = 10000
  private healthCheckTimer: NodeJS.Timeout | null = null

  constructor() {
    this.startHealthCheck()
  }

  private startHealthCheck() {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck()
    }, this.healthCheckInterval)

    // Clear on process exit
    if (typeof process !== 'undefined') {
      process.on('exit', () => {
        if (this.healthCheckTimer) {
          clearInterval(this.healthCheckTimer)
        }
      })
    }
  }

  private async performHealthCheck() {
    for (const [id, connection] of this.connections.entries()) {
      try {
        // Simple ping to check connection health
        await connection.db.admin().ping()
        connection.healthy = true
      } catch (error) {
        console.error(`[ConnectionPool] Health check failed for ${id}:`, error)
        connection.healthy = false
        
        // Remove unhealthy connection
        try {
          await connection.client.close()
        } catch (closeError) {
          console.error(`[ConnectionPool] Failed to close connection ${id}:`, closeError)
        }
        
        this.connections.delete(id)
      }
    }
  }

  async getConnection(): Promise<Db> {
    // Return least busy healthy connection
    let bestConnection: PooledConnection | null = null
    let lowestLoad = Infinity

    for (const connection of this.connections.values()) {
      if (connection.healthy && connection.activeRequests < lowestLoad) {
        bestConnection = connection
        lowestLoad = connection.activeRequests
      }
    }

    if (bestConnection) {
      bestConnection.activeRequests++
      bestConnection.lastUsed = Date.now()
      return bestConnection.db
    }

    // Create new connection if under pool size limit
    if (this.connections.size < this.maxPoolSize) {
      return await this.createConnection()
    }

    // All connections busy, return least busy one
    let leastBusyConnection: PooledConnection | null = null
    let minRequests = Infinity

    for (const connection of this.connections.values()) {
      if (connection.activeRequests < minRequests) {
        leastBusyConnection = connection
        minRequests = connection.activeRequests
      }
    }

    if (leastBusyConnection) {
      leastBusyConnection.activeRequests++
      leastBusyConnection.lastUsed = Date.now()
      return leastBusyConnection.db
    }

    // Fallback: create new connection
    return await this.createConnection()
  }

  private async createConnection(): Promise<Db> {
    const uri = process.env.MONGODB_URI
    if (!uri) {
      throw new Error('MONGODB_URI not set')
    }

    try {
      const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: this.connectionTimeout,
        maxPoolSize: 10,
        minPoolSize: 2,
      })

      await client.connect()

      const db = client.db(process.env.MONGODB_DB || 'llc_formation')
      const id = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const connection: PooledConnection = {
        client,
        db,
        activeRequests: 1,
        lastUsed: Date.now(),
        healthy: true,
      }

      this.connections.set(id, connection)
      return db
    } catch (error) {
      console.error('[ConnectionPool] Failed to create connection:', error)
      throw error
    }
  }

  releaseConnection(_db: Db) {
    // Decrement active request count for connections
    for (const connection of this.connections.values()) {
      if (connection.db === _db && connection.activeRequests > 0) {
        connection.activeRequests--
        connection.lastUsed = Date.now()
        break
      }
    }
  }

  async closeAll() {
    const promises: Promise<void>[] = []

    for (const connection of this.connections.values()) {
      promises.push(
        connection.client.close().catch(error => {
          console.error('[ConnectionPool] Error closing connection:', error)
        })
      )
    }

    await Promise.all(promises)
    this.connections.clear()

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
    }
  }

  getStats() {
    const stats = {
      poolSize: this.connections.size,
      totalActiveRequests: 0,
      connections: Array.from(this.connections.values()).map(conn => ({
        activeRequests: conn.activeRequests,
        healthy: conn.healthy,
        lastUsed: conn.lastUsed,
      })),
    }

    for (const conn of this.connections.values()) {
      stats.totalActiveRequests += conn.activeRequests
    }

    return stats
  }
}

export const connectionPool = new ConnectionPool()

// Initialize cached connection for backward compatibility
let cachedDb: Db | null = null

export async function getPooledDatabase(): Promise<Db> {
  if (cachedDb) {
    return cachedDb
  }

  cachedDb = await connectionPool.getConnection()
  return cachedDb
}

export function releaseDatabase(db: Db) {
  connectionPool.releaseConnection(db)
}
