import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getKhaiwalSettings, saveKhaiwalSettings } from "@/lib/khaiwal-mongodb";

const COLLECTION = "custom_games";
const ADMIN_EMAIL = "kapil123@gmail.com";
const ADMIN_PASSWORD = "Kapil@1997";

// Known custom game keys (used to flatten the per-date map into a result list)
const GAME_KEYS = ["kohlapur", "manipur", "up-bazar", "palwal-city", "mathura-city"];

function isAuthed(email?: string, password?: string) {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

// GET
//   ?date=YYYY-MM-DD            -> { games: { kohlapur: "45", ... } }  (used by homepage)
//   ?list=1&month=&year=       -> { entries: [{ date, game, value }] } (used by admin list)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // List mode for the admin results panel
    if (searchParams.get("list")) {
      const now = new Date();
      const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1), 10);
      const year = parseInt(searchParams.get("year") || String(now.getFullYear()), 10);
      const all = searchParams.get("all"); // when set, ignore month/year and return everything

      let snapshot;
      if (all) {
        snapshot = await getAdminDb().collection(COLLECTION).get();
      } else {
        const daysInMonth = new Date(year, month, 0).getDate();
        const startStr = `${year}-${String(month).padStart(2, "0")}-01`;
        const endStr = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
        snapshot = await getAdminDb()
          .collection(COLLECTION)
          .where("__name__", ">=", startStr)
          .where("__name__", "<=", endStr)
          .get();
      }

      const entries: { date: string; game: string; value: string }[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() || {};
        GAME_KEYS.forEach((g) => {
          if (data[g] != null && String(data[g]).trim() !== "") {
            entries.push({ date: doc.id, game: g, value: String(data[g]) });
          }
        });
      });

      // Newest date first; stable game order within a date
      entries.sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return GAME_KEYS.indexOf(a.game) - GAME_KEYS.indexOf(b.game);
      });

      return Response.json({ success: true, entries });
    }

    // Single-date mode (homepage)
    const today = searchParams.get("date") || new Date().toISOString().slice(0, 10);
    const [snap, mongoKhaiwal] = await Promise.all([
      getAdminDb().collection(COLLECTION).doc(today).get(),
      getKhaiwalSettings().catch(() => null),
    ]);
    const data = snap.data() || {};

    if (!snap.exists) {
      return Response.json({ success: true, games: {}, khaiwal: mongoKhaiwal });
    }
    
    return Response.json({
      success: true,
      games: {
        kohlapur: data.kohlapur || "",
        manipur: data.manipur || "",
        "up-bazar": data["up-bazar"] || "",
        "palwal-city": data["palwal-city"] || "",
        "mathura-city": data["mathura-city"] || "",
      },
      khaiwal: mongoKhaiwal || data.khaiwal || null,
    });
    // if (!snap.exists) {
    //   return Response.json({ success: true, games: {} });
    // }

    // return Response.json({ success: true, games: snap.data() || {} });
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Save custom game values (with simple auth)
export async function POST(req: NextRequest) {
  try {
    // const body = await req.json();
    // console.log("BODY >>>", body);
    // const { email, password, games,khaiwal, khaiwalName, whatsapp,date } = body;
    // const finalKhaiwal = khaiwal || {
    //   name: khaiwalName,
    //   whatsapp: whatsapp,
    // };
    // if (!isAuthed(email, password)) {
    //   return Response.json(
    //     { success: false, error: "Invalid credentials" },
    //     { status: 401 }
    //   );
    // }

    // const targetDate = date || new Date().toISOString().slice(0, 10);

    // // Merge with existing data for that date
    // const docRef = adminDb.collection(COLLECTION).doc(targetDate);
    // const existing = await docRef.get();
    // const existingData = existing.exists ? existing.data() || {} : {};

    // const updatedData = { ...existingData, ...games, khaiwal: finalKhaiwal ?? existingData.khaiwal ?? null, updatedAt: Date.now() };
    // await docRef.set(updatedData);

    // return Response.json({ success: true, games: updatedData });
    const body = await req.json();

const {
  email,
  password,
  games,
  khaiwalName,
  whatsapp,
  khaiwal,
  date,
} = body;

if (!isAuthed(email, password)) {
  return Response.json(
    { success: false, error: "Invalid credentials" },
    { status: 401 }
  );
}

const targetDate = date || new Date().toISOString().slice(0, 10);

const docRef = getAdminDb().collection(COLLECTION).doc(targetDate);
const existing = await docRef.get();
const existingData = existing.exists ? existing.data() || {} : {};
const existingMongoKhaiwal = await getKhaiwalSettings().catch(() => null);

// ✅ Khaiwal can be saved on its own (name/whatsapp) or together with games.
// Accept a partial update — keep any field the admin didn't send.
const hasKhaiwalInput =
  khaiwal != null || khaiwalName != null || whatsapp != null;

const finalKhaiwal = !hasKhaiwalInput
  ? existingMongoKhaiwal || existingData.khaiwal || null
  : khaiwal || {
      name: khaiwalName ?? existingMongoKhaiwal?.name ?? existingData.khaiwal?.name ?? "",
      whatsapp: whatsapp ?? existingMongoKhaiwal?.whatsapp ?? existingData.khaiwal?.whatsapp ?? "",
    };

if (hasKhaiwalInput && finalKhaiwal) {
  await saveKhaiwalSettings(finalKhaiwal);
}

const updatedData = {
  ...existingData,
  ...(games || {}),
  updatedAt: Date.now(),
};

await docRef.set(updatedData);

return Response.json({
  success: true,
  games: updatedData,
  khaiwal: finalKhaiwal,
});
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// PATCH - Update a single game's value for a given date
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, date, game, value } = body;

    if (!isAuthed(email, password)) {
      return Response.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }
    if (!date || !game) {
      return Response.json({ success: false, error: "date and game are required" }, { status: 400 });
    }

    await getAdminDb()
      .collection(COLLECTION)
      .doc(date)
      .set({ [game]: String(value ?? "").trim(), updatedAt: Date.now() }, { merge: true });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Remove a single game's value for a given date
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, date, game } = body;

    if (!isAuthed(email, password)) {
      return Response.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }
    if (!date || !game) {
      return Response.json({ success: false, error: "date and game are required" }, { status: 400 });
    }

    await getAdminDb()
      .collection(COLLECTION)
      .doc(date)
      .update({ [game]: FieldValue.delete(), updatedAt: Date.now() });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
