import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";
import { rateLimit, SECURITY_HEADERS, MAX_BODY_SIZE } from "@/lib/security";
import { verifyJWT } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const isAdmin = request.nextUrl.pathname.startsWith("/api/admin");
  const isDocs = request.nextUrl.pathname === "/api/docs";

  const cors = corsHeaders(origin);
  const allHeaders = { ...SECURITY_HEADERS, ...cors };

  // Docs page needs relaxed CSP to load Scalar scripts/styles
  if (isDocs) {
    allHeaders["Content-Security-Policy"] =
      "default-src 'none'; script-src 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'unsafe-inline' https://cdn.jsdelivr.net; font-src https://cdn.jsdelivr.net https://fonts.gstatic.com; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'";
  }

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: allHeaders });
  }

  if (isAdmin) {
    // JWT authentication (supports both Authorization: Bearer and X-API-Key headers)
    const authResult = await verifyJWT(
      request.headers.get("authorization"),
      request.headers.get("x-api-key")
    );
    if (!authResult.ok) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status, headers: allHeaders }
      );
    }

    // Rate limiting (30 req/min per IP)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rl = rateLimit(ip, 60_000, 30);

    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            ...allHeaders,
            "Retry-After": String(rl.retryAfter),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // Reject oversized bodies for POST/PATCH
    if (request.method === "POST" || request.method === "PATCH") {
      const contentLength = request.headers.get("content-length");
      if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
        return NextResponse.json(
          { error: "Request body too large (max 64KB)" },
          { status: 413, headers: allHeaders }
        );
      }
    }

    allHeaders["X-RateLimit-Remaining"] = String(rl.remaining);
  }

  const response = NextResponse.next();
  Object.entries(allHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
