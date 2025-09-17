import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, Post, Article } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // Categories
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  createCategory(category: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories`, category);
  }

  updateCategory(id: number, category: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/categories/${id}`, category);
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/categories/${id}`);
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
}
