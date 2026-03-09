import { NextResponse } from "next/server";
import { openApiSpec } from "@/lib/openapi";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // JSON spec endpoint
  if (searchParams.get("format") === "json") {
    return NextResponse.json(openApiSpec);
  }

  // Scalar UI
  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Museum Calendar API — Docs</title>
</head>
<body>
  <script id="api-reference" data-url="/api/docs?format=json"></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
