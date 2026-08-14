import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const COLLECTION = "custom_games";

// GET - Fetch monthly chart data for a custom game
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game"); // e.g. "kohlapur"
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1), 10);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);

  if (!game) {
    return Response.json({ success: false, error: "game is required" }, { status: 400 });
  }

  try {
    // Get all dates for the given month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // last day of month
    const daysInMonth = endDate.getDate();

    const results: { date: string; day: string; result: string }[] = [];

    // Fetch all docs for this month
    const startStr = `${year}-${String(month).padStart(2, "0")}-01`;
    const endStr = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    const snapshot = await getAdminDb()
      .collection(COLLECTION)
      .where("__name__", ">=", startStr)
      .where("__name__", "<=", endStr)
      .get();

    const dataMap: Record<string, string> = {};
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data[game]) {
        dataMap[doc.id] = data[game];
      }
    });

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d);
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayName = dayNames[dateObj.getDay()];

      results.push({
        date: String(d).padStart(2, "0"),
        day: dayName,
        result: dataMap[dateStr] || "XX",
      });
    }

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    return Response.json({
      success: true,
      gameName: game.replace(/-/g, " ").toUpperCase(),
      chartTitle: `${game.replace(/-/g, " ").toUpperCase()} - ${monthNames[month - 1]} ${year}`,
      month: monthNames[month - 1],
      year: String(year),
      columns: ["Date", "Day", "Result"],
      results,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
