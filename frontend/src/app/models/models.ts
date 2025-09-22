export interface Admin {
  id: number;
  username: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  thumbnail_url?: string;
  category_type: 'product' | 'news'; // Type of category
  parent_id?: number | null;
  parent?: Category;
  children?: Category[];
  level: number; // 0 for main categories, 1 for subcategories
  order_index?: number;
  display_order?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  summary: string;
  image_url: string;
  category_id: number;
  category?: Category;
  published: boolean;
  views: number;
  created_at?: string;
  updated_at?: string;
}

export interface Article {
  id: number;
  title: string;
  content: string;
  summary: string;
  featured_image_url: string;
  category_id: number;
  category?: Category;
  published: boolean;
  tags: string;
  meta_title: string;
  meta_description: string;
  slug: string;
  author_id: number;
  author?: Admin;
  view_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  admin: Admin;
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description: string;
  thumbnail_url?: string;
  category_type: 'product' | 'news';
  parent_id?: number | null;
  order_index?: number;
  is_active?: boolean;
}

export interface UpdateCategoryRequest {
  id: number;
  name?: string;
  slug?: string;
  description?: string;
  thumbnail_url?: string;
  category_type?: 'product' | 'news';
  parent_id?: number | null;
  order_index?: number;
  is_active?: boolean;
}

export interface CategoryTreeItem extends Category {
  expanded?: boolean;
  hasChildren?: boolean;
}

export interface HomeContent {
  id: number;
  hero_title: string;
  hero_description: string;
  hero_stat1_number: string;
  hero_stat1_label: string;
  hero_stat2_number: string;
  hero_stat2_label: string;
  created_at?: string;
  updated_at?: string;
}
