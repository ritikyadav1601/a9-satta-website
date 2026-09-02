import { NextRequest } from "next/server";
import { verifyKhaiwalAdmin } from "@/lib/khaiwal-admin";
import { getISTDateString } from "@/lib/utils";
import { getTopGameAdminRows, saveTopGameResult } from "@/lib/top-games-mongodb";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "");
    const password = String(body.password || "");
    if (!(await verifyKhaiwalAdmin(email, password))) {
      return Response.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    const date = String(body.date || getISTDateString());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json({ success: false, error: "Invalid date" }, { status: 400 });
    }

    if (body.action === "save") {
      const result = await saveTopGameResult(String(body.game || ""), date, String(body.value || ""));
      return Response.json({ success: true, result });
    }

    const games = await getTopGameAdminRows(date);
    return Response.json({ success: true, date, games });
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
