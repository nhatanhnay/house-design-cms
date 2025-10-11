import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DataService } from './data.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class VisitorTrackingService {
  constructor(
    private router: Router,
    private dataService: DataService,
    private authService: AuthService
  ) {}

  /**
   * Initialize visitor tracking
   * Call this from app.component.ts ngOnInit
   */
  initialize(): void {
    // Track page views on route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.trackPageView(event.urlAfterRedirects);
    });

    // Track initial page view
    this.trackPageView(this.router.url);
  }

  private trackPageView(url: string): void {
    // Only track if not logged in as admin
    if (this.authService.getToken()) {
      return;
    }

    const referrer = document.referrer || '';
    const pageUrl = window.location.origin + url;

    this.dataService.trackVisitor(pageUrl, referrer).subscribe({
      next: () => console.log('Visitor tracked:', pageUrl),
      error: (error) => console.error('Error tracking visitor:', error)
    });
  }
}
