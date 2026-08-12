import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

/**
 * Chỉ preload route nào không tự đánh dấu `data: { preload: false }`.
 *
 * `PreloadAllModules` tải trước mọi lazy route kể cả /admin — mà chunk admin kéo
 * theo CKEditor gần 1.8MB. `canActivate` không chặn preload (chỉ `canLoad` mới
 * chặn), nên guard hiện có không giúp gì. Chiến lược này cho phép opt-out theo route.
 */
@Injectable({ providedIn: 'root' })
export class SelectivePreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    return route.data?.['preload'] === false ? of(null) : load();
  }
}
