import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("slug, updated_at")
    .eq("published", true);

  const { data: categories } = await supabase
    .from("categories")
    .select("slug");

  const { data: tags } = await supabase.from("tags").select("slug");

  const postEntries: MetadataRoute.Sitemap = (posts || []).map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = (categories || []).map(
    (cat) => ({
      url: `${siteUrl}/category/${cat.slug}`,
      changeFrequency: "weekly",
      priority: 0.5,
    })
  );

  const tagEntries: MetadataRoute.Sitemap = (tags || []).map((tag) => ({
    url: `${siteUrl}/tag/${tag.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const publicEntries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/posts`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/moments`,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/archive`,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/category`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/tag`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/links`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/search`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  return [
    ...publicEntries,
    ...postEntries,
    ...categoryEntries,
    ...tagEntries,
  ];
}
