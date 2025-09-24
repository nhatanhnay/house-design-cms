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

    const { logConversion = false, fallbackUrl = url } = options;

    if (logConversion) {
      console.log('Converting URL:', url);
    }

    // Handle localhost URLs
    if (url.startsWith(ADMIN_CONSTANTS.URL_PATTERNS.LOCALHOST)) {
      const converted = url.replace(ADMIN_CONSTANTS.URL_PATTERNS.LOCALHOST, '/');
      if (logConversion) {
        console.log('Converted localhost URL:', converted);
      }
      return converted;
    }

    // Handle HTTPS backend URLs
    if (ADMIN_CONSTANTS.URL_PATTERNS.HTTPS_BACKEND.test(url)) {
      const converted = url.replace(ADMIN_CONSTANTS.URL_PATTERNS.HTTPS_BACKEND, '/');
      if (logConversion) {
        console.log('Converted HTTPS URL:', converted);
      }
      return converted;
    }

    // Handle HTTP backend URLs
    if (ADMIN_CONSTANTS.URL_PATTERNS.HTTP_BACKEND.test(url)) {
      const converted = url.replace(ADMIN_CONSTANTS.URL_PATTERNS.HTTP_BACKEND, '/');
      if (logConversion) {
        console.log('Converted HTTP URL:', converted);
      }
      return converted;
    }

    if (logConversion) {
      console.log('URL not converted:', url);
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

    const { logConversion = false } = options;

    if (logConversion) {
      console.log('Converting content image URLs');
    }

    // Replace img src attributes with converted URLs
    const convertedContent = htmlContent.replace(
      /(<img[^>]+src=["'])([^"']+)(["'][^>]*>)/gi,
      (match, prefix, url, suffix) => {
        const convertedUrl = this.convertImageUrl(url, { logConversion: false });
        if (logConversion) {
          console.log('Content image URL converted:', url, '->', convertedUrl);
        }
        return prefix + convertedUrl + suffix;
      }
    );

    return convertedContent;
  }
}