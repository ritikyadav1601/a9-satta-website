import { MongoClient } from "mongodb";
import { SITE_DOMAIN, SITE_NAME } from "./site";

export type KhaiwalSettings = {
  siteName: string;
  name: string;
  whatsapp: string;
};

const databaseName = process.env.KHAIWAL_MONGODB_DATABASE || "khaiwal_management";
const collectionName = "site_settings";
const siteId = SITE_DOMAIN;

declare global {
  var khaiwalMongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getKhaiwalDatabase() {
  const uri = process.env.KHAIWAL_MONGODB_URI?.trim();
  if (!uri) throw new Error("KHAIWAL_MONGODB_URI is not configured.");
  global.khaiwalMongoClientPromise ||= new MongoClient(uri).connect();
  return (await global.khaiwalMongoClientPromise).db(databaseName);
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
