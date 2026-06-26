import { PostForm } from "@/components/admin/post-form";
import { AdminPageHeader } from "@/components/admin/admin-page";

export default function NewPostPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Editor"
        title="新建文章"
        description="撰写内容、设置分类标签并选择发布状态。"
      />
      <PostForm />
    </div>
  );
}
