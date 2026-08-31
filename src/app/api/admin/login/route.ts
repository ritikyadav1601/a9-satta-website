import { NextRequest } from "next/server";
import { verifyKhaiwalAdmin } from "@/lib/khaiwal-admin";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const authenticated = await verifyKhaiwalAdmin(String(email || ""), String(password || ""));

    if (!authenticated) {
      return Response.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
