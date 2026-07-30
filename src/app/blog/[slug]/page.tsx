import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BLOG_POSTS,
  getPostBySlug,
  formatBlogDate,
  type Block,
} from "@/lib/blog-data";
import { SITE_DISPLAY_DOMAIN, SITE_NAME, SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return { title: "Blog Not Found" };
  }

  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url,
      publishedTime: post.date,
    },
  };
}

// Phrases that should link out to the main site, longest first so a longer
// phrase is matched before a shorter one it might contain.
const LINK_PHRASES = ["Satta King Result", SITE_DISPLAY_DOMAIN];
const LINK_REGEX = new RegExp(
  `(${LINK_PHRASES.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
  "gi"
);

// Turn the matched phrases inside a plain string into anchor links.
function linkify(text: string) {
  return text.split(LINK_REGEX).map((part, i) => {
    if (LINK_PHRASES.some((p) => p.toLowerCase() === part.toLowerCase())) {
      return (
        <a
          key={i}
          href={SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-600 font-semibold hover:text-amber-700 hover:underline"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

function renderBlock(block: Block, index: number) {
  switch (block.type) {
    case "h2":
      return (
        <h2
          key={index}
          className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-3 scroll-mt-20"
        >
          {linkify(block.text)}
        </h2>
      );
    case "p":
      return (
        <p
          key={index}
          className="text-sm md:text-base text-gray-700 leading-relaxed mb-4"
        >
          {linkify(block.text)}
        </p>
      );
    case "ul":
      return (
        <ul key={index} className="space-y-2 mb-5">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm md:text-base text-gray-700">
              <span className="text-amber-500 font-bold mt-0.5 shrink-0">&#10003;</span>
              <span>{linkify(item)}</span>
            </li>
          ))}
        </ul>
      );
    case "myth":
      return (
        <div
          key={index}
          className="rounded-xl border border-red-200 bg-red-50 p-4 mb-3"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-red-600 mb-1">
            Myth
          </p>
          <p className="text-sm md:text-base text-red-800">{linkify(block.text)}</p>
        </div>
      );
    case "reality":
      return (
        <div
          key={index}
          className="rounded-xl border border-green-200 bg-green-50 p-4 mb-5"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-green-700 mb-1">
            Reality
          </p>
          <p className="text-sm md:text-base text-green-800">{linkify(block.text)}</p>
        </div>
      );
    default:
      return null;
  }
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
  };

  return (
    <div className="bg-white min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="text-xs md:text-sm text-gray-500 mb-5">
          <Link href="/" className="hover:text-amber-600">
            Home
          </Link>
          <span className="mx-1.5">/</span>
          <Link href="/blog" className="hover:text-amber-600">
            Blog
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-gray-700">{post.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-6 md:mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] md:text-xs font-bold uppercase tracking-wide text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight mb-3">
            {post.title}
          </h1>
          <div className="flex items-center gap-3 text-xs md:text-sm text-gray-500">
            <span>{formatBlogDate(post.date)}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span>{post.readTime}</span>
          </div>
        </header>

        {/* Body */}
        <div className="border-t border-gray-100 pt-6">
          {post.content.map((block, i) => renderBlock(block, i))}
        </div>

        {/* Footer CTA */}
        <div className="mt-10 rounded-2xl bg-neutral-950 border-2 border-yellow-400 p-6 text-center">
          <p className="text-white font-bold text-lg mb-1">
            Live A7 Satta Result देखें
          </p>
          <p className="text-gray-400 text-sm mb-4">
            Gali, Desawar, Ghaziabad, Faridabad &amp; 100+ games के लाइव रिजल्ट और चार्ट।
          </p>
          <Link
            href="/"
            className="inline-block bg-yellow-200 hover:bg-yellow-300 text-black font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors"
          >
            आज का रिजल्ट देखें &rarr;
          </Link>
        </div>

        <div className="mt-8">
          <Link
            href="/blog"
            className="text-sm font-semibold text-amber-600 hover:text-amber-700"
          >
            &larr; सभी ब्लॉग देखें
          </Link>
        </div>
      </article>
    </div>
  );
}
