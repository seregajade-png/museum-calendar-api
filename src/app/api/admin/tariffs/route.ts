import { NextRequest } from "next/server";
import { query, queryOne } from "@/lib/db";
import { json } from "@/lib/cors";
import { sanitize, sanitizeArray } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const dayType = req.nextUrl.searchParams.get("day_type");

    if (dayType && !["weekday", "weekend"].includes(dayType)) {
      return json({ error: "day_type must be 'weekday' or 'weekend'" }, 400);
    }

    let data;
    if (dayType) {
      data = await query("SELECT * FROM tariffs WHERE day_type = $1 ORDER BY sort_order", [dayType]);
    } else {
      data = await query("SELECT * FROM tariffs ORDER BY sort_order");
    }

    return json(data, 200, req.headers.get("origin"));
  } catch (err) {
    console.error("List tariffs error:", err);
    return json({ error: "Internal server error" }, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const slug = sanitize(body.slug);
    const day_type = body.day_type;
    const name = sanitize(body.name);

    if (!slug || !day_type || !name) {
      return json({ error: "Required fields: slug, day_type, name" }, 400);
    }
    if (!["weekday", "weekend"].includes(day_type)) {
      return json({ error: "day_type must be 'weekday' or 'weekend'" }, 400);
    }
    if (!/^[a-z0-9\-]+$/.test(slug)) {
      return json({ error: "slug must contain only lowercase letters, numbers, and hyphens" }, 400);
    }

    const price = typeof body.price === "number" ? Math.max(0, Math.floor(body.price)) : 0;
    const sort_order = typeof body.sort_order === "number" ? Math.max(0, Math.floor(body.sort_order)) : 0;

    const data = await queryOne(
      `INSERT INTO tariffs (slug, day_type, name, description, price, purchasable, tilda_product_id, info_text, info_categories, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        slug,
        day_type,
        name,
        sanitize(body.description) || "",
        price,
        typeof body.purchasable === "boolean" ? body.purchasable : true,
        body.tilda_product_id ? sanitize(body.tilda_product_id) : null,
        body.info_text ? sanitize(body.info_text) : null,
        sanitizeArray(body.info_categories),
        sort_order,
      ]
    );

    return json(data, 201, req.headers.get("origin"));
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505") {
      return json({ error: "Tariff with this slug already exists" }, 409);
    }
    console.error("Create tariff error:", err);
    return json({ error: "Internal server error" }, 500);
  }
}
