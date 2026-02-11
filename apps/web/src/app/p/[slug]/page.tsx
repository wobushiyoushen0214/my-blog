import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPublishedPostBySlug } from "@/lib/blogApi";

export const dynamic = "force-dynamic";

export default async function PostPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="prose prose-zinc max-w-none dark:prose-invert">
      <h1>{post.title}</h1>
      <div className="not-prose mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        {post.publishedAt ? new Date(post.publishedAt).toLocaleString() : ""}
      </div>
      <div className="mt-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.contentMd}</ReactMarkdown>
      </div>
    </article>
  );
}
