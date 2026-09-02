import { getTopGamesDatabase } from "./top-games-mongodb";
import * as cheerio from "cheerio";
import { GridFSBucket, ObjectId } from "mongodb";

export type MongoBlogPost = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  content: string;
  image: string;
  date: string;
  published: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type MongoBlogSummary = Pick<
  MongoBlogPost,
  "slug" | "title" | "metaDescription" | "image" | "date"
>;

const collectionName = "blog_posts";

export function cleanBlogSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function getMongoBlogPosts() {
  const database = await getTopGamesDatabase();
  return database
    .collection<MongoBlogPost>(collectionName)
    .find({ published: true }, { projection: { _id: 0 } })
    .sort({ date: -1, createdAt: -1 })
    .toArray();
}

export async function getMongoBlogSummaries(limit = 6): Promise<MongoBlogSummary[]> {
  const database = await getTopGamesDatabase();
  return database
    .collection<MongoBlogPost>(collectionName)
    .find(
      { published: true },
      { projection: { _id: 0, slug: 1, title: 1, metaDescription: 1, image: 1, date: 1 } },
    )
    .sort({ date: -1, createdAt: -1 })
    .limit(limit)
    .toArray();
}

export async function getAdminMongoBlogPosts() {
  const database = await getTopGamesDatabase();
  return database
    .collection<MongoBlogPost>(collectionName)
    .find({}, { projection: { _id: 0 } })
    .sort({ updatedAt: -1, date: -1 })
    .toArray();
}

export async function getMongoBlogPost(slug: string) {
  const database = await getTopGamesDatabase();
  return database.collection<MongoBlogPost>(collectionName).findOne(
    { slug: cleanBlogSlug(slug), published: true },
    { projection: { _id: 0 } },
  );
}

function sanitizeBlogHtml(input: string) {
  const $ = cheerio.load(input, null, false);
  $("script, style, iframe, object, embed, form, input, button, svg").remove();
  const allowed = new Set(["p", "br", "h2", "h3", "strong", "b", "em", "i", "u", "ul", "ol", "li", "blockquote", "a"]);
  $("*").each((_, element) => {
    const tag = "tagName" in element ? element.tagName?.toLowerCase() : undefined;
    if (!tag || !allowed.has(tag)) {
      $(element).replaceWith($(element).contents());
      return;
    }
    const attributes = "attribs" in element ? element.attribs : {};
    for (const attribute of Object.keys(attributes || {})) {
      if (tag !== "a" || attribute !== "href") $(element).removeAttr(attribute);
    }
    if (tag === "a") {
      const href = $(element).attr("href") || "";
      if (!/^(https?:\/\/|\/)/i.test(href)) $(element).removeAttr("href");
      else $(element).attr("rel", "noopener noreferrer");
    }
  });
  return $.html().trim();
}

export async function saveMongoBlogPost(
  input: Omit<MongoBlogPost, "date" | "published" | "createdAt" | "updatedAt">,
  originalSlug?: string,
) {
  const slug = cleanBlogSlug(input.slug || input.title);
  if (!slug) throw new Error("A valid slug is required.");
  if (!input.title.trim()) throw new Error("Title is required.");
  if (!input.metaTitle.trim()) throw new Error("Meta title is required.");
  if (!input.metaDescription.trim()) throw new Error("Meta description is required.");
  const content = sanitizeBlogHtml(input.content);
  if (!content.replace(/<[^>]*>/g, "").trim()) throw new Error("Content is required.");

  const database = await getTopGamesDatabase();
  const now = new Date();
  const post: MongoBlogPost = {
    slug,
    title: input.title.trim(),
    metaTitle: input.metaTitle.trim(),
    metaDescription: input.metaDescription.trim(),
    content,
    image: input.image.trim(),
    date: now.toISOString(),
    published: true,
  };
  const previousSlug = cleanBlogSlug(originalSlug || slug);
  if (previousSlug !== slug && await database.collection(collectionName).findOne({ slug })) {
    throw new Error("Another blog already uses this slug.");
  }
  await database.collection(collectionName).updateOne(
    { slug: previousSlug },
    { $set: { ...post, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  );
  return post;
}

export async function deleteMongoBlogPost(slug: string) {
  const database = await getTopGamesDatabase();
  const cleanSlug = cleanBlogSlug(slug);
  const post = await database.collection<MongoBlogPost>(collectionName).findOne({ slug: cleanSlug });
  const result = await database.collection(collectionName).deleteOne({ slug: cleanSlug });
  if (!result.deletedCount) throw new Error("Blog post not found.");
  const imageId = post?.image.match(/^\/api\/blog-images\/([a-f0-9]{24})$/i)?.[1];
  if (imageId) {
    await new GridFSBucket(database, { bucketName: "blog_images" })
      .delete(new ObjectId(imageId))
      .catch(() => undefined);
  }
}
