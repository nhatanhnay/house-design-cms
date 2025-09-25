import { Observable } from 'rxjs';
import { Category } from '../models/models';

export interface HomepageContent {
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
}

export interface CategoryDialogData {
  category?: Category;
  isSubcategory?: boolean;
  parentId?: number;
  allCategories?: Observable<Category[]>;
}

export interface PostDialogData {
  post?: any; // Use proper Post interface from models
}

export interface MediaUploadResponse {
  url: string;
  filename?: string;
}

export interface OrderUpdate {
  id: number;
  display_order: number;
}

export interface HomepageMediaResponse {
  images: string[];
  videos: string[];
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface UrlConversionOptions {
  logConversion?: boolean;
  fallbackUrl?: string;
}