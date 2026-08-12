import { Injectable } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { shareReplay, take } from 'rxjs/operators';

/** Thời gian giữ lại kết quả cho dữ liệu ít thay đổi (danh mục, bài viết, footer…). */
const CACHE_TTL_MS = 60_000;

/**
 * Cache trong bộ nhớ cho các endpoint chỉ đọc.
 *
 * Tách khỏi `DataService` để `cacheInvalidationInterceptor` dùng được mà không
 * tạo vòng phụ thuộc (DataService cần HttpClient, HttpClient cần interceptor).
 */
@Injectable({ providedIn: 'root' })
export class ApiCacheService {
  private readonly entries = new Map<string, Observable<unknown>>();

  /**
   * Gọi `factory` đúng một lần rồi chia sẻ kết quả cho mọi subscriber trong TTL.
   * Navbar và trang chủ cùng cần danh mục — trước đây là hai request, nay là một.
   */
  wrap<T>(key: string, factory: () => Observable<T>): Observable<T> {
    const existing = this.entries.get(key);
    if (existing) {
      return existing as Observable<T>;
    }

    const stream = factory().pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.entries.set(key, stream);

    // Hết hạn thì bỏ khỏi map để lần subscribe sau lấy dữ liệu mới.
    timer(CACHE_TTL_MS).pipe(take(1)).subscribe(() => this.entries.delete(key));

    return stream;
  }

  /** Bỏ trống danh sách key để xoá toàn bộ cache. */
  invalidate(...keys: string[]): void {
    if (keys.length === 0) {
      this.entries.clear();
      return;
    }
    keys.forEach(key => this.entries.delete(key));
  }
}
