import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { LoginRequest, LoginResponse, Admin } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'auth_token';
  private userKey = 'current_user';

  private currentUserSubject = new BehaviorSubject<Admin | null>(this.getCurrentUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          localStorage.setItem(this.tokenKey, response.token);
          localStorage.setItem(this.userKey, JSON.stringify(response.admin));
          this.currentUserSubject.next(response.admin);
        })
      );
  }

  /**
   * Báo cho server rồi xoá phiên cục bộ.
   *
   * Phiên luôn được xoá kể cả khi API lỗi — nếu không, người dùng bấm "Đăng xuất"
   * mà token vẫn còn trong localStorage và giao diện vẫn coi như đang đăng nhập.
   */
  logout(): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}).pipe(
      catchError(() => of(null)),
      finalize(() => this.clearSession())
    );
  }

  /** Xoá token và thông tin người dùng khỏi localStorage. Đồng bộ, không thể thất bại. */
  clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): Admin | null {
    const user = localStorage.getItem(this.userKey);
    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user) as Admin;
    } catch {
      // Dữ liệu hỏng thì bỏ đi thay vì để JSON.parse ném lỗi lúc khởi động app.
      localStorage.removeItem(this.userKey);
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
