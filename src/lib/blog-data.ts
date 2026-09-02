// Shared blog types and date formatting.
// Blog content is managed through the admin panel and stored in MongoDB.

export type Block =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "myth"; text: string }
  | { type: "reality"; text: string };

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  content: Block[];
}

// All posts now come from the TOP_GAMES_MONGODB_URI `blog_posts` collection.
export const BLOG_POSTS: BlogPost[] = [];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function formatBlogDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
