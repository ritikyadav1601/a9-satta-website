import { NextRequest } from "next/server";
import { GridFSBucket } from "mongodb";
import { verifyKhaiwalAdmin } from "@/lib/khaiwal-admin";
import { getTopGamesDatabase } from "@/lib/top-games-mongodb";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    if (!(await verifyKhaiwalAdmin(String(form.get("email") || ""), String(form.get("password") || "")))) {
      return Response.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }
    const file = form.get("image");
    if (!(file instanceof File) || !file.type.startsWith("image/")) {
      return Response.json({ success: false, error: "Select a valid image file." }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ success: false, error: "Image must be 5 MB or smaller." }, { status: 400 });
    }

    const database = await getTopGamesDatabase();
    const bucket = new GridFSBucket(database, { bucketName: "blog_images" });
    const upload = bucket.openUploadStream(file.name, { metadata: { contentType: file.type } });
    await new Promise<void>(async (resolve, reject) => {
      upload.on("error", reject);
      upload.on("finish", () => resolve());
      upload.end(Buffer.from(await file.arrayBuffer()));
    });
    return Response.json({ success: true, url: `/api/blog-images/${upload.id}` });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
