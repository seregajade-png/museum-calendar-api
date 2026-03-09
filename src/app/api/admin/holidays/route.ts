import { NextRequest } from "next/server";
import { query, queryOne } from "@/lib/db";
import { json } from "@/lib/cors";
import { sanitize } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const year = req.nextUrl.searchParams.get("year");

    if (year && !/^\d{4}$/.test(year)) {
      return json({ error: "Invalid year format. Expected YYYY" }, 400, null, true);
    }

    let data;
    if (year) {
      data = await query("SELECT * FROM holidays WHERE date >= $1 AND date <= $2 ORDER BY date", [
        `${year}-01-01`,
        `${year}-12-31`,
      ]);
    } else {
      data = await query("SELECT * FROM holidays ORDER BY date");
    }

    return json(data, 200, req.headers.get("origin"), true);
  } catch (err) {
    console.error("List holidays error:", err);
    return json({ error: "Internal server error" }, 500, null, true);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date } = body;
    const label = body.label !== undefined ? sanitize(body.label) : null;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return json({ error: "Invalid date format. Expected YYYY-MM-DD" }, 400, null, true);
    }

    const parsed = new Date(date + "T00:00:00Z");
    if (isNaN(parsed.getTime())) {
      return json({ error: "Invalid date value" }, 400, null, true);
    }

    const data = await queryOne(
      "INSERT INTO holidays (date, label) VALUES ($1, $2) RETURNING *",
      [date, label || null]
    );

    return json(data, 201, req.headers.get("origin"), true);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505") {
      return json({ error: "Holiday already exists for this date" }, 409, null, true);
    }
    console.error("Create holiday error:", err);
    return json({ error: "Internal server error" }, 500, null, true);
  }
}
