"use client";

import { use } from "react";
import { PostForm } from "@/components/admin/post-form";

export default function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">编辑文章</h1>
      <PostForm postId={id} />
    </div>
  );
}
