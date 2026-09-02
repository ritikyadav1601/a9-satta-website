import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS, formatBlogDate } from "@/lib/blog-data";
import { getMongoBlogPosts } from "@/lib/blog-mongodb";
import { SITE_DISPLAY_DOMAIN, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Satta King Blog — Result, Chart & Record Guides",
  description:
    "SattaTodayResult.com ब्लॉग पर Satta King Result, Chart और पुराने रिकॉर्ड से जुड़ी उपयोगी जानकारी, गाइड और टिप्स पढ़ें। डेली रिजल्ट, हिस्टोरिकल चार्ट और यूज़र एक्सपीरियंस की पूरी जानकारी।",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: `Satta King Blog — ${SITE_NAME}`,
    description:
      "Satta King Result, Chart और पुराने रिकॉर्ड से जुड़ी उपयोगी जानकारी और गाइड।",
    url: `${SITE_URL}/blog`,
  },
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const mongoPosts = await getMongoBlogPosts().catch(() => []);
  const posts = [
    ...mongoPosts.map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.metaDescription,
      date: post.date,
      tags: ["Latest", "Blog"],
      image: post.image,
    })),
    ...BLOG_POSTS.map((post) => ({ ...post, image: "" })),
  ];
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
        <header className="mb-8 md:mb-10">
          <p className="text-brand-700 font-bold text-xs md:text-sm uppercase tracking-wider mb-2">
            {SITE_DISPLAY_DOMAIN} Blog
          </p>
          <h1 className="text-2xl md:text-4xl font-black text-gray-900 mb-3">
            Satta King Result &amp; Chart Guides
          </h1>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-2xl">
            Satta King Result, Chart और पुराने रिकॉर्ड को सही तरीके से समझने के
            लिए हमारी गाइड्स और लेख पढ़ें। यहाँ आपको डेली रिजल्ट, हिस्टोरिकल चार्ट
            और बेहतर यूज़र एक्सपीरियंस से जुड़ी भरोसेमंद जानकारी मिलेगी।
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm hover:shadow-md hover:border-brand-300 transition-all"
            >
              {post.image && (
                <img
                  src={post.image}
                  alt={post.title}
                  className="mb-4 aspect-video w-full rounded-xl object-cover"
                />
              )}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {post.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] md:text-xs font-bold uppercase tracking-wide text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-brand-700 transition-colors mb-2">
                {post.title}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4">
                {post.excerpt}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatBlogDate(post.date)}</span>
                <span className="font-semibold text-brand-700 group-hover:translate-x-0.5 transition-transform">
                  Read more &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
