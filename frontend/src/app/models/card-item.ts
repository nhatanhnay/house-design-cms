import { Post, Product } from './models';

/**
 * Dạng chuẩn hoá của một thẻ nội dung trên lưới.
 *
 * Trước đây template phải gọi `isProduct()`, `getItemRoute()`, `getItemImageUrl()`
 * cho từng item ở mỗi chu kỳ change detection, và hai trang định nghĩa
 * `isProduct()` khác nhau nên có thể phân loại cùng một bản ghi ra hai kiểu.
 * Chuẩn hoá một lần lúc dữ liệu về, template chỉ đọc thuộc tính.
 */
export interface CardItem {
  id: number;
  title: string;
  summary: string;
  imageUrl: string;
  route: string;
  createdAt?: string;
  views: number;
  published: boolean;
  categoryId: number;
  isProduct: boolean;
}

/** Khoá duy nhất cho trackBy — id có thể trùng giữa post và product. */
export function cardItemKey(_index: number, item: CardItem): string {
  return `${item.isProduct ? 'p' : 'n'}${item.id}`;
}

export function toCardItem(source: Post | Product, isProduct: boolean): CardItem {
  const slugOrId = source.slug || source.id;

  const imageUrl = isProduct
    ? (source as Product).thumbnail_url
      || (source as Product).images?.[0]?.image_url
      || (source as Product).og_image_url
      || ''
    : (source as Post).image_url || '';

  return {
    id: source.id,
    title: source.title,
    summary: source.summary || '',
    imageUrl,
    route: `/${isProduct ? 'product' : 'post'}/${slugOrId}`,
    createdAt: source.created_at,
    views: source.views || 0,
    published: source.published,
    categoryId: source.category_id,
    isProduct
  };
}

/** Mới nhất trước. */
export function byNewest(a: CardItem, b: CardItem): number {
  return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
}
