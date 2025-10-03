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
  category_type: 'parent' | 'regular'; // Type of category
  parent_id?: number | null;
  parent?: Category;
  children?: Category[];
  level: number; // 0 for main categories, 1 for subcategories
  order_index?: number;
  display_order?: number;
  is_active: boolean;
  // SEO Fields
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image_url?: string;
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
  // SEO Fields
  meta_title?: string;
  meta_description?: string;
  focus_keywords?: string;
  og_image_url?: string;
  slug?: string;
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
  category_type: 'parent' | 'regular';
  parent_id?: number | null;
  order_index?: number;
  is_active?: boolean;
  // SEO Fields
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image_url?: string;
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
  // SEO Fields
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image_url?: string;
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
  features_title: string;
  features_description: string;
  features_logo_url: string;
  feature1_icon: string;
  feature1_title: string;
  feature1_description: string;
  feature2_icon: string;
  feature2_title: string;
  feature2_description: string;
  feature3_icon: string;
  feature3_title: string;
  feature3_description: string;
  feature4_icon: string;
  feature4_title: string;
  feature4_description: string;
  // SEO Fields
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image_url?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GlobalSEOSettings {
  id: number;
  site_name: string;
  default_meta_title: string;
  default_meta_description: string;
  default_og_image_url: string;
  google_analytics_id?: string;
  google_search_console_id?: string;
  facebook_app_id?: string;
  twitter_handle?: string;
  company_name: string;
  company_description: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_logo_url: string;
  business_hours: string;
  created_at?: string;
  updated_at?: string;
}
