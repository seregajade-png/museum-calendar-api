import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { json } from "@/lib/cors";
import { isValidUUID, sanitize } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!isValidUUID(params.id)) {
      return json({ error: "Invalid ID format" }, 400, null, true);
    }

    const body = await req.json();
    const { date } = body;
    const label = body.label !== undefined ? sanitize(body.label) : undefined;

    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return json({ error: "Invalid date format. Expected YYYY-MM-DD" }, 400, null, true);
    }

    if (date) {
      const parsed = new Date(date + "T00:00:00Z");
      if (isNaN(parsed.getTime())) {
        return json({ error: "Invalid date value" }, 400, null, true);
      }
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (date !== undefined) { fields.push(`date = $${idx++}`); values.push(date); }
    if (label !== undefined) { fields.push(`label = $${idx++}`); values.push(label || null); }

    if (fields.length === 0) {
      return json({ error: "No fields to update" }, 400, null, true);
    }

    values.push(params.id);
    const data = await queryOne(
      `UPDATE holidays SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (!data) return json({ error: "Holiday not found" }, 404, null, true);

    return json(data, 200, req.headers.get("origin"), true);
  } catch (err) {
    console.error("Update holiday error:", err);
    return json({ error: "Internal server error" }, 500, null, true);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!isValidUUID(params.id)) {
      return json({ error: "Invalid ID format" }, 400, null, true);
    }

    await query("DELETE FROM holidays WHERE id = $1", [params.id]);

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("Delete holiday error:", err);
    return json({ error: "Internal server error" }, 500, null, true);
  }
}
