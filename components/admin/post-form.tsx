"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TiptapEditor } from "@/components/tiptap-editor";
import { toast } from "sonner";
import { X } from "lucide-react";
import type { Category, Tag } from "@/lib/types";

interface PostFormProps {
  postId?: string;
}

export function PostForm({ postId }: PostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    cover_image: "",
    published: false,
    category_id: "",
  });

  useEffect(() => {
    const supabase = createClient();

    const fetchData = async () => {
      const [{ data: cats }, { data: tags }] = await Promise.all([
        supabase.from("categories").select("*").order("name"),
        supabase.from("tags").select("*").order("name"),
      ]);
      setCategories(cats || []);
      setAllTags(tags || []);

      if (postId) {
        const { data: post } = await supabase
          .from("posts")
          .select("*")
          .eq("id", postId)
          .single();

        if (post) {
          setForm({
            title: post.title,
            slug: post.slug,
            content: post.content,
            excerpt: post.excerpt,
            cover_image: post.cover_image || "",
            published: post.published,
            category_id: post.category_id || "",
          });

          const { data: postTags } = await supabase
            .from("post_tags")
            .select("tag_id")
            .eq("post_id", postId);
          setSelectedTagIds((postTags || []).map((pt) => pt.tag_id));
        }
      }
    };

    fetchData();
  }, [postId]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.slug) {
      toast.error("请填写标题和 Slug");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const postData = {
      title: form.title,
      slug: form.slug,
      content: form.content,
      excerpt: form.excerpt,
      cover_image: form.cover_image || null,
      published: form.published,
      category_id: form.category_id || null,
    };

    let savedPostId = postId;

    if (postId) {
      const { error } = await supabase
        .from("posts")
        .update(postData)
        .eq("id", postId);
      if (error) {
        toast.error("更新失败: " + error.message);
        setLoading(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("posts")
        .insert(postData)
        .select("id")
        .single();
      if (error) {
        toast.error("创建失败: " + error.message);
        setLoading(false);
        return;
      }
      savedPostId = data.id;
    }

    // Update tags
    if (savedPostId) {
      await supabase.from("post_tags").delete().eq("post_id", savedPostId);
      if (selectedTagIds.length > 0) {
        await supabase.from("post_tags").insert(
          selectedTagIds.map((tag_id) => ({
            post_id: savedPostId,
            tag_id,
          }))
        );
      }
    }

    setLoading(false);
    toast.success(postId ? "文章已更新" : "文章已创建");
    router.push("/admin/posts");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">标题 *</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="文章标题"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="url-friendly-slug"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>分类</Label>
          <Select
            value={form.category_id}
            onValueChange={(value) =>
              setForm({ ...form, category_id: value === "none" ? "" : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">无分类</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cover_image">封面图片 URL</Label>
          <Input
            id="cover_image"
            value={form.cover_image}
            onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
            placeholder="https://example.com/image.jpg"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>标签</Label>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <Badge
              key={tag.id}
              variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleTag(tag.id)}
            >
              {tag.name}
              {selectedTagIds.includes(tag.id) && (
                <X className="h-3 w-3 ml-1" />
              )}
            </Badge>
          ))}
          {allTags.length === 0 && (
            <span className="text-sm text-muted-foreground">
              暂无标签，请先在标签管理中创建
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">摘要</Label>
        <Textarea
          id="excerpt"
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          placeholder="文章摘要..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>内容</Label>
        <TiptapEditor
          content={form.content}
          onChange={(content) => setForm({ ...form, content })}
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={form.published}
            onCheckedChange={(checked) =>
              setForm({ ...form, published: checked })
            }
          />
          <Label>发布</Label>
        </div>
        <div className="flex-1" />
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/posts")}
        >
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "保存中..." : postId ? "更新文章" : "创建文章"}
        </Button>
      </div>
    </form>
  );
}
