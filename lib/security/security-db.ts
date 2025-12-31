import { getDatabase } from "@/config/database"

export interface SecurityThreat {
  ip: string
  timestamp: Date
  date: string
  requestCount: number
  reason: string
  action: string
  type: "ddos" | "brute_force" | "xss" | "sql_injection" | "manual_ban" | "manual_unblock" | "whitelist"
  severity: "low" | "medium" | "high" | "critical"
  userAgent?: string
  url?: string
  method?: string
}

export interface BannedIP {
  ip: string
  reason: string
  bannedAt: Date
  bannedBy: "system" | "admin"
  duration?: number
  expiresAt?: Date
  permanent: boolean
  requestCount?: number
  type: "ddos" | "brute_force" | "manual" | "security_violation"
}

export interface WhitelistedIP {
  ip: string
  reason?: string
  addedAt: Date
  addedBy: "admin"
}

// Save security threat to MongoDB
export async function logSecurityThreat(threat: Omit<SecurityThreat, "date">) {
  try {
    const db = await getDatabase()
    const threatsCollection = db.collection("security_threats")

    const threatWithDate = {
      ...threat,
      date: new Date(threat.timestamp).toISOString(),
    }

    await threatsCollection.insertOne(threatWithDate)
    console.log(`[SECURITY DB] Threat logged to database: ${threat.ip} - ${threat.action}`)
  } catch (error) {
    console.error("[SECURITY DB] Failed to log threat:", error)
  }
}

// Save banned IP to MongoDB
export async function saveBannedIP(ban: BannedIP) {
  try {
    const db = await getDatabase()
    const bannedIPsCollection = db.collection("banned_ips")

    // Check if IP is already banned
    const existing = await bannedIPsCollection.findOne({ ip: ban.ip })

    if (existing) {
      // Update existing ban
      await bannedIPsCollection.updateOne({ ip: ban.ip }, { $set: ban })
    } else {
      // Insert new ban
      await bannedIPsCollection.insertOne(ban)
    }

    console.log(`[SECURITY DB] Banned IP saved to database: ${ban.ip}`)
  } catch (error) {
    console.error("[SECURITY DB] Failed to save banned IP:", error)
  }
}

// Remove banned IP from MongoDB
export async function removeBannedIP(ip: string) {
  try {
    const db = await getDatabase()
    const bannedIPsCollection = db.collection("banned_ips")

    await bannedIPsCollection.deleteOne({ ip })
    console.log(`[SECURITY DB] Banned IP removed from database: ${ip}`)
  } catch (error) {
    console.error("[SECURITY DB] Failed to remove banned IP:", error)
  }
}

// Save whitelisted IP to MongoDB
export async function saveWhitelistedIP(whitelist: WhitelistedIP) {
  try {
    const db = await getDatabase()
    const whitelistedIPsCollection = db.collection("whitelisted_ips")

    // Check if IP is already whitelisted
    const existing = await whitelistedIPsCollection.findOne({ ip: whitelist.ip })

    if (!existing) {
      await whitelistedIPsCollection.insertOne(whitelist)
      console.log(`[SECURITY DB] Whitelisted IP saved to database: ${whitelist.ip}`)
    }
  } catch (error) {
    console.error("[SECURITY DB] Failed to save whitelisted IP:", error)
  }
}

// Get all security threats
export async function getSecurityThreats(limit = 100, skip = 0) {
  try {
    const db = await getDatabase()
    const threatsCollection = db.collection("security_threats")

    const threats = await threatsCollection.find({}).sort({ timestamp: -1 }).skip(skip).limit(limit).toArray()

    return threats
  } catch (error) {
    console.error("[SECURITY DB] Failed to get threats:", error)
    return []
  }
}

// Get all banned IPs
export async function getBannedIPs() {
  try {
    const db = await getDatabase()
    const bannedIPsCollection = db.collection("banned_ips")

    const now = new Date()

    // Get all banned IPs
    const bannedIPs = await bannedIPsCollection.find({}).toArray()

    // Filter out expired temporary bans
    const activeBans = bannedIPs.filter((ban) => {
      if (ban.permanent) return true
      if (!ban.expiresAt) return true
      return new Date(ban.expiresAt) > now
    })

    // Remove expired bans from database
    const expiredBans = bannedIPs.filter((ban) => {
      if (ban.permanent) return false
      if (!ban.expiresAt) return false
      return new Date(ban.expiresAt) <= now
    })

    for (const ban of expiredBans) {
      await removeBannedIP(ban.ip)
    }

    return activeBans
  } catch (error) {
    console.error("[SECURITY DB] Failed to get banned IPs:", error)
    return []
  }
}

// Get all whitelisted IPs
export async function getWhitelistedIPs() {
  try {
    const db = await getDatabase()
    const whitelistedIPsCollection = db.collection("whitelisted_ips")

    const whitelistedIPs = await whitelistedIPsCollection.find({}).toArray()
    return whitelistedIPs
  } catch (error) {
    console.error("[SECURITY DB] Failed to get whitelisted IPs:", error)
    return []
  }
}

// Get security statistics
export async function getSecurityStats() {
  try {
    const db = await getDatabase()
    const threatsCollection = db.collection("security_threats")
    const bannedIPsCollection = db.collection("banned_ips")

    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [totalThreats, threatsToday, totalBanned, criticalThreats] = await Promise.all([
      threatsCollection.countDocuments({}),
      threatsCollection.countDocuments({ timestamp: { $gte: oneDayAgo } }),
      bannedIPsCollection.countDocuments({}),
      threatsCollection.countDocuments({ severity: "critical" }),
    ])

    return {
      totalThreats,
      threatsToday,
      totalBanned,
      criticalThreats,
    }
  } catch (error) {
    console.error("[SECURITY DB] Failed to get security stats:", error)
    return {
      totalThreats: 0,
      threatsToday: 0,
      totalBanned: 0,
      criticalThreats: 0,
    }
  }
}
