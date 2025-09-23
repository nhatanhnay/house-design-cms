import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Article, Category, CategoryTreeItem, CreateCategoryRequest, HomeContent, Post, UpdateCategoryRequest } from '../models/models';
import { AuthService } from './auth.service';

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
          level: apiCategory.level || 0,
          order_index: apiCategory.order_index || 0,
          display_order: apiCategory.display_order || 0,
          is_active: apiCategory.is_active !== undefined ? apiCategory.is_active : true,
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
    return this.http.post<Category>(`${this.apiUrl}/categories`, category);
  }

  updateCategory(id: number, category: UpdateCategoryRequest): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/categories/${id}`, category);
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/categories/${id}`);
  }

  // Reorder categories
  reorderCategories(categoryOrders: Array<{id: number, order_index: number}>): Observable<any> {
    return this.http.put(`${this.apiUrl}/categories/reorder`, { categories: categoryOrders });
  }

  // Update category display order
  updateCategoryOrder(orderUpdates: Array<{id: number, display_order: number}>): Observable<any> {
    return this.http.put(`${this.apiUrl}/categories/update-order`, { categories: orderUpdates });
  }

  // Posts
  getPosts(categoryId?: number): Observable<Post[]> {
    let params = new HttpParams();
    if (categoryId) {
      params = params.set('category', categoryId.toString());
    }
    return this.http.get<Post[]>(`${this.apiUrl}/posts`, { params });
  }

  getPost(id: number): Observable<Post> {
    return this.http.get<Post>(`${this.apiUrl}/posts/${id}`);
  }

  createPost(post: Partial<Post>): Observable<Post> {
    return this.http.post<Post>(`${this.apiUrl}/posts`, post);
  }

  updatePost(id: number, post: Partial<Post>): Observable<Post> {
    return this.http.put<Post>(`${this.apiUrl}/posts/${id}`, post);
  }

  deletePost(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/posts/${id}`);
  }

  incrementPostViews(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/posts/${id}/view`, {});
  }

  // Articles
  getArticles(params?: {
    category?: number;
    published?: boolean;
    tag?: string;
    limit?: number;
    offset?: number;
  }): Observable<Article[]> {
    let httpParams = new HttpParams();
    if (params?.category) {
      httpParams = httpParams.set('category', params.category.toString());
    }
    if (params?.published !== undefined) {
      httpParams = httpParams.set('published', params.published.toString());
    }
    if (params?.tag) {
      httpParams = httpParams.set('tag', params.tag);
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params?.offset) {
      httpParams = httpParams.set('offset', params.offset.toString());
    }
    return this.http.get<Article[]>(`${this.apiUrl}/articles`, { params: httpParams });
  }

  getArticle(identifier: string | number): Observable<Article> {
    return this.http.get<Article>(`${this.apiUrl}/articles/${identifier}`);
  }

  createArticle(article: Partial<Article>): Observable<Article> {
    return this.http.post<Article>(`${this.apiUrl}/articles`, article);
  }

  updateArticle(id: number, article: Partial<Article>): Observable<Article> {
    return this.http.put<Article>(`${this.apiUrl}/articles/${id}`, article);
  }

  deleteArticle(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/articles/${id}`);
  }

  // Home Content
  getHomeContent(): Observable<HomeContent> {
    return this.http.get<HomeContent>(`${this.apiUrl}/home-content`);
  }

  updateHomeContent(content: Partial<HomeContent>): Observable<HomeContent> {
    return this.http.put<HomeContent>(`${this.apiUrl}/home-content`, content);
  }

  // Homepage Media Management
  getHomepageMedia(): Observable<{images: string[], videos: string[]}> {
    return this.http.get<{images: string[], videos: string[]}>(`${this.apiUrl}/homepage/media`);
  }

  uploadHomepageImage(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/homepage/upload-image`, formData);
  }

  uploadHomepageVideo(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/homepage/upload-video`, formData);
  }

  replaceHomepageMedia(formData: FormData, type: string, filename: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/homepage/${type}/${filename}`, formData);
  }

  deleteHomepageMedia(type: string, filename: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/homepage/${type}/${filename}`);
  }

  // General image upload for category thumbnails and other purposes
  uploadImage(file: File): Observable<{ url: string }> {
    console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);

    const formData = new FormData();
    formData.append('upload', file);

    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    console.log('Upload URL:', `${this.apiUrl}/upload`);
    console.log('Token present:', !!token);

    return this.http.post<{ url: string }>(`${this.apiUrl}/upload`, formData, { headers });
  }

  // Keep the FormData version for backward compatibility
  uploadImageFormData(formData: FormData): Observable<any> {
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;
    return this.http.post(`${this.apiUrl}/upload`, formData, { headers });
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
}
