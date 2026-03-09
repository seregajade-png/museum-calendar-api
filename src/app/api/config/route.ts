import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

function mapTariff(t: Record<string, unknown>) {
  const result: Record<string, unknown> = {
    id: t.slug,
    name: t.name,
    description: t.description,
    price: t.price,
    purchasable: t.purchasable,
  };
  if (t.tilda_product_id) result.tilda_product_id = t.tilda_product_id;
  if (!t.purchasable && t.info_text) result.info_text = t.info_text;
  if (!t.purchasable && t.info_categories) result.info_categories = t.info_categories;
  return result;
}

export async function GET() {
  try {
    const holidays = await query(
      "SELECT date FROM holidays WHERE date >= $1 ORDER BY date",
      [`${new Date().getFullYear()}-01-01`]
    );

    const tariffs = await query(
      "SELECT slug, day_type, name, description, price, purchasable, tilda_product_id, info_text, info_categories, sort_order FROM tariffs ORDER BY sort_order"
    );

    const config = {
      holidays: holidays.map((h) => h.date),
      weekday_tariffs: tariffs.filter((t) => t.day_type === "weekday").map(mapTariff),
      weekend_tariffs: tariffs.filter((t) => t.day_type === "weekend").map(mapTariff),
      weekend_notices: [
        { type: "warning", icon: "\u26a0\ufe0f", text: "\u041b\u044c\u0433\u043e\u0442\u044b \u0432 \u0432\u044b\u0445\u043e\u0434\u043d\u044b\u0435 \u0434\u043d\u0438 \u043d\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u044e\u0442" },
        { type: "info", icon: "\ud83d\udc76", text: "\u0414\u0435\u0442\u0438 \u0434\u043e 3-\u0445 \u043b\u0435\u0442 \u2014 \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e (\u0432 \u0441\u043e\u043f\u0440\u043e\u0432\u043e\u0436\u0434\u0435\u043d\u0438\u0438 \u0432\u0437\u0440\u043e\u0441\u043b\u044b\u0445)" },
      ],
      currency: "\u20bd",
    };

    return NextResponse.json(config);
  } catch (err) {
    console.error("Config fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
