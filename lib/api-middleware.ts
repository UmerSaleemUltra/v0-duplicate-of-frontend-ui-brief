import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, type JWTPayload } from "./jwt"

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

export function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }
  return null
}

export async function authenticateRequest(
  request: NextRequest,
): Promise<{ success: boolean; user?: JWTPayload; error?: string }> {
  const token = getAuthToken(request)

  if (!token) {
    return { success: false, error: "No token provided" }
  }

  const user = verifyToken(token)

  if (!user) {
    return { success: false, error: "Invalid or expired token" }
  }

  return { success: true, user }
}

export function requireAuth(handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const auth = await authenticateRequest(request)

    if (!auth.success || !auth.user) {
      return NextResponse.json({ success: false, error: auth.error || "Unauthorized" }, { status: 401 })
    }

    return handler(request, auth.user)
  }
}

export function requireAdmin(handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const auth = await authenticateRequest(request)

    if (!auth.success || !auth.user) {
      return NextResponse.json({ success: false, error: auth.error || "Unauthorized" }, { status: 401 })
    }

    if (auth.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    return handler(request, auth.user)
  }
}

export function apiResponse(data: any, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function apiError(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status })
}

export async function verifyAuth(request: NextRequest) {
  const token = getAuthToken(request)

  if (!token) {
    return { authenticated: false, error: "No token provided" }
  }

  const user = verifyToken(token)

  if (!user) {
    return { authenticated: false, error: "Invalid or expired token" }
  }

  return { authenticated: true, userId: user.userId, user }
}
