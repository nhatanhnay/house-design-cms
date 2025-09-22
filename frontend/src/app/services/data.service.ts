import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Category, Post, Article, CreateCategoryRequest, UpdateCategoryRequest, CategoryTreeItem, HomeContent } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // Categories
  getCategories(): Observable<Category[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categories`).pipe(
      map(apiCategories =>
        apiCategories.map(apiCategory => ({
          id: apiCategory.id,
          name: apiCategory.name,
          slug: apiCategory.slug,
          description: apiCategory.description,
          parent_id: apiCategory.parent_id || null,
          level: apiCategory.level || 0,
          order_index: apiCategory.order_index || 0,
          display_order: apiCategory.display_order || 0,
          is_active: apiCategory.is_active !== undefined ? apiCategory.is_active : true,
          created_at: apiCategory.created_at,
          updated_at: apiCategory.updated_at
        } as Category))
      )
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
  uploadImage(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/upload`, formData);
  }
}
