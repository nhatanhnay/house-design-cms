import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-seo-preview',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <mat-card class="seo-preview-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>search</mat-icon>
        <mat-card-title>SEO Preview</mat-card-title>
        <mat-card-subtitle>How this will appear in search results</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <!-- Google Search Preview -->
        <div class="search-preview">
          <h4>Google Search Result</h4>
          <div class="google-result">
            <div class="result-url">{{ baseUrl }}/{{ slug || 'page-url' }}</div>
            <div class="result-title">{{ displayTitle }}</div>
            <div class="result-description">{{ displayDescription }}</div>
          </div>
        </div>

        <!-- Social Media Preview -->
        <div class="social-preview" *ngIf="ogImage || displayTitle">
          <h4>Social Media Preview</h4>
          <div class="og-card">
            <div class="og-image" *ngIf="ogImage" [style.background-image]="'url(' + ogImage + ')'"></div>
            <div class="og-content">
              <div class="og-title">{{ displayTitle }}</div>
              <div class="og-description">{{ displayDescription }}</div>
              <div class="og-url">{{ baseUrl }}</div>
            </div>
          </div>
        </div>

        <!-- SEO Score -->
        <div class="seo-score">
          <h4>SEO Score: <span [class]="scoreClass">{{ seoScore }}/100</span></h4>
          <div class="seo-tips">
            <div *ngFor="let tip of seoTips" class="tip" [class]="tip.type">
              <mat-icon>{{ tip.icon }}</mat-icon>
              {{ tip.message }}
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styleUrls: ['./seo-preview.component.scss']
})
export class SeoPreviewComponent implements OnChanges {
  @Input() title: string = '';
  @Input() metaTitle: string = '';
  @Input() description: string = '';
  @Input() metaDescription: string = '';
  @Input() slug: string = '';
  @Input() ogImage: string = '';
  @Input() baseUrl: string = 'https://yourdomain.com';

  displayTitle: string = '';
  displayDescription: string = '';
  seoScore: number = 0;
  scoreClass: string = '';
  seoTips: Array<{type: string, icon: string, message: string}> = [];

  ngOnChanges(changes: SimpleChanges): void {
    this.updatePreview();
    this.calculateSeoScore();
  }

  private updatePreview(): void {
    // Use meta title if available, otherwise use regular title
    this.displayTitle = this.metaTitle || this.title || 'Untitled Page';

    // Use meta description if available, otherwise use regular description
    this.displayDescription = this.metaDescription || this.description || 'No description available.';

    // Truncate for display (Google limits)
    if (this.displayTitle.length > 60) {
      this.displayTitle = this.displayTitle.substring(0, 57) + '...';
    }

    if (this.displayDescription.length > 160) {
      this.displayDescription = this.displayDescription.substring(0, 157) + '...';
    }
  }

  private calculateSeoScore(): void {
    let score = 0;
    this.seoTips = [];

    // Title checks (30 points)
    if (this.title) {
      score += 10;
      if (this.title.length >= 30 && this.title.length <= 60) {
        score += 20;
      } else if (this.title.length < 30) {
        this.seoTips.push({
          type: 'warning',
          icon: 'warning',
          message: 'Title is too short. Aim for 30-60 characters.'
        });
        score += 10;
      } else {
        this.seoTips.push({
          type: 'warning',
          icon: 'warning',
          message: 'Title is too long. Keep it under 60 characters.'
        });
        score += 10;
      }
    } else {
      this.seoTips.push({
        type: 'error',
        icon: 'error',
        message: 'Title is required for SEO.'
      });
    }

    // Description checks (25 points)
    if (this.metaDescription || this.description) {
      score += 10;
      const desc = this.metaDescription || this.description;
      if (desc.length >= 120 && desc.length <= 160) {
        score += 15;
      } else if (desc.length < 120) {
        this.seoTips.push({
          type: 'info',
          icon: 'info',
          message: 'Meta description could be longer. Aim for 120-160 characters.'
        });
        score += 10;
      } else {
        this.seoTips.push({
          type: 'warning',
          icon: 'warning',
          message: 'Meta description is too long. Keep it under 160 characters.'
        });
        score += 10;
      }
    } else {
      this.seoTips.push({
        type: 'error',
        icon: 'error',
        message: 'Meta description is required for SEO.'
      });
    }

    // Slug checks (20 points)
    if (this.slug) {
      score += 10;
      if (this.slug.length <= 75 && /^[a-z0-9-]+$/.test(this.slug)) {
        score += 10;
      } else {
        this.seoTips.push({
          type: 'warning',
          icon: 'warning',
          message: 'URL slug should be short and use only lowercase letters, numbers, and hyphens.'
        });
        score += 5;
      }
    } else {
      this.seoTips.push({
        type: 'warning',
        icon: 'warning',
        message: 'URL slug is recommended for better SEO.'
      });
    }

    // Image checks (15 points)
    if (this.ogImage) {
      score += 15;
    } else {
      this.seoTips.push({
        type: 'info',
        icon: 'info',
        message: 'Add an Open Graph image for better social media sharing.'
      });
    }

    // Bonus points (10 points)
    if (this.metaTitle && this.metaTitle !== this.title) {
      score += 5;
      this.seoTips.push({
        type: 'success',
        icon: 'check_circle',
        message: 'Great! You have a custom meta title.'
      });
    }

    if (this.metaDescription) {
      score += 5;
      this.seoTips.push({
        type: 'success',
        icon: 'check_circle',
        message: 'Great! You have a meta description.'
      });
    }

    this.seoScore = Math.min(score, 100);

    if (this.seoScore >= 80) {
      this.scoreClass = 'excellent';
    } else if (this.seoScore >= 60) {
      this.scoreClass = 'good';
    } else if (this.seoScore >= 40) {
      this.scoreClass = 'fair';
    } else {
      this.scoreClass = 'poor';
    }
  }
}