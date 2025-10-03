import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';

import { DataService } from '../../services/data.service';
import { Article, Category } from '../../models/models';

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatSlideToggleModule
  ],
  templateUrl: './article-list.component.html',
  styleUrls: ['./article-list.component.scss']
})
export class ArticleListComponent implements OnInit {
  articles: Article[] = [];
  categories: Category[] = [];
  isLoading = true;

  // Filters
  selectedCategory: number | undefined;
  searchTag = '';
  showPublishedOnly = true;

  // Pagination
  totalArticles = 0;
  pageSize = 6;
  currentPage = 0;

  constructor(
    private dataService: DataService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadArticles();
  }

  loadCategories(): void {
    this.dataService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
      }
    });
  }

  loadArticles(): void {
    this.isLoading = true;

    const params = {
      category: this.selectedCategory,
      published: this.showPublishedOnly,
      tag: this.searchTag || undefined,
      limit: this.pageSize,
      offset: this.currentPage * this.pageSize
    };

    this.dataService.getArticles(params).subscribe({
      next: (articles) => {
        this.articles = articles;
        this.isLoading = false;
      },
      error: (error) => {
        this.snackBar.open('Error loading articles', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadArticles();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadArticles();
  }

  viewArticle(article: Article): void {
    this.router.navigate(['/articles', article.slug]);
  }

  editArticle(article: Article): void {
    this.router.navigate(['/admin/articles/edit', article.id]);
  }

  createArticle(): void {
    this.router.navigate(['/admin/articles/create']);
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getTags(article: Article): string[] {
    return article.tags ? article.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
  }

  truncateContent(content: string, maxLength: number = 150): string {
    if (!content) return '';
    // Strip HTML tags for preview
    const textContent = content.replace(/<[^>]*>/g, '');
    return textContent.length > maxLength
      ? textContent.substring(0, maxLength) + '...'
      : textContent;
  }
}
