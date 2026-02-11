"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { generateSlug } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { Tag } from "@/lib/types";

export function AdminTagsClient({ initialTags }: { initialTags: Tag[] }) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "" });
  const [saving, setSaving] = useState(false);

  const fetchTags = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from("tags").select("*").order("name");
    if (error) {
      toast.error("加载失败: " + error.message);
      return;
    }
    setTags(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error("请填写名称");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("tags")
        .insert({ name: form.name, slug: generateSlug() });

      if (error) throw error;

      toast.success("标签已创建");
      setOpen(false);
      setForm({ name: "" });
      await fetchTags();
    } catch (err) {
      const message = err instanceof Error ? err.message : "创建失败";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个标签吗？")) return;

    const supabase = createClient();
    await supabase.from("post_tags").delete().eq("tag_id", id);
    const { error } = await supabase.from("tags").delete().eq("id", id);

    if (error) {
      toast.error("删除失败: " + error.message);
      return;
    }

    toast.success("标签已删除");
    await fetchTags();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">标签管理</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新建标签
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新建标签</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">名称</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ name: e.target.value })}
                  placeholder="标签名称"
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "创建中..." : "创建"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="text-base px-4 py-2 gap-2"
            >
              {tag.name}
              <button
                onClick={() => handleDelete(tag.id)}
                className="ml-1 hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-center py-20 text-muted-foreground">暂无标签</p>
      )}
    </div>
  );
}
