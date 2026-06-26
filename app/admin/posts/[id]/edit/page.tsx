"use client";

import { use } from "react";
import { PostForm } from "@/components/admin/post-form";
import { AdminPageHeader } from "@/components/admin/admin-page";

export default function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Editor"
        title="编辑文章"
        description="更新内容、封面、分类标签和发布状态。"
      />
      <PostForm postId={id} />
    </div>
  );
}
