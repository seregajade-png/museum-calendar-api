import { jwtVerify } from "jose";

export interface JWTPayload {
  sub?: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/**
 * Verify JWT HS256 token.
 * Accepts token from Authorization: Bearer header OR X-API-Key header.
 * Validates signature, exp, iss, aud, role.
 *
 * Env vars:
 *   JWT_SECRET   — shared HS256 secret (required)
 *   JWT_ISSUER   — expected `iss` claim (required)
 *   JWT_AUDIENCE — expected `aud` claim (required)
 */
export async function verifyJWT(
  authHeader: string | null,
  apiKeyHeader?: string | null
): Promise<{ ok: true; payload: JWTPayload } | { ok: false; error: string; status: 401 | 403 }> {
  let token: string | null = null;

  // 1. Try Authorization: Bearer <token>
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.slice(7).trim();
  }

  // 2. Fallback: X-API-Key header (treat value as JWT token)
  if (!token && apiKeyHeader) {
    token = apiKeyHeader.trim();
  }

  if (!token) {
    return { ok: false, error: "Missing or invalid Authorization header. Expected: Bearer <token>", status: 401 };
  }

  const secret = process.env.JWT_SECRET;
  const issuer = process.env.JWT_ISSUER;
  const audience = process.env.JWT_AUDIENCE;

  if (!secret) {
    console.error("JWT_SECRET env var is not set");
    return { ok: false, error: "Server auth misconfiguration", status: 403 };
  }

  try {
    const secretKey = new TextEncoder().encode(secret);

    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
      ...(issuer ? { issuer } : {}),
      ...(audience ? { audience } : {}),
      clockTolerance: 5, // 5 seconds tolerance for clock skew
    });

    // Check role claim (Microsoft-style claim key used by ankodo/TicketSystem)
    const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
    const role = payload[ROLE_CLAIM];
    if (role !== "Admin") {
      return { ok: false, error: "Insufficient permissions: Admin role required", status: 403 };
    }

    return { ok: true, payload: payload as JWTPayload };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Token verification failed";
    const errName = err instanceof Error ? err.constructor.name : "Unknown";

    // Log full error details for debugging (visible in Vercel runtime logs)
    console.error(`JWT verification failed: [${errName}] ${message}`, {
      tokenPrefix: token.substring(0, 20) + "...",
      tokenLength: token.length,
    });

    if (message.includes("expired")) {
      return { ok: false, error: "Token expired", status: 401 };
    }
    if (message.includes("audience") || message.includes("issuer")) {
      return { ok: false, error: `Token claim validation failed: ${message}`, status: 403 };
    }
    if (message.includes("signature")) {
      return { ok: false, error: "Invalid token signature", status: 403 };
    }

    return { ok: false, error: `Invalid token: ${message}`, status: 403 };
  }
}
