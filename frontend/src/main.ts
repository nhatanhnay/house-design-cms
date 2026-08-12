import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideRouter,
  withViewTransitions,
  withPreloading,
  withInMemoryScrolling
} from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/interceptors/auth.interceptor';
import { cacheInvalidationInterceptor } from './app/interceptors/cache-invalidation.interceptor';
import { SelectivePreloadStrategy } from './app/utils/selective-preload.strategy';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(
      routes,
      withViewTransitions(),
      // Bỏ PreloadAllModules: nó tải trước cả route /admin kèm CKEditor 1.8MB
      // cho mọi khách vãng lai.
      withPreloading(SelectivePreloadStrategy),
      // Router tự đưa trang về đầu khi điều hướng và khôi phục vị trí khi bấm Back,
      // thay cho window.scrollTo({ behavior: 'smooth' }) thủ công trong AppComponent.
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled'
      })
    ),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor, cacheInvalidationInterceptor])),
    importProvidersFrom(MatSnackBarModule)
  ]
}).catch(err => console.error(err));
