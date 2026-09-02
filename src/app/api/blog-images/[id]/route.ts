import { GridFSBucket, ObjectId } from "mongodb";
import { getTopGamesDatabase } from "@/lib/top-games-mongodb";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return new Response("Not found", { status: 404 });
    const database = await getTopGamesDatabase();
    const bucket = new GridFSBucket(database, { bucketName: "blog_images" });
    const objectId = new ObjectId(id);
    const file = await bucket.find({ _id: objectId }).next();
    if (!file) return new Response("Not found", { status: 404 });
    const chunks: Buffer[] = [];
    for await (const chunk of bucket.openDownloadStream(objectId)) chunks.push(Buffer.from(chunk));
    return new Response(Buffer.concat(chunks), {
      headers: {
        "Content-Type": String(file.metadata?.contentType || "application/octet-stream"),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
