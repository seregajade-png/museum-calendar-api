import { NextResponse } from "next/server";

export function corsHeaders(origin?: string | null): Record<string, string> {
  const allowed = (process.env.ALLOWED_ORIGINS || "*").split(",");
  const allowedOrigin =
    allowed.includes("*") ? "*" :
    (origin && allowed.includes(origin)) ? origin : "";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    "Access-Control-Max-Age": "86400",
  };
}

export function json(data: unknown, status = 200, origin?: string | null) {
  return NextResponse.json(data, {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
