export type PostStatus = "draft" | "published";

export type PostListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverUrl: string | null;
  status: PostStatus;
  publishedAt: string | null;
  updatedAt: string;
};

export type PostDetail = PostListItem & {
  contentMd: string;
};

