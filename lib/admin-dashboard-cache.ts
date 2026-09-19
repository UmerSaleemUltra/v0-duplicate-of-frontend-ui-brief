import { authService } from "@/lib/auth"

export interface DashboardSnapshot {
  orders: any[]
  allOrders: any[]
  stats: {
    totalRevenue: number
    monthlyRevenue: number
    totalOrders: number
    activeCustomers: number
  }
  stateBreakdown: any[]
  monthlyData: any[]
  chartData: any[]
  packageData: any[]
  heatmapData: any[]
  cityBreakdown: { city: string; country: string; count: number; percentage: number }[]
  abandonedCheckouts: any[]
  abandonedStats: {
    total: number
    last24h: number
    last7Days: number
    potentialRevenue: number
    stepBreakdown: Record<string, number>
  }
}

const SNAPSHOT_KEY = "admin-dashboard-snapshot-v1"

// Layer A — in-memory snapshot for instant paint (survives client-side navigation).
let memorySnapshot: DashboardSnapshot | null = null

// Layer B — raw prefetched API responses (warmed on hover), valid briefly.
const PREFETCH_TTL = 15_000
let rawPrefetch: { ts: number; users: any; companies: any; abandoned: any; abandonedQuery: string } | null = null
let inflightPrefetch: Promise<void> | null = null

function prefetchFresh(): boolean {
  return !!rawPrefetch && Date.now() - rawPrefetch.ts < PREFETCH_TTL
}

export function getDashboardSnapshot(): DashboardSnapshot | null {
  if (memorySnapshot) return memorySnapshot
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_KEY)
    if (!raw) return null
    memorySnapshot = JSON.parse(raw) as DashboardSnapshot
    return memorySnapshot
  } catch {
    return null
  }
}

export function setDashboardSnapshot(snapshot: DashboardSnapshot): void {
  memorySnapshot = snapshot
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot))
  } catch {
    // Ignore quota / serialization errors — memory cache still applies.
  }
}

export function buildAbandonedQuery(range: { from: string; to: string }): string {
  return range.from && range.to ? `?from=${range.from}&to=${range.to}` : "?all=true"
}

/**
 * Fetches the three dashboard datasets in parallel. Reuses a fresh prefetch when
 * available so a hover-triggered warm-up makes the actual navigation instant.
 */
export async function fetchDashboardData(
  token: string,
  abandonedQuery: string,
): Promise<{ users: any; companies: any; abandoned: any }> {
  const authHeaders = { Authorization: `Bearer ${token}` }

  // Reuse the hover-warmed prefetch when it is still fresh.
  if (prefetchFresh() && rawPrefetch) {
    const cached = rawPrefetch
    // users + companies are range-independent, so always reusable.
    // abandoned depends on the date range, so only reuse it on an exact query match.
    const abandoned =
      cached.abandonedQuery === abandonedQuery
        ? cached.abandoned
        : await fetch(`/api/abandoned-checkouts${abandonedQuery}`, {
            headers: authHeaders,
            cache: "no-store",
          }).then((res) => res.json())
    return { users: cached.users, companies: cached.companies, abandoned }
  }

  const [users, companies, abandoned] = await Promise.all([
    fetch("/api/users?includeCompanies=false", {
      headers: authHeaders,
      cache: "no-store",
    }).then((res) => res.json()),
    fetch("/api/companies", {
      headers: authHeaders,
      cache: "no-store",
    }).then((res) => res.json()),
    fetch(`/api/abandoned-checkouts${abandonedQuery}`, {
      headers: authHeaders,
      cache: "no-store",
    }).then((res) => res.json()),
  ])

  return { users, companies, abandoned }
}

/**
 * Warms the dashboard data on hover. Fire-and-forget: results land in the
 * short-lived prefetch cache so the next dashboard load skips the network.
 */
export function prefetchAdminDashboard(abandonedQuery = "?all=true"): void {
  if (typeof window === "undefined") return
  if (inflightPrefetch) return
  if (prefetchFresh()) return

  const token = authService.getToken()
  if (!token) return

  const authHeaders = { Authorization: `Bearer ${token}` }
  inflightPrefetch = Promise.all([
    fetch("/api/users?includeCompanies=false", {
      headers: authHeaders,
      cache: "no-store",
    }).then((res) => res.json()),
    fetch("/api/companies", {
      headers: authHeaders,
      cache: "no-store",
    }).then((res) => res.json()),
    fetch(`/api/abandoned-checkouts${abandonedQuery}`, {
      headers: authHeaders,
      cache: "no-store",
    }).then((res) => res.json()),
  ])
    .then(([users, companies, abandoned]) => {
      rawPrefetch = { ts: Date.now(), users, companies, abandoned, abandonedQuery }
    })
    .catch(() => {
      // Ignore prefetch failures; the real load will retry.
    })
    .finally(() => {
      inflightPrefetch = null
    })
}
