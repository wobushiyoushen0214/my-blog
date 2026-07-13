import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { DeviceShell } from "@/components/device-shell";
import {
  PublicActionLink,
  PublicEmptyState,
  PublicFilterPill,
  PublicFilterRow,
  PublicFilterSummary,
  PublicPageHeader,
  PublicPageShell,
  PublicPillLink,
} from "@/components/public-page";
import { Hash } from "lucide-react";
import type { Metadata } from "next";
import type { Tag } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "所有标签",
};

type TagWithCount = Tag & { postCount: number };
type TagStatus = "all" | "used" | "unused";

const DEFAULT_STATUS: TagStatus = "all";

function normalizeQuery(query: string) {
  return query.replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim();
}

function parseStatus(value?: string): TagStatus {
  return value === "used" || value === "unused" ? value : DEFAULT_STATUS;
}

function statusLabel(status: TagStatus) {
  if (status === "used") return "已使用标签";
  if (status === "unused") return "未使用标签";
  return "全部标签";
}

function buildTagPath({
  query,
  status,
}: {
  query?: string;
  status?: TagStatus;
} = {}) {
  const params = new URLSearchParams();

  if (query) params.set("q", query);
  if (status && status !== DEFAULT_STATUS) params.set("status", status);

  const search = params.toString();
  return search ? `/tag?${search}` : "/tag";
}

function tagWeightClass(count: number, maxCount: number) {
  if (maxCount <= 0 || count <= 0) {
    return "text-base font-semibold text-muted-foreground";
  }

  const ratio = count / maxCount;
  if (ratio >= 0.7) {
    return "text-3xl font-semibold text-foreground sm:text-4xl";
  }
  if (ratio >= 0.4) {
    return "text-2xl font-semibold text-foreground sm:text-3xl";
  }
  if (ratio >= 0.15) {
    return "text-xl font-semibold text-foreground";
  }
  return "text-lg font-semibold text-muted-foreground";
}

export default async function TagsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status: statusParam } = await searchParams;
  const rawQuery = q?.trim() || "";
  const query = normalizeQuery(rawQuery);
  const status = parseStatus(statusParam);
  const supabase = await createClient();

  const [{ data: tags }, { data: publishedPosts }, { data: postTags }] =
    await Promise.all([
      supabase.from("tags").select("*").order("name"),
      supabase.from("posts").select("id").eq("published", true),
      supabase.from("post_tags").select("post_id, tag_id"),
    ]);

  const publishedPostIds = new Set(
    (publishedPosts || []).map((post) => post.id)
  );
  const publishedTagCounts = (postTags || []).reduce<Map<string, number>>(
    (counts, postTag) => {
      if (!publishedPostIds.has(postTag.post_id)) return counts;
      counts.set(postTag.tag_id, (counts.get(postTag.tag_id) || 0) + 1);
      return counts;
    },
    new Map()
  );

  const tagsWithCount = (tags || [])
    .map((tag) => ({
      ...tag,
      postCount: publishedTagCounts.get(tag.id) || 0,
    }))
    .sort((a, b) => {
      if (b.postCount !== a.postCount) return b.postCount - a.postCount;
      return a.name.localeCompare(b.name, "zh-Hans-CN");
    });

  const filteredTags = tagsWithCount.filter((tag) => {
    const statusMatched =
      status === DEFAULT_STATUS ||
      (status === "used" ? tag.postCount > 0 : tag.postCount === 0);
    if (!statusMatched) return false;
    if (!query) return true;

    return [tag.name, tag.slug]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase());
  });
  const usedTags = tagsWithCount.filter((tag) => tag.postCount > 0);
  const maxCount = Math.max(0, ...filteredTags.map((tag) => tag.postCount));
  const emptyFilteredDescription = query
    ? `没有匹配「${query}」的标签，可以换个关键词或查看全部标签。`
    : `当前没有${statusLabel(status)}，可以切换到全部标签查看。`;

  return (
    <DeviceShell>
      <div className="public-device-layout">
        <Header />
        <PublicPageShell className="py-9 md:py-12">
          <PublicPageHeader
            eyebrow="标签"
            title={status === DEFAULT_STATUS ? "所有标签" : statusLabel(status)}
            description="按关键词交叉浏览内容。字号反映相关文章数量。"
            countLabel={`${filteredTags.length} / ${tagsWithCount.length}`}
            action={
              <div className="flex flex-wrap gap-2 signal-meta">
                <span>已用 {usedTags.length}</span>
                <span>未用 {tagsWithCount.length - usedTags.length}</span>
              </div>
            }
          />

          <TagStatusSwitch query={query} activeStatus={status} />
          <ActiveTagSummary query={query} status={status} />

          {filteredTags.length > 0 ? (
            <section
              className="mt-8 min-w-0 space-y-8"
              aria-label={query ? "匹配标签" : "标签索引"}
            >
              <div className="signal-panel p-5 sm:p-6">
                <p className="signal-meta mb-4">标签云</p>
                <div className="flex flex-wrap items-end gap-x-6 gap-y-5 sm:gap-x-8 sm:gap-y-7">
                  {filteredTags.map((tag) => (
                    <TagCloudItem
                      key={tag.id}
                      tag={tag}
                      weightClass={tagWeightClass(tag.postCount, maxCount)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="signal-meta mb-4">索引</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredTags.map((tag) => (
                    <TagIndexRow key={`index-${tag.id}`} tag={tag} />
                  ))}
                </div>
              </div>
            </section>
          ) : tagsWithCount.length > 0 ? (
            <PublicEmptyState
              icon={Hash}
              title="没有匹配的标签"
              description={emptyFilteredDescription}
              action={
                <PublicActionLink href="/tag">查看全部标签</PublicActionLink>
              }
            />
          ) : (
            <PublicEmptyState
              icon={Hash}
              title="暂无标签"
              description="创建标签后，读者可以按关键词找到相关内容。"
            />
          )}
        </PublicPageShell>
        <Footer />
      </div>
    </DeviceShell>
  );
}

function TagStatusSwitch({
  query,
  activeStatus,
}: {
  query: string;
  activeStatus: TagStatus;
}) {
  const items: Array<{ value: TagStatus; label: string }> = [
    { value: "all", label: "全部" },
    { value: "used", label: "已使用" },
    { value: "unused", label: "未使用" },
  ];

  return (
    <nav aria-label="标签使用状态" className="signal-panel p-4">
      <PublicFilterRow label="状态">
        {items.map((item) => (
          <PublicPillLink
            key={item.value}
            href={buildTagPath({ query, status: item.value })}
            active={activeStatus === item.value}
            ariaCurrent={activeStatus === item.value ? "page" : undefined}
          >
            {item.label}
          </PublicPillLink>
        ))}
      </PublicFilterRow>
    </nav>
  );
}

function ActiveTagSummary({
  query,
  status,
}: {
  query: string;
  status: TagStatus;
}) {
  const hasFilters = Boolean(query || status !== DEFAULT_STATUS);
  if (!hasFilters) return null;

  return (
    <PublicFilterSummary clearHref="/tag">
      {query ? (
        <PublicFilterPill
          label={`关键词：${query}`}
          href={buildTagPath({ status })}
        />
      ) : null}
      {status !== DEFAULT_STATUS ? (
        <PublicFilterPill
          label={`状态：${statusLabel(status)}`}
          href={buildTagPath({ query })}
        />
      ) : null}
    </PublicFilterSummary>
  );
}

function TagCloudItem({
  tag,
  weightClass,
}: {
  tag: TagWithCount;
  weightClass: string;
}) {
  return (
    <Link
      href={`/tag/${tag.slug}`}
      className="group inline-flex max-w-full flex-col items-start gap-1 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <span
        className={cn(
          "leading-none text-foreground transition-colors group-hover:opacity-75",
          weightClass
        )}
      >
        {tag.name}
      </span>
      <span className="signal-meta">{tag.postCount} posts</span>
    </Link>
  );
}

function TagIndexRow({ tag }: { tag: TagWithCount }) {
  return (
    <Link
      href={`/tag/${tag.slug}`}
      className="signal-panel signal-panel-hover group flex min-w-0 items-baseline justify-between gap-4 px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <span className="min-w-0 truncate text-base font-semibold text-foreground transition-colors group-hover:opacity-75">
        {tag.name}
      </span>
      <span className="shrink-0 signal-meta">{tag.postCount}</span>
    </Link>
  );
}
