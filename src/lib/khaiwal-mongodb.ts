import { MongoClient } from "mongodb";

export type KhaiwalSettings = {
  name: string;
  whatsapp: string;
};

const databaseName = process.env.KHAIWAL_MONGODB_DATABASE || "khaiwal_management";
const collectionName = "site_settings";
const siteId = "sattaonlineresult";

declare global {
  var khaiwalMongoClientPromise: Promise<MongoClient> | undefined;
}

async function getDatabase() {
  const uri = process.env.KHAIWAL_MONGODB_URI?.trim();
  if (!uri) throw new Error("KHAIWAL_MONGODB_URI is not configured.");
  global.khaiwalMongoClientPromise ||= new MongoClient(uri).connect();
  return (await global.khaiwalMongoClientPromise).db(databaseName);
}

export async function getKhaiwalSettings(): Promise<KhaiwalSettings | null> {
  const document = await (await getDatabase())
    .collection<Partial<KhaiwalSettings> & { siteId: string }>(collectionName)
    .findOne({ siteId });
  if (!document) return null;
  return {
    name: String(document.name || ""),
    whatsapp: String(document.whatsapp || ""),
  };
}

export async function saveKhaiwalSettings(settings: KhaiwalSettings) {
  const cleaned = {
    name: String(settings.name || "").trim(),
    whatsapp: String(settings.whatsapp || "").trim(),
  };
  await (await getDatabase()).collection(collectionName).updateOne(
    { siteId },
    { $set: { ...cleaned, siteId, updatedAt: new Date() } },
    { upsert: true },
  );
  return cleaned;
}
