import { HttpClient, HttpHeaders, HttpParams, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Category, CategoryTreeItem, Consultation, CreateCategoryRequest, GlobalSEOSettings, HomeContent, Post, Product, UpdateCategoryRequest } from '../models/models';
import { AuthService } from './auth.service';
import { FooterContent } from '../pages/admin/admin.component';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl: string;

  constructor(private http: HttpClient, private authService: AuthService) {
    // Runtime detection: if the environment apiUrl points to localhost but the
    // app is accessed from a non-localhost host (e.g. public IP or domain),
    // automatically switch to that host on port 8080 so no rebuild is required.
    const envUrl = environment.apiUrl || '';
    const host = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';

    const isEnvLocalhost = envUrl.includes('localhost') || envUrl.includes('127.0.0.1');
    const isRunningLocally = host === 'localhost' || host === '127.0.0.1' || host === '';

    if (isEnvLocalhost && !isRunningLocally) {
      // Assume backend listens on the same host at port 8080
      this.apiUrl = `${window.location.protocol}//${host}:8080/api`;
    } else {
      this.apiUrl = envUrl;
    }

  }

  // Categories
  getCategories(): Observable<Category[]> {
    // Add cache-busting timestamp to prevent HTTP caching issues
    const cacheBuster = new Date().getTime();
    return this.http.get<any[]>(`${this.apiUrl}/categories?_t=${cacheBuster}`).pipe(
      map(apiCategories => {
        return apiCategories.map(apiCategory => ({
          id: apiCategory.id,
          name: apiCategory.name,
          slug: apiCategory.slug,
          description: apiCategory.description,
          thumbnail_url: apiCategory.thumbnail_url,
          category_type: apiCategory.category_type || 'product',
          parent_id: apiCategory.parent_id || null,
          parent: apiCategory.parent || null,
          level: apiCategory.level || 0,
          order_index: apiCategory.order_index || 0,
          display_order: apiCategory.display_order || 0,
          is_active: apiCategory.is_active !== undefined ? apiCategory.is_active : true,
          // SEO Fields
          meta_title: apiCategory.meta_title || '',
          meta_description: apiCategory.meta_description || '',
          meta_keywords: apiCategory.meta_keywords || '',
          og_image_url: apiCategory.og_image_url || '',
          created_at: apiCategory.created_at,
          updated_at: apiCategory.updated_at
        } as Category))
      })
    );
  }

  // Get hierarchical categories (main categories with children)
  getCategoriesHierarchy(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories/hierarchy`);
  }

  // Get only main categories (level 0)
  getMainCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories?level=0`);
  }

  // Get subcategories for a parent category
  getSubcategories(parentId: number): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories?parent_id=${parentId}`);
  }

  // Build category tree structure for UI
  buildCategoryTree(categories: Category[]): CategoryTreeItem[] {
    const categoryMap = new Map<number, CategoryTreeItem>();
    const tree: CategoryTreeItem[] = [];

    // First pass: create all category items
    categories.forEach(category => {
      const treeItem: CategoryTreeItem = {
        ...category,
        expanded: false,
        hasChildren: false,
        children: []
      };
      categoryMap.set(category.id, treeItem);
    });

    // Second pass: build hierarchy
    categories.forEach(category => {
      const treeItem = categoryMap.get(category.id)!;

      if (category.parent_id && categoryMap.has(category.parent_id)) {
        const parent = categoryMap.get(category.parent_id)!;
        parent.children = parent.children || [];
        parent.children.push(treeItem);
        parent.hasChildren = true;
      } else {
        tree.push(treeItem);
      }
    });

    // Sort children arrays by display_order as well
    tree.forEach(parent => {
      if (parent.children && parent.children.length > 0) {
        parent.children.sort((a, b) => (a.display_order || a.order_index || 0) - (b.display_order || b.order_index || 0));
      }
    });

    return tree.sort((a, b) => (a.display_order || a.order_index || 0) - (b.display_order || b.order_index || 0));
  }

  createCategory(category: CreateCategoryRequest): Observable<Category> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.post<Category>(`${this.apiUrl}/categories`, category, { headers });
  }

  updateCategory(id: number, category: UpdateCategoryRequest): Observable<Category> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.put<Category>(`${this.apiUrl}/categories/${id}`, category, { headers });
  }

  deleteCategory(id: number): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.delete(`${this.apiUrl}/categories/${id}`, { headers });
  }

  // Reorder categories
  reorderCategories(categoryOrders: Array<{id: number, order_index: number}>): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.put(`${this.apiUrl}/categories/reorder`, { categories: categoryOrders }, { headers });
  }

  // Update category display order
  updateCategoryOrder(orderUpdates: Array<{id: number, display_order: number}>): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.put(`${this.apiUrl}/categories/update-order`, { categories: orderUpdates }, { headers });
  }

  // Posts
  getPosts(categoryId?: number): Observable<Post[]> {
    const cacheBuster = new Date().getTime();
    let params = new HttpParams().set('_t', cacheBuster.toString());
    if (categoryId) {
      params = params.set('category', categoryId.toString());
    }
    return this.http.get<Post[]>(`${this.apiUrl}/posts`, { params });
  }

  getPost(id: number): Observable<Post> {
    return this.http.get<Post>(`${this.apiUrl}/posts/${id}`);
  }

  getPostBySlug(slug: string): Observable<Post> {
    return this.http.get<Post>(`${this.apiUrl}/posts/slug/${slug}`);
  }

  createPost(post: Partial<Post>): Observable<Post> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.post<Post>(`${this.apiUrl}/posts`, post, { headers });
  }

  updatePost(id: number, post: Partial<Post>): Observable<Post> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.put<Post>(`${this.apiUrl}/posts/${id}`, post, { headers });
  }

  deletePost(id: number): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.delete(`${this.apiUrl}/posts/${id}`, { headers });
  }

  incrementPostViews(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/posts/${id}/view`, {});
  }

  // Home Content
  getHomeContent(): Observable<HomeContent> {
    return this.http.get<HomeContent>(`${this.apiUrl}/home-content`);
  }

  updateHomeContent(content: Partial<HomeContent>): Observable<HomeContent> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.put<HomeContent>(`${this.apiUrl}/home-content`, content, { headers });
  }

  // Footer Content
  getFooterContent(): Observable<FooterContent> {
    return this.http.get<FooterContent>(`${this.apiUrl}/footer-content`);
  }

  updateFooterContent(content: Partial<FooterContent>): Observable<FooterContent> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.put<FooterContent>(`${this.apiUrl}/footer-content`, content, { headers });
  }

  // Homepage Media Management
  getHomepageMedia(): Observable<{images: string[], videos: string[]}> {
    return this.http.get<{images: string[], videos: string[]}>(`${this.apiUrl}/homepage/media`);
  }

  uploadHomepageImage(formData: FormData): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(`${this.apiUrl}/homepage/upload-image`, formData, { headers });
  }

  uploadHomepageVideo(formData: FormData): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(`${this.apiUrl}/homepage/upload-video`, formData, { headers });
  }

  replaceHomepageMedia(formData: FormData, type: string, filename: string): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.put(`${this.apiUrl}/homepage/${type}/${filename}`, formData, { headers });
  }

  deleteHomepageMedia(type: string, filename: string): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.delete(`${this.apiUrl}/homepage/${type}/${filename}`, { headers });
  }

  // Navbar Logo Management
  getNavbarLogo(): Observable<any> {
    return this.http.get<{logo_url: string}>(`${this.apiUrl}/navbar/logo`);
  }

  uploadNavbarLogo(formData: FormData): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(`${this.apiUrl}/navbar/upload-logo`, formData, { headers });
  }

  deleteNavbarLogo(): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.delete(`${this.apiUrl}/navbar/logo`, { headers });
  }

  // OG Image Upload for SEO Settings
  uploadOGImage(formData: FormData): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(`${this.apiUrl}/seo/upload-og-image`, formData, { headers });
  }

  // General image upload for category thumbnails and other purposes
  uploadImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('upload', file);

    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }

    // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // DO NOT set 'Content-Type': browser will set 'multipart/form-data; boundary=...' automatically
    });

    console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
    console.log('Token:', token ? 'Present' : 'Missing');

    return this.http.post<{ url: string }>(`${this.apiUrl}/upload`, formData, { headers });
  }

  // Upload with progress tracking
  uploadImageWithProgress(file: File): Observable<HttpEvent<{ url: string }>> {
    const formData = new FormData();
    formData.append('upload', file);

    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    console.log('Uploading file with progress:', file.name, 'Size:', file.size, 'Type:', file.type);

    return this.http.post<{ url: string }>(`${this.apiUrl}/upload`, formData, {
      headers,
      reportProgress: true,
      observe: 'events'
    });
  }

  // Keep the FormData version for backward compatibility
  uploadImageFormData(formData: FormData): Observable<any> {
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;
    return this.http.post(`${this.apiUrl}/upload`, formData, { headers });
  }

  // Upload FormData with progress tracking
  uploadImageFormDataWithProgress(formData: FormData): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;
    return this.http.post(`${this.apiUrl}/upload`, formData, {
      headers,
      reportProgress: true,
      observe: 'events'
    });
  }

  uploadVideo(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('upload', file);

    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<{ url: string }>(`${this.apiUrl}/upload-video`, formData, { headers });
  }

  // Upload SVG icon
  uploadSvgIcon(formData: FormData): Observable<{ url: string, svg: string, name: string }> {
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;
    return this.http.post<{ url: string, svg: string, name: string }>(`${this.apiUrl}/upload-svg-icon`, formData, { headers });
  }

  // Global SEO Settings
  getGlobalSEOSettings(): Observable<GlobalSEOSettings> {
    return this.http.get<GlobalSEOSettings>(`${this.apiUrl}/seo-settings`);
  }

  updateGlobalSEOSettings(settings: GlobalSEOSettings): Observable<GlobalSEOSettings> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.put<GlobalSEOSettings>(`${this.apiUrl}/seo-settings`, settings, { headers });
  }

  // ============================================
  // PRODUCT MANAGEMENT
  // ============================================

  // Get all products
  getProducts(): Observable<Product[]> {
    const cacheBuster = new Date().getTime();
    return this.http.get<Product[]>(`${this.apiUrl}/products?_t=${cacheBuster}`);
  }

  // Get single product by ID
  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  getProductBySlug(slug: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/slug/${slug}`);
  }

  // Create a new product
  createProduct(product: Product): Observable<Product> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<Product>(`${this.apiUrl}/products`, product, { headers });
  }

  // Update an existing product
  updateProduct(id: number, product: Product): Observable<Product> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.put<Product>(`${this.apiUrl}/products/${id}`, product, { headers });
  }

  // Delete a product
  deleteProduct(id: number): Observable<void> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete<void>(`${this.apiUrl}/products/${id}`, { headers });
  }

  // Add image to product
  addProductImage(productId: number, imageData: { image_url: string; display_order?: number; alt_text?: string; is_primary?: boolean }): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(`${this.apiUrl}/products/${productId}/images`, imageData, { headers });
  }

  // Delete product image
  deleteProductImage(productId: number, imageId: number): Observable<void> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete<void>(`${this.apiUrl}/products/${productId}/images/${imageId}`, { headers });
  }

  // Update product images order
  updateProductImageOrder(productId: number, images: { id: number; display_order: number }[]): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.put(`${this.apiUrl}/products/${productId}/images/order`, { images }, { headers });
  }

  // ============================================
  // CONSULTATIONS
  // ============================================

  // Get all consultations (admin only)
  getConsultations(): Observable<Consultation[]> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<Consultation[]>(`${this.apiUrl}/consultations`, { headers });
  }

  // Create consultation (public endpoint)
  createConsultation(consultation: Partial<Consultation>): Observable<any> {
    return this.http.post(`${this.apiUrl}/consultations`, consultation);
  }

  // Update consultation status
  updateConsultationStatus(id: number, status: string): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.put(`${this.apiUrl}/consultations/${id}/status`, { status }, { headers });
  }

  // Delete consultation
  deleteConsultation(id: number): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete(`${this.apiUrl}/consultations/${id}`, { headers });
  }

  // ============================================
  // VIEWS & VISITOR TRACKING
  // ============================================

  // Increment post view count
  incrementPostView(postId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/posts/${postId}/view`, {});
  }

  // Increment product view count
  incrementProductView(productId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/products/${productId}/view`, {});
  }

  // Track visitor
  trackVisitor(pageUrl: string, referrer: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/track-visitor`, {
      page_url: pageUrl,
      referrer: referrer
    });
  }

  // Get visitor stats (admin only)
  getVisitorStats(): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.apiUrl}/visitor-stats`, { headers });
  }

  // Get daily visitors (admin only)
  getDailyVisitors(): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.apiUrl}/daily-visitors`, { headers });
  }

  // Search content (public endpoint)
  searchContent(params: {
    query?: string;
    type?: string;
    sort?: string;
    limit?: number;
    offset?: number;
  }): Observable<any> {
    let httpParams = new HttpParams();
    
    if (params.query) {
      httpParams = httpParams.set('query', params.query);
    }
    if (params.type) {
      httpParams = httpParams.set('type', params.type);
    }
    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params.offset) {
      httpParams = httpParams.set('offset', params.offset.toString());
    }

    return this.http.get(`${this.apiUrl}/search`, { params: httpParams });
  }
}
