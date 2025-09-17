import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

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