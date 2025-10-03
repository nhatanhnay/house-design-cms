import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Title, Meta } from '@angular/platform-browser';

import { DataService } from '../../services/data.service';
import { StructuredDataService } from '../../services/structured-data.service';
import { Article } from '../../models/models';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './article-detail.component.html',
  styleUrls: ['./article-detail.component.scss']
})
export class ArticleDetailComponent implements OnInit {
  article: Article | null = null;
  isLoading = true;
  tags: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    private snackBar: MatSnackBar,
    private titleService: Title,
    private metaService: Meta,
    private structuredDataService: StructuredDataService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const identifier = params['identifier'];
      if (identifier) {
        this.loadArticle(identifier);
      }
    });
  }

  loadArticle(identifier: string): void {
    this.isLoading = true;
    this.dataService.getArticle(identifier).subscribe({
      next: (article) => {
        this.article = article;
        this.tags = article.tags ? article.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        this.updatePageMetadata();
        this.isLoading = false;
      },
      error: (error) => {
        this.snackBar.open('Article not found', 'Close', { duration: 3000 });
        this.router.navigate(['/articles']);
        this.isLoading = false;
      }
    });
  }

  updatePageMetadata(): void {
    if (this.article) {
      // Set page title
      const title = this.article.meta_title || this.article.title;
      this.titleService.setTitle(title);

      // Set meta description
      const description = this.article.meta_description || this.article.summary || '';
      this.metaService.updateTag({ name: 'description', content: description });

      // Set Open Graph tags
      this.metaService.updateTag({ property: 'og:title', content: title });
      this.metaService.updateTag({ property: 'og:description', content: description });
      this.metaService.updateTag({ property: 'og:type', content: 'article' });

      if (this.article.featured_image_url) {
        this.metaService.updateTag({ property: 'og:image', content: this.article.featured_image_url });
      }

      // Set article tags
      if (this.article.tags) {
        this.metaService.updateTag({ name: 'keywords', content: this.article.tags });
      }

      // Set canonical URL
      const currentUrl = window.location.href;
      this.metaService.updateTag({ rel: 'canonical', href: currentUrl });

      // Add article structured data
      this.structuredDataService.addArticleSchema(this.article);

      // Add breadcrumb structured data
      const breadcrumbs = [
        { name: 'Trang chủ', url: window.location.origin },
        { name: 'Bài viết', url: `${window.location.origin}/articles` },
        { name: this.article.title, url: currentUrl }
      ];
      this.structuredDataService.addBreadcrumbSchema(breadcrumbs);
    }
  }

  goBack(): void {
    this.router.navigate(['/articles']);
  }

  shareArticle(): void {
    if (navigator.share && this.article) {
      navigator.share({
        title: this.article.title,
        text: this.article.summary || '',
        url: window.location.href
      });
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.snackBar.open('Article URL copied to clipboard', 'Close', { duration: 3000 });
      });
    }
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
