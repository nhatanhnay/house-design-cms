import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(c => c.HomeComponent)
  },
  {
    path: 'category/:slug',
    loadComponent: () => import('./pages/category/category.component').then(c => c.CategoryComponent)
  },
  {
    path: 'post/:slug',
    loadComponent: () => import('./pages/post-detail/post-detail.component').then(c => c.PostDetailComponent)
  },
  {
    path: 'product/:slug',
    loadComponent: () => import('./pages/product-detail/product-detail.component').then(c => c.ProductDetailComponent)
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./pages/admin-login/admin-login.component').then(c => c.AdminLoginComponent),
    // Chặn preload: chunk admin kéo theo CKEditor (~1.8MB), khách vãng lai không cần.
    data: { preload: false }
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/admin/admin.component').then(c => c.AdminComponent),
    data: { preload: false }
  },
  {
    // Trang 404 thật thay vì redirect im lặng về trang chủ: giữ đúng ngữ cảnh cho
    // người dùng và tránh soft-404 với công cụ tìm kiếm.
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(c => c.NotFoundComponent)
  }
];
