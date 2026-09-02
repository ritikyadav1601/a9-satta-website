import { NextRequest } from "next/server";
import { verifyKhaiwalAdmin } from "@/lib/khaiwal-admin";
import { getKhaiwalSettings, saveKhaiwalSettings } from "@/lib/khaiwal-mongodb";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!(await verifyKhaiwalAdmin(String(body.email || ""), String(body.password || "")))) {
      return Response.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    if (body.action === "save") {
      const existing = await getKhaiwalSettings();
      const khaiwal = await saveKhaiwalSettings({
        siteName: String(body.siteName ?? existing?.siteName ?? ""),
        name: String(body.name ?? existing?.name ?? ""),
        whatsapp: String(body.whatsapp ?? existing?.whatsapp ?? ""),
      });
      return Response.json({ success: true, khaiwal });
    }

    return Response.json({ success: true, khaiwal: await getKhaiwalSettings() });
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
