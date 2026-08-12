import { HttpEventType, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { ApiCacheService } from '../services/api-cache.service';

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Mọi request ghi thành công đều xoá cache đọc.
 *
 * Làm ở tầng interceptor thay vì rải `tap()` lên từng phương thức của DataService:
 * không thể quên khi thêm endpoint mới, và màn hình quản trị luôn thấy dữ liệu mới
 * ngay sau khi lưu thay vì phải chờ hết TTL.
 */
export const cacheInvalidationInterceptor: HttpInterceptorFn = (req, next) => {
  if (READ_METHODS.has(req.method)) {
    return next(req);
  }

  const cache = inject(ApiCacheService);

  return next(req).pipe(
    tap({
      next: event => {
        // Chỉ xoá khi request thực sự hoàn tất, không xoá theo sự kiện tiến trình upload.
        if (event.type === HttpEventType.Response) {
          cache.invalidate();
        }
      }
    })
  );
};
