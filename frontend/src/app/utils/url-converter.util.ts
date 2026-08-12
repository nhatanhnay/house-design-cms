import { ADMIN_CONSTANTS } from '../constants/admin.constants';
import { UrlConversionOptions } from '../interfaces/admin.interfaces';

/**
 * Utility class for converting backend URLs to relative URLs for proxy support
 */
export class UrlConverter {

  /**
   * Convert absolute backend URLs to relative URLs for proxy support
   */
  static convertImageUrl(url: string, options: UrlConversionOptions = {}): string {
    if (!url) return url;

    const { fallbackUrl = url } = options;


    // Handle localhost URLs
    if (url.startsWith(ADMIN_CONSTANTS.URL_PATTERNS.LOCALHOST)) {
      const converted = url.replace(ADMIN_CONSTANTS.URL_PATTERNS.LOCALHOST, '/');
      return converted;
    }

    // Handle HTTPS backend URLs
    if (ADMIN_CONSTANTS.URL_PATTERNS.HTTPS_BACKEND.test(url)) {
      const converted = url.replace(ADMIN_CONSTANTS.URL_PATTERNS.HTTPS_BACKEND, '/');
      return converted;
    }

    // Handle HTTP backend URLs
    if (ADMIN_CONSTANTS.URL_PATTERNS.HTTP_BACKEND.test(url)) {
      const converted = url.replace(ADMIN_CONSTANTS.URL_PATTERNS.HTTP_BACKEND, '/');
      return converted;
    }


    return fallbackUrl;
  }

  /**
   * Convert multiple URLs in an array
   */
  static convertImageUrls(urls: string[], options: UrlConversionOptions = {}): string[] {
    return urls.map(url => this.convertImageUrl(url, options));
  }

  /**
   * Convert image URLs within HTML content
   */
  static convertContentImageUrls(htmlContent: string, options: UrlConversionOptions = {}): string {
    if (!htmlContent) return htmlContent;


    // Replace img src attributes with converted URLs
    const convertedContent = htmlContent.replace(
      /(<img[^>]+src=["'])([^"']+)(["'][^>]*>)/gi,
      (_match, prefix, url, suffix) => prefix + this.convertImageUrl(url) + suffix
    );

    return convertedContent;
  }
}
/**
 * Chuyển URL tuyệt đối của backend về đường dẫn tương đối để đi qua proxy.
 *
 * Dạng hàm rời để dùng thẳng trong `.map()` mà không phải bind `this`.
 * Trước đây mỗi component tự chép lại logic này thành một hàm riêng.
 */
export function convertImageUrl(url: string): string {
  return UrlConverter.convertImageUrl(url);
}
