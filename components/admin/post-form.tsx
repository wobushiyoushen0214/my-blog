"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { generateSlug } from "@/lib/utils";
import { compressImageToMaxBytes } from "@/lib/image";
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

const COVER_BUCKET = "covers";
const COVER_MAX_BYTES = 300 * 1024;
const COVER_MAX_UPLOAD_BYTES = 1024 * 1024;

export function PostForm({ postId }: PostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverLocalPreviewUrl, setCoverLocalPreviewUrl] = useState<string | null>(
    null
  );
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

  useEffect(() => {
    return () => {
      if (coverLocalPreviewUrl) URL.revokeObjectURL(coverLocalPreviewUrl);
    };
  }, [coverLocalPreviewUrl]);

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
    }));
  };

  const uploadCoverImage = async (file: File) => {
    if (file.size > COVER_MAX_UPLOAD_BYTES) {
      throw new Error("封面文件不能超过 1MB");
    }

    if (coverLocalPreviewUrl) URL.revokeObjectURL(coverLocalPreviewUrl);
    setCoverLocalPreviewUrl(URL.createObjectURL(file));

    const supabase = createClient();

    let blob: Blob;
    let contentType: string;
    let extension: string;

    if (file.size <= COVER_MAX_BYTES) {
      blob = file;
      contentType = file.type || "application/octet-stream";
      extension = (file.name.split(".").pop() || "").toLowerCase() || "bin";
    } else {
      const result = await compressImageToMaxBytes(file, {
        maxBytes: COVER_MAX_BYTES,
        maxWidth: 1920,
        maxHeight: 1920,
        preferredType: "image/webp",
      });
      blob = result.blob;
      contentType = result.contentType;
      extension = result.extension;
    }

    const random =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(16).slice(2);
    const date = new Date().toISOString().slice(0, 10);
    const objectPath = `${date}/${random}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(COVER_BUCKET)
      .upload(objectPath, blob, {
        upsert: true,
        contentType,
        cacheControl: "3600",
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from(COVER_BUCKET).getPublicUrl(objectPath);
    if (!data.publicUrl) {
      throw new Error("获取封面公开 URL 失败");
    }

    setForm((prev) => ({ ...prev, cover_image: data.publicUrl }));
    setCoverLocalPreviewUrl(null);
  };

  const handleCoverFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverUploading(true);
    try {
      await uploadCoverImage(file);
      toast.success("封面已上传");
    } catch (err) {
      const message = err instanceof Error ? err.message : "封面上传失败";
      toast.error(message);
    } finally {
      setCoverUploading(false);
      e.target.value = "";
    }
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
    if (!form.title) {
      toast.error("请填写标题");
      return;
    }
    if (coverUploading) {
      toast.error("封面上传中，请稍后再保存");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const postData = {
      title: form.title,
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
        .insert({ ...postData, slug: generateSlug() })
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
      <div className="space-y-2">
        <Label htmlFor="title">标题 *</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="文章标题"
        />
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
          <Label>封面图片</Label>
          <div className="space-y-3">
            <Input
              type="file"
              accept="image/*"
              onChange={handleCoverFileChange}
              disabled={coverUploading}
            />
            <div className="text-xs text-muted-foreground">
              限制：不超过 300KB；300KB～1MB 自动压缩到 300KB 以下
            </div>

            {(coverLocalPreviewUrl || form.cover_image) && (
              <div className="space-y-2">
                {(() => {
                  const src = coverLocalPreviewUrl || form.cover_image;
                  const unoptimized =
                    src.startsWith("blob:") || src.startsWith("data:");
                  return (
                    <div className="relative h-28 w-full overflow-hidden rounded-md border">
                      <Image
                        src={src}
                        alt="封面预览"
                        fill
                        sizes="(max-width: 768px) 100vw, 768px"
                        className="object-cover"
                        unoptimized={unoptimized}
                      />
                    </div>
                  );
                })()}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCoverLocalPreviewUrl(null);
                      setForm({ ...form, cover_image: "" });
                    }}
                    disabled={coverUploading}
                  >
                    移除封面
                  </Button>
                </div>
              </div>
            )}

            <Input
              id="cover_image"
              value={form.cover_image}
              onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
              placeholder="或手动填写封面图片 URL"
              disabled={coverUploading}
            />
          </div>
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
