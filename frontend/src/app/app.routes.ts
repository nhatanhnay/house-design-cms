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
    path: 'post/:id',
    loadComponent: () => import('./pages/post-detail/post-detail.component').then(c => c.PostDetailComponent)
  },
  {
    path: 'sitemap.xml',
    loadComponent: () => import('./components/sitemap/sitemap.component').then(c => c.SitemapComponent)
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./pages/admin-login/admin-login.component').then(c => c.AdminLoginComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/admin/admin.component').then(c => c.AdminComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
