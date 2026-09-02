import { NextRequest } from "next/server";
import { verifyKhaiwalAdmin } from "@/lib/khaiwal-admin";
import { deleteMongoBlogPost, getAdminMongoBlogPosts, saveMongoBlogPost } from "@/lib/blog-mongodb";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!(await verifyKhaiwalAdmin(String(body.email || ""), String(body.password || "")))) {
      return Response.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    if (body.action === "list") {
      return Response.json({ success: true, posts: await getAdminMongoBlogPosts() });
    }
    if (body.action === "delete") {
      await deleteMongoBlogPost(String(body.slug || ""));
      return Response.json({ success: true });
    }

    const post = await saveMongoBlogPost({
      title: String(body.title || ""),
      metaTitle: String(body.metaTitle || ""),
      metaDescription: String(body.metaDescription || ""),
      content: String(body.content || ""),
      slug: String(body.slug || ""),
      image: String(body.image || ""),
    }, String(body.originalSlug || ""));
    return Response.json({ success: true, post });
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
