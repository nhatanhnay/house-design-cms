import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '../../environments/environment';

/**
 * Dữ liệu SEO tối thiểu mà một trang có thể cung cấp. Mọi trường đều tùy chọn —
 * thiếu trường nào thì rơi về giá trị mặc định của site.
 */
export interface SeoData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  /** Đường dẫn tương đối, ví dụ '/post/biet-thu-hien-dai'. Bỏ trống = URL hiện tại. */
  path?: string;
  type?: 'website' | 'article' | 'product';
  publishedAt?: string;
  modifiedAt?: string;
  /** true = chặn index (trang 404, trang lỗi). */
  noindex?: boolean;
}

const DEFAULT_TITLE = 'MMA Architectural Design - Thiết Kế & Thi Công Biệt Thự Hiện Đại';
const DEFAULT_DESCRIPTION =
  'Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo. ' +
  'Đội ngũ chuyên nghiệp với hơn 10 năm kinh nghiệm trên toàn quốc.';
const DEFAULT_KEYWORDS =
  'thiết kế biệt thự, kiến trúc hiện đại, xây dựng nhà ở, thi công biệt thự, kiến trúc sư chuyên nghiệp';
const DEFAULT_IMAGE = '/assets/images/og-image.jpg';

/** Google cắt description quanh mốc này; cắt sẵn cho gọn. */
const DESCRIPTION_MAX = 160;

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  /**
   * Đặt toàn bộ thẻ SEO cho trang hiện tại: title, description, canonical,
   * Open Graph và Twitter Card. Gọi lại nhiều lần được — mỗi lần ghi đè lần trước.
   */
  update(data: SeoData = {}): void {
    const title = this.buildTitle(data.title);
    const description = this.truncate(data.description || DEFAULT_DESCRIPTION, DESCRIPTION_MAX);
    const url = this.absoluteUrl(data.path);
    const image = this.absoluteUrl(data.image || DEFAULT_IMAGE);
    const type = data.type === 'product' ? 'article' : data.type || 'website';

    this.title.setTitle(title);

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'keywords', content: data.keywords || DEFAULT_KEYWORDS });
    this.meta.updateTag({
      name: 'robots',
      content: data.noindex ? 'noindex, follow' : 'index, follow'
    });

    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: type });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:site_name', content: environment.siteName });
    this.meta.updateTag({ property: 'og:locale', content: 'vi_VN' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
    this.meta.updateTag({ name: 'twitter:url', content: url });

    if (data.publishedAt) {
      this.meta.updateTag({ property: 'article:published_time', content: data.publishedAt });
    } else {
      this.meta.removeTag("property='article:published_time'");
    }

    if (data.modifiedAt) {
      this.meta.updateTag({ property: 'article:modified_time', content: data.modifiedAt });
    } else {
      this.meta.removeTag("property='article:modified_time'");
    }

    this.setCanonical(url);
  }

  /** Trả trang về đúng thẻ mặc định của site. */
  reset(): void {
    this.update();
  }

  /**
   * Gắn một khối JSON-LD. `key` dùng để thay thế khối cũ cùng loại khi
   * người dùng chuyển sang bài viết khác mà component không bị dựng lại.
   */
  setStructuredData(key: string, schema: object | null): void {
    const existing = this.document.querySelectorAll(
      `script[type="application/ld+json"][data-schema="${key}"]`
    );
    existing.forEach(node => node.remove());

    if (!schema) {
      return;
    }

    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', key);
    script.text = JSON.stringify(schema);
    this.document.head.appendChild(script);
  }

  /**
   * Breadcrumb schema — giúp Google hiển thị đường dẫn phân cấp thay vì URL trần.
   * `trail` là danh sách từ gốc tới trang hiện tại.
   */
  setBreadcrumb(trail: Array<{ name: string; path?: string }>): void {
    if (!trail.length) {
      this.setStructuredData('breadcrumb', null);
      return;
    }

    this.setStructuredData('breadcrumb', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: trail.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: this.absoluteUrl(item.path ?? '/')
      }))
    });
  }

  /** Ghép hậu tố thương hiệu, trừ khi tiêu đề đã tự chứa nó. */
  private buildTitle(raw?: string): string {
    const trimmed = (raw || '').trim();
    if (!trimmed) {
      return DEFAULT_TITLE;
    }
    if (trimmed.toLowerCase().includes(environment.siteName.toLowerCase())) {
      return trimmed;
    }
    return `${trimmed} | ${environment.siteName}`;
  }

  private truncate(text: string, max: number): string {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (clean.length <= max) {
      return clean;
    }
    // Cắt ở khoảng trắng gần nhất để không đứt giữa từ.
    const cut = clean.slice(0, max);
    const lastSpace = cut.lastIndexOf(' ');
    return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
  }

  /** Biến đường dẫn tương đối thành URL tuyệt đối trên domain thật. */
  private absoluteUrl(path?: string): string {
    const base = environment.baseUrl.replace(/\/+$/, '');

    if (!path) {
      const current = this.document.location?.pathname || '/';
      return `${base}${current}`;
    }

    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  private setCanonical(url: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }

    link.setAttribute('href', url);
  }
}
