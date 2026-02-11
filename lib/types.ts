export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image: string | null;
  published: boolean;
  category_id: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  tags?: Tag[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface PostTag {
  post_id: string;
  tag_id: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_name: string;
  author_email: string;
  content: string;
  approved: boolean;
  created_at: string;
  post?: Post;
}
