"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { generateSlug } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Category } from "@/lib/types";

export function AdminCategoriesClient({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; type: "post" | "moment" }>({
    name: "",
    type: "post",
  });
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      toast.error("加载失败: " + error.message);
      return;
    }
    setCategories(data || []);
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
      if (editId) {
        const { error } = await supabase
          .from("categories")
          .update({ name: form.name, type: form.type })
          .eq("id", editId);
        if (error) throw error;
        toast.success("分类已更新");
      } else {
        const { error } = await supabase
          .from("categories")
          .insert({
            name: form.name,
            slug: generateSlug(),
            type: form.type,
          });
        if (error) throw error;
        toast.success("分类已创建");
      }

      setOpen(false);
      setEditId(null);
      setForm({ name: "", type: "post" });
      await fetchCategories();
    } catch (err) {
      const message = err instanceof Error ? err.message : "操作失败";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditId(category.id);
    setForm({ name: category.name, type: category.type || "post" });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个分类吗？")) return;

    const supabase = createClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      toast.error("删除失败: " + error.message);
      return;
    }

    toast.success("分类已删除");
    await fetchCategories();
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditId(null);
      setForm({ name: "", type: "post" });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">分类管理</h1>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新建分类
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "编辑分类" : "新建分类"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">名称</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="分类名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">类型</Label>
                <Select
                  value={form.type}
                  onValueChange={(val) =>
                    setForm((prev) => ({
                      ...prev,
                      type: val as "post" | "moment",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="post">文章分类</SelectItem>
                    <SelectItem value="moment">见闻分类</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "保存中..." : editId ? "更新" : "创建"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名称</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell>
                {category.type === "moment" ? (
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    见闻
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
                    文章
                  </span>
                )}
              </TableCell>
              <TableCell>
                {new Date(category.created_at).toLocaleDateString("zh-CN")}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(category)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {categories.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground py-8"
              >
                暂无分类
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
