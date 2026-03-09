import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { json } from "@/lib/cors";
import { isValidUUID, sanitize, sanitizeArray } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!isValidUUID(params.id)) {
      return json({ error: "Invalid ID format" }, 400, null, true);
    }

    const body = await req.json();
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (body.slug !== undefined) {
      const slug = sanitize(body.slug);
      if (!/^[a-z0-9\-]+$/.test(slug)) {
        return json({ error: "slug must contain only lowercase letters, numbers, and hyphens" }, 400, null, true);
      }
      fields.push(`slug = $${idx++}`); values.push(slug);
    }
    if (body.day_type !== undefined) {
      if (!["weekday", "weekend"].includes(body.day_type)) {
        return json({ error: "day_type must be 'weekday' or 'weekend'" }, 400, null, true);
      }
      fields.push(`day_type = $${idx++}`); values.push(body.day_type);
    }
    if (body.name !== undefined) { fields.push(`name = $${idx++}`); values.push(sanitize(body.name)); }
    if (body.description !== undefined) { fields.push(`description = $${idx++}`); values.push(sanitize(body.description)); }
    if (body.price !== undefined) { fields.push(`price = $${idx++}`); values.push(Math.max(0, Math.floor(Number(body.price) || 0))); }
    if (typeof body.purchasable === "boolean") { fields.push(`purchasable = $${idx++}`); values.push(body.purchasable); }
    if (body.tilda_product_id !== undefined) { fields.push(`tilda_product_id = $${idx++}`); values.push(body.tilda_product_id ? sanitize(body.tilda_product_id) : null); }
    if (body.info_text !== undefined) { fields.push(`info_text = $${idx++}`); values.push(body.info_text ? sanitize(body.info_text) : null); }
    if (body.info_categories !== undefined) { fields.push(`info_categories = $${idx++}`); values.push(sanitizeArray(body.info_categories)); }
    if (body.sort_order !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(Math.max(0, Math.floor(Number(body.sort_order) || 0))); }

    if (fields.length === 0) {
      return json({ error: "No fields to update" }, 400, null, true);
    }

    values.push(params.id);
    const data = await queryOne(
      `UPDATE tariffs SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (!data) return json({ error: "Tariff not found" }, 404, null, true);

    return json(data, 200, req.headers.get("origin"), true);
  } catch (err) {
    console.error("Update tariff error:", err);
    return json({ error: "Internal server error" }, 500, null, true);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!isValidUUID(params.id)) {
      return json({ error: "Invalid ID format" }, 400, null, true);
    }

    await query("DELETE FROM tariffs WHERE id = $1", [params.id]);

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("Delete tariff error:", err);
    return json({ error: "Internal server error" }, 500, null, true);
  }
}
