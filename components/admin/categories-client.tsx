"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { generateSlug } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminTableSurface,
} from "@/components/admin/admin-page";
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
import {
  CalendarDays,
  FolderOpen,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { Category } from "@/lib/types";

type CategoryType = "post" | "moment";
type TypeFilter = "all" | CategoryType;
type SortKey = "name" | "newest" | "oldest";

const numberFormatter = new Intl.NumberFormat("zh-CN");

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getCategoryType(category: Category): CategoryType {
  return category.type || "post";
}

function typeLabel(type: CategoryType) {
  return type === "moment" ? "见闻" : "文章";
}

function filterLabel(typeFilter: TypeFilter) {
  if (typeFilter === "post") return "文章分类";
  if (typeFilter === "moment") return "见闻分类";
  return "全部类型";
}

function sortCategories(categories: Category[], sortKey: SortKey) {
  return [...categories].sort((a, b) => {
    if (sortKey === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortKey === "oldest") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return a.name.localeCompare(b.name, "zh-CN");
  });
}

export function AdminCategoriesClient({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; type: CategoryType }>({
    name: "",
    type: "post",
  });
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const post = categories.filter(
      (category) => getCategoryType(category) === "post"
    ).length;
    const moment = categories.length - post;
    return {
      total: categories.length,
      post,
      moment,
    };
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = categories.filter((category) => {
      const matchesType =
        typeFilter === "all" || getCategoryType(category) === typeFilter;
      const searchText = [category.name, category.slug, typeLabel(getCategoryType(category))]
        .join(" ")
        .toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 || searchText.includes(normalizedQuery);

      return matchesType && matchesQuery;
    });

    return sortCategories(filtered, sortKey);
  }, [categories, query, sortKey, typeFilter]);

  const hasFilters =
    query.trim().length > 0 || typeFilter !== "all" || sortKey !== "name";

  const fetchCategories = async () => {
    setRefreshing(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      toast.error("加载失败: " + error.message);
      setRefreshing(false);
      return;
    }

    setCategories(data || []);
    setRefreshing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("请填写名称");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      if (editId) {
        const { error } = await supabase
          .from("categories")
          .update({ name: form.name.trim(), type: form.type })
          .eq("id", editId);
        if (error) throw error;
        toast.success("分类已更新");
      } else {
        const { error } = await supabase.from("categories").insert({
          name: form.name.trim(),
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
    setForm({ name: category.name, type: getCategoryType(category) });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个分类吗？")) return;

    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      toast.error("删除失败: " + error.message);
      setDeletingId(null);
      return;
    }

    toast.success("分类已删除");
    await fetchCategories();
    setDeletingId(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && !saving) {
      setEditId(null);
      setForm({ name: "", type: "post" });
    }
  };

  const resetFilters = () => {
    setQuery("");
    setTypeFilter("all");
    setSortKey("name");
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Taxonomy"
        title="分类管理"
        description="维护文章和见闻的一级分类。"
        action={
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" suppressHydrationWarning />
                新建分类
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? "编辑分类" : "新建分类"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category-name">名称</Label>
                  <Input
                    id="category-name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="分类名称"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category-type">类型</Label>
                  <Select
                    value={form.type}
                    onValueChange={(val) =>
                      setForm((prev) => ({
                        ...prev,
                        type: val as CategoryType,
                      }))
                    }
                    disabled={saving}
                  >
                    <SelectTrigger id="category-type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="post">文章分类</SelectItem>
                      <SelectItem value="moment">见闻分类</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    文章分类用于长文归档，见闻分类用于短内容归档。
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "保存中..." : editId ? "更新分类" : "创建分类"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {categories.length > 0 ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatItem label="全部分类" value={numberFormatter.format(stats.total)} />
            <StatItem label="文章分类" value={numberFormatter.format(stats.post)} />
            <StatItem
              label="见闻分类"
              value={numberFormatter.format(stats.moment)}
            />
          </div>

          <section className="rounded-lg border bg-card">
            <div className="flex flex-col gap-3 border-b p-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative min-w-0 flex-1 lg:max-w-sm">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  suppressHydrationWarning
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索分类名称或 slug"
                  className="pl-9"
                  aria-label="搜索分类"
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:items-center">
                <Select
                  value={typeFilter}
                  onValueChange={(value) => setTypeFilter(value as TypeFilter)}
                >
                  <SelectTrigger className="w-full lg:w-[132px]" aria-label="筛选分类类型">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="post">文章分类</SelectItem>
                    <SelectItem value="moment">见闻分类</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={sortKey}
                  onValueChange={(value) => setSortKey(value as SortKey)}
                >
                  <SelectTrigger className="w-full lg:w-[132px]" aria-label="排序">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">名称 A-Z</SelectItem>
                    <SelectItem value="newest">最新优先</SelectItem>
                    <SelectItem value="oldest">最早优先</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 lg:flex-none"
                    disabled={!hasFilters}
                    onClick={resetFilters}
                  >
                    重置
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="刷新分类列表"
                    disabled={refreshing}
                    onClick={fetchCategories}
                  >
                    <RefreshCw
                      className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"}
                      suppressHydrationWarning
                    />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 px-3 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                当前显示 {numberFormatter.format(filteredCategories.length)} /{" "}
                {numberFormatter.format(categories.length)} 个
              </span>
              <span>{filterLabel(typeFilter)}</span>
            </div>
          </section>

          {refreshing && filteredCategories.length === 0 ? (
            <CategoriesLoadingState />
          ) : null}

          {filteredCategories.length > 0 ? (
            <>
              <AdminTableSurface className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名称</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category) => (
                      <TableRow key={category.id} className="hover:bg-muted/40">
                        <TableCell className="max-w-[260px] truncate font-medium">
                          {category.name}
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate text-muted-foreground">
                          {category.slug || "-"}
                        </TableCell>
                        <TableCell>
                          <CategoryTypeBadge type={getCategoryType(category)} />
                        </TableCell>
                        <TableCell>{formatDate(category.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <CategoryActions
                            category={category}
                            deleting={deletingId === category.id}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AdminTableSurface>

              <div className="grid gap-3 md:hidden">
                {filteredCategories.map((category) => (
                  <article
                    key={category.id}
                    className="rounded-lg border bg-card p-4 transition-colors hover:border-primary/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <h2 className="truncate text-sm font-medium">
                          {category.name}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2">
                          <CategoryTypeBadge type={getCategoryType(category)} />
                          <Badge
                            variant="outline"
                            className="max-w-[180px] truncate rounded-md font-normal"
                          >
                            {category.slug || "无 slug"}
                          </Badge>
                        </div>
                      </div>
                      <CategoryActions
                        category={category}
                        deleting={deletingId === category.id}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    </div>

                    <div className="mt-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays
                          className="h-3.5 w-3.5"
                          suppressHydrationWarning
                        />
                        {formatDate(category.created_at)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <AdminEmptyState
              icon={Search}
              title="没有匹配的分类"
              description="调整搜索关键词或分类类型后再试。"
              action={
                <Button type="button" variant="outline" onClick={resetFilters}>
                  清除筛选
                </Button>
              }
            />
          )}
        </>
      ) : (
        <AdminEmptyState
          icon={FolderOpen}
          title="暂无分类"
          description="创建分类后，可以在文章编辑时为内容归档。"
          action={
            <Button type="button" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" suppressHydrationWarning />
              新建分类
            </Button>
          }
        />
      )}
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function CategoryTypeBadge({ type }: { type: CategoryType }) {
  return (
    <Badge variant={type === "moment" ? "secondary" : "default"} className="rounded-md">
      {typeLabel(type)}
    </Badge>
  );
}

function CategoryActions({
  category,
  deleting,
  onEdit,
  onDelete,
}: {
  category: Category;
  deleting: boolean;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`编辑 ${category.name}`}
        disabled={deleting}
        onClick={() => onEdit(category)}
      >
        <Pencil className="h-4 w-4" suppressHydrationWarning />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`删除 ${category.name}`}
        disabled={deleting}
        onClick={() => onDelete(category.id)}
      >
        <Trash2 className="h-4 w-4 text-destructive" suppressHydrationWarning />
      </Button>
    </div>
  );
}

function CategoriesLoadingState() {
  return (
    <div className="rounded-lg border bg-card p-4" aria-live="polite">
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex animate-pulse items-center gap-3">
            <div className="h-9 flex-1 rounded-md bg-muted" />
            <div className="hidden h-9 w-24 rounded-md bg-muted sm:block" />
            <div className="h-9 w-16 rounded-md bg-muted" />
          </div>
        ))}
      </div>
      <span className="sr-only">正在刷新分类列表</span>
    </div>
  );
}
