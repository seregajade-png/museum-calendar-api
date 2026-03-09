import { NextResponse } from "next/server";

export function corsHeaders(origin?: string | null, isAdmin = false): Record<string, string> {
  let allowedOrigin = "";

  if (isAdmin) {
    const adminOrigins = (process.env.ALLOWED_ADMIN_ORIGINS || "").split(",").filter(Boolean);
    if (adminOrigins.length === 0) {
      allowedOrigin = "";
    } else if (origin && adminOrigins.includes(origin)) {
      allowedOrigin = origin;
    }
  } else {
    const origins = (process.env.ALLOWED_ORIGINS || "*").split(",");
    allowedOrigin =
      origins.includes("*") ? "*" :
      (origin && origins.includes(origin)) ? origin : "";
  }

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    "Access-Control-Max-Age": "86400",
  };

  if (allowedOrigin) {
    headers["Access-Control-Allow-Origin"] = allowedOrigin;
    if (allowedOrigin !== "*") {
      headers["Vary"] = "Origin";
    }
  }

  return headers;
}

export function json(data: unknown, status = 200, origin?: string | null, isAdmin = false) {
  return NextResponse.json(data, {
    status,
    headers: {
      ...corsHeaders(origin, isAdmin),
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
