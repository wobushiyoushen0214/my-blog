"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { generateSlug } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AdminEmptyState,
  AdminPageHeader,
} from "@/components/admin/admin-page";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";
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
  Hash,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { Tag } from "@/lib/types";

type SortKey = "name" | "newest" | "oldest";

const numberFormatter = new Intl.NumberFormat("zh-CN");
const RECENT_WINDOW_DAYS = 30;

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function isRecent(date: string) {
  const createdAt = new Date(date).getTime();
  const windowMs = RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return Number.isFinite(createdAt) && Date.now() - createdAt <= windowMs;
}

function sortTags(tags: Tag[], sortKey: SortKey) {
  return [...tags].sort((a, b) => {
    if (sortKey === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortKey === "oldest") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return a.name.localeCompare(b.name, "zh-CN");
  });
}

export function AdminTagsClient({ initialTags }: { initialTags: Tag[] }) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "" });
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const stats = useMemo(() => {
    return {
      total: tags.length,
      recent: tags.filter((tag) => isRecent(tag.created_at)).length,
    };
  }, [tags]);

  const filteredTags = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = tags.filter((tag) => {
      const searchText = [tag.name, tag.slug].join(" ").toLowerCase();
      return normalizedQuery.length === 0 || searchText.includes(normalizedQuery);
    });

    return sortTags(filtered, sortKey);
  }, [query, sortKey, tags]);

  const hasFilters = query.trim().length > 0 || sortKey !== "name";

  const fetchTags = async () => {
    setRefreshing(true);
    const supabase = createClient();
    const { data, error } = await supabase.from("tags").select("*").order("name");

    if (error) {
      toast.error("加载失败: " + error.message);
      setRefreshing(false);
      return;
    }

    setTags(data || []);
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
      const { error } = await supabase
        .from("tags")
        .insert({ name: form.name.trim(), slug: generateSlug() });

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
    setDeletingId(id);
    const supabase = createClient();
    await supabase.from("post_tags").delete().eq("tag_id", id);
    const { error } = await supabase.from("tags").delete().eq("id", id);

    if (error) {
      toast.error("删除失败: " + error.message);
      setDeletingId(null);
      return;
    }

    toast.success("标签已删除");
    await fetchTags();
    setDeletingId(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && !saving) {
      setForm({ name: "" });
    }
  };

  const resetFilters = () => {
    setQuery("");
    setSortKey("name");
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Taxonomy"
        title="标签管理"
        description="维护用于关联文章的关键词标签。"
        action={
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" suppressHydrationWarning />
                新建标签
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新建标签</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tag-name">名称</Label>
                  <Input
                    id="tag-name"
                    value={form.name}
                    onChange={(e) => setForm({ name: e.target.value })}
                    placeholder="标签名称"
                    disabled={saving}
                  />
                  <p className="text-xs text-muted-foreground">
                    标签适合表达主题关键词，文章可关联多个标签。
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "创建中..." : "创建标签"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {tags.length > 0 ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatItem label="全部标签" value={numberFormatter.format(stats.total)} />
            <StatItem
              label="近 30 天新增"
              value={numberFormatter.format(stats.recent)}
            />
          </div>

          <section className="border bg-card">
            <div className="flex flex-col gap-3 border-b p-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative min-w-0 flex-1 lg:max-w-sm">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  suppressHydrationWarning
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索标签名称或 slug"
                  className="pl-9"
                  aria-label="搜索标签"
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-[1fr_auto] lg:flex lg:items-center">
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

                <div className="flex gap-2">
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
                    aria-label="刷新标签列表"
                    disabled={refreshing}
                    onClick={fetchTags}
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
                当前显示 {numberFormatter.format(filteredTags.length)} /{" "}
                {numberFormatter.format(tags.length)} 个
              </span>
              <span>{sortKey === "name" ? "名称 A-Z" : sortKey === "newest" ? "最新优先" : "最早优先"}</span>
            </div>
          </section>

          {refreshing && filteredTags.length === 0 ? <TagsLoadingState /> : null}

          {filteredTags.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredTags.map((tag) => (
                <article
                  key={tag.id}
                  className="border bg-card p-4 transition-colors hover:bg-muted/20"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <Badge
                        variant="outline"
                        className="max-w-full rounded-md font-normal"
                      >
                        <Hash className="h-3.5 w-3.5" suppressHydrationWarning />
                        <span className="truncate">{tag.name}</span>
                      </Badge>
                      <p className="truncate text-xs text-muted-foreground">
                        {tag.slug || "无 slug"}
                      </p>
                    </div>
                    <ConfirmActionDialog
                      title="删除标签"
                      description={`确定要删除「${tag.name}」吗？关联关系会一并移除。`}
                      confirmLabel="删除"
                      loading={deletingId === tag.id}
                      disabled={deletingId === tag.id}
                      onConfirm={() => handleDelete(tag.id)}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`删除 ${tag.name}`}
                        disabled={deletingId === tag.id}
                      >
                        <Trash2
                          className="h-4 w-4 text-destructive"
                          suppressHydrationWarning
                        />
                      </Button>
                    </ConfirmActionDialog>
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays
                        className="h-3.5 w-3.5"
                        suppressHydrationWarning
                      />
                      {formatDate(tag.created_at)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <AdminEmptyState
              icon={Search}
              title="没有匹配的标签"
              description="调整搜索关键词或排序方式后再试。"
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
          icon={Hash}
          title="暂无标签"
          description="创建标签后，可以在文章编辑时关联多个关键词。"
          action={
            <Button type="button" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" suppressHydrationWarning />
              新建标签
            </Button>
          }
        />
      )}
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function TagsLoadingState() {
  return (
    <div className="border bg-card p-4" aria-live="polite">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
      <span className="sr-only">正在刷新标签列表</span>
    </div>
  );
}
