import { NextRequest } from "next/server";
import {
  deleteExtraResult,
  getExtraResultsForDate,
  listExtraResults,
  saveExtraResult,
} from "@/lib/extra-games-mongodb";
import { getKhaiwalSettings, saveKhaiwalSettings } from "@/lib/khaiwal-mongodb";
import { verifyKhaiwalAdmin } from "@/lib/khaiwal-admin";
import { getISTDateString } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("list")) {
      const now = new Date();
      const all = searchParams.get("all");
      const month = all ? undefined : Number(searchParams.get("month") || now.getMonth() + 1);
      const year = all ? undefined : Number(searchParams.get("year") || now.getFullYear());
      return Response.json({ success: true, entries: await listExtraResults(month, year) });
    }

    const date = searchParams.get("date") || getISTDateString(0);
    const [games, khaiwal] = await Promise.all([
      getExtraResultsForDate(date),
      getKhaiwalSettings().catch(() => null),
    ]);
    return Response.json({ success: true, games, khaiwal });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, games, siteName, khaiwalName, whatsapp, khaiwal, date } = body;
    if (!(await verifyKhaiwalAdmin(email, password))) {
      return Response.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    const targetDate = date || getISTDateString(0);
    const existingKhaiwal = await getKhaiwalSettings().catch(() => null);
    const hasKhaiwalInput = khaiwal != null || siteName != null || khaiwalName != null || whatsapp != null;
    const finalKhaiwal = !hasKhaiwalInput
      ? existingKhaiwal
      : khaiwal || {
          siteName: siteName ?? existingKhaiwal?.siteName ?? "",
          name: khaiwalName ?? existingKhaiwal?.name ?? "",
          whatsapp: whatsapp ?? existingKhaiwal?.whatsapp ?? "",
        };

    if (hasKhaiwalInput && finalKhaiwal) await saveKhaiwalSettings(finalKhaiwal);
    await Promise.all(
      Object.entries(games || {})
        .filter(([, value]) => String(value ?? "").trim())
        .map(([game, value]) => saveExtraResult(targetDate, game, String(value))),
    );

    return Response.json({
      success: true,
      games: await getExtraResultsForDate(targetDate),
      khaiwal: finalKhaiwal,
    });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { email, password, date, game, value } = await req.json();
    if (!(await verifyKhaiwalAdmin(email, password))) {
      return Response.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }
    if (!date || !game) {
      return Response.json({ success: false, error: "date and game are required" }, { status: 400 });
    }
    await saveExtraResult(date, game, String(value ?? ""));
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { email, password, date, game } = await req.json();
    if (!(await verifyKhaiwalAdmin(email, password))) {
      return Response.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }
    if (!date || !game) {
      return Response.json({ success: false, error: "date and game are required" }, { status: 400 });
    }
    await deleteExtraResult(date, game);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
