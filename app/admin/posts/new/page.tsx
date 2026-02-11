import { PostForm } from "@/components/admin/post-form";

export default function NewPostPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">新建文章</h1>
      <PostForm />
    </div>
  );
}
