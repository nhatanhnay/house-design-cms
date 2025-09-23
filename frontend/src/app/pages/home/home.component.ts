import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HomeContentEditDialog } from './home-content-edit-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Admin, Category, HomeContent, Post } from '../../models/models';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  latestPosts$: Observable<Post[]>;
  mainCategories$: Observable<Category[]>;
  currentUser$: Observable<Admin | null>;
  homeContent: HomeContent | null = null;
  isLoadingPosts = true;
  isLoadingCategories = true;

  // Store posts for category filtering
  allPosts: Post[] = [];

  // Homepage carousel properties
  homepageImages: string[] = [];
  currentSlideIndex: number = 0;
  private carouselInterval: any;

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {
    this.currentUser$ = this.authService.currentUser$;

    // Filter posts based on user admin status
    this.latestPosts$ = combineLatest([
      this.dataService.getPosts(),
      this.currentUser$
    ]).pipe(
      map(([posts, currentUser]) => {
        // Convert image URLs for all posts
        const processedPosts = posts.map(post => {
          if (post.image_url) {
            post.image_url = this.convertImageUrl(post.image_url);
          }
          return post;
        });

        // If user is admin, show all posts; if not, only show published posts
        return currentUser ? processedPosts : processedPosts.filter(post => post.published);
      })
    );

    this.mainCategories$ = this.dataService.getCategories().pipe(
      map(categories => {
        // Convert image URLs for all categories
        const processedCategories = categories.map(category => {
          if (category.thumbnail_url) {
            category.thumbnail_url = this.convertImageUrl(category.thumbnail_url);
          }
          return category;
        });

        const mainCategories = processedCategories.filter(category => category.level === 0);
        // Attach children to each main category
        mainCategories.forEach(mainCategory => {
          mainCategory.children = processedCategories.filter(category =>
            category.parent_id === mainCategory.id
          );
        });
        return mainCategories;
      })
    );
  }

  ngOnInit(): void {
    this.loadHomepageMedia();

    this.latestPosts$.subscribe({
      next: (posts) => {
        this.isLoadingPosts = false;
        this.allPosts = posts;
        console.log('Latest posts loaded:', posts.length);
      },
      error: (error) => {
        this.isLoadingPosts = false;
        console.error('Error loading posts:', error);
      }
    });

    this.mainCategories$.subscribe({
      next: (categories) => {
        this.isLoadingCategories = false;
        console.log('Main categories loaded:', categories.length);
      },
      error: (error) => {
        this.isLoadingCategories = false;
        console.error('Error loading main categories:', error);
      }
    });

    // Load home content
    this.dataService.getHomeContent().subscribe({
      next: (content) => {
        this.homeContent = content;
        console.log('Home content loaded:', content);
      },
      error: (error) => {
        console.error('Error loading home content:', error);
        // Use default values if API fails
        this.homeContent = null;
      }
    });
  }

  onImageError(event: any, imageUrl?: string): void {
    console.error('Image failed to load:', imageUrl);
    const target = event.target;
    target.style.display = 'none';

    const placeholder = target.parentElement.querySelector('.post-image-placeholder');
    if (!placeholder) {
      const placeholderDiv = document.createElement('div');
      placeholderDiv.className = 'post-image-placeholder';
      target.parentElement.appendChild(placeholderDiv);
    }
  }

  onImageLoad(event: any, imageUrl?: string): void {
    console.log('Image loaded successfully:', imageUrl);
  }

  // Homepage carousel methods
  loadHomepageMedia(): void {
    this.dataService.getHomepageMedia().subscribe({
      next: (response: any) => {
        // Convert absolute URLs to relative URLs for proxy support
        this.homepageImages = (response.images || []).map((url: string) => {
          return this.convertImageUrl(url);
        });
        console.log('Image URLs received:', response.images);
        console.log('Image URLs converted:', this.homepageImages);
        if (this.homepageImages.length > 0) {
          this.startCarouselAutoPlay();
        }
      },
      error: (error) => {
        console.error('Error loading homepage media:', error);
        // Set default placeholder image if API fails
        this.homepageImages = [];
      }
    });
  }

  startCarouselAutoPlay(): void {
    if (this.homepageImages.length > 1) {
      this.carouselInterval = setInterval(() => {
        this.nextSlide();
      }, 5000); // Change slide every 5 seconds
    }
  }

  stopCarouselAutoPlay(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  nextSlide(): void {
    if (this.homepageImages.length > 0) {
      this.currentSlideIndex = (this.currentSlideIndex + 1) % this.homepageImages.length;
    }
  }

  previousSlide(): void {
    if (this.homepageImages.length > 0) {
      this.currentSlideIndex = this.currentSlideIndex === 0
        ? this.homepageImages.length - 1
        : this.currentSlideIndex - 1;
    }
  }

  goToSlide(index: number): void {
    if (index >= 0 && index < this.homepageImages.length) {
      this.currentSlideIndex = index;
      // Restart autoplay after manual navigation
      this.stopCarouselAutoPlay();
      setTimeout(() => this.startCarouselAutoPlay(), 3000);
    }
  }

  ngOnDestroy(): void {
    this.stopCarouselAutoPlay();
  }

  // Get posts for a specific category
  getCategoryPosts(categoryId: number): Post[] {
    return this.allPosts
      .filter(post => post.category_id === categoryId)
      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
  }

  // Convert absolute backend URLs to relative URLs for proxy support
  private convertImageUrl = (url: string): string => {
    if (!url) return url;

    console.log('Original URL:', url);

    // Handle localhost URLs
    if (url.startsWith('http://localhost:8080/')) {
      const converted = url.replace('http://localhost:8080/', '/');
      console.log('Converted localhost URL:', converted);
      return converted;
    }

    // Handle production backend URLs - add your VPS backend URL here
    // Example: if (url.startsWith('http://your-vps-domain:8080/')) {
    //   return url.replace('http://your-vps-domain:8080/', '/');
    // }

    // Handle HTTPS backend URLs
    if (url.startsWith('https://') && url.includes(':8080/')) {
      const converted = url.replace(/https:\/\/[^\/]+:8080\//, '/');
      console.log('Converted HTTPS URL:', converted);
      return converted;
    }

    // Handle HTTP backend URLs with any domain
    if (url.startsWith('http://') && url.includes(':8080/')) {
      const converted = url.replace(/http:\/\/[^\/]+:8080\//, '/');
      console.log('Converted HTTP URL:', converted);
      return converted;
    }

    console.log('URL not converted:', url);
    return url;
  }

  openEditDialog(): void {
    const dialogRef = this.dialog.open(HomeContentEditDialog, {
      width: '600px',
      data: this.homeContent || {
        hero_title: 'MMA Architectural Design',
        hero_description: 'Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo',
        hero_stat1_number: '37',
        hero_stat1_label: 'Tỉnh Thành Phủ Sóng',
        hero_stat2_number: '500+',
        hero_stat2_label: 'Dự Án Biệt Thự/Nhà Ở Chuyên Nghiệp'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dataService.updateHomeContent(result).subscribe({
          next: (updatedContent) => {
            this.homeContent = updatedContent;
            console.log('Home content updated successfully');
          },
          error: (error) => {
            console.error('Error updating home content:', error);
          }
        });
      }
    });
  }
}

