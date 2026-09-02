import { SITE_DOMAIN, SITE_NAME } from "./site";
import { getTopGamesDatabase } from "./top-games-mongodb";

export type KhaiwalSettings = {
  siteName: string;
  name: string;
  whatsapp: string;
};

const collectionName = "site_settings";
const siteId = SITE_DOMAIN;

export async function getKhaiwalDatabase() {
  return getTopGamesDatabase();
}

export async function getKhaiwalSettings(): Promise<KhaiwalSettings | null> {
  const document = await (await getKhaiwalDatabase())
    .collection<Partial<KhaiwalSettings> & { siteId: string }>(collectionName)
    .findOne({ siteId });
  if (!document) return null;
  return {
    siteName: String(document.siteName || SITE_NAME),
    name: String(document.name || ""),
    whatsapp: String(document.whatsapp || ""),
  };
}

export async function saveKhaiwalSettings(settings: KhaiwalSettings) {
  const cleaned = {
    siteName: String(settings.siteName || SITE_NAME).trim(),
    name: String(settings.name || "").trim(),
    whatsapp: String(settings.whatsapp || "").trim(),
  };
  await (await getKhaiwalDatabase()).collection(collectionName).updateOne(
    { siteId },
    { $set: { ...cleaned, siteId, updatedAt: new Date() } },
    { upsert: true },
  );
  return cleaned;
}
