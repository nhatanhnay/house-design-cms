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
import { Observable } from 'rxjs';
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

  // Homepage carousel properties
  homepageImages: string[] = [];
  currentSlideIndex: number = 0;
  private carouselInterval: any;

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {
    this.latestPosts$ = this.dataService.getPosts();
    this.mainCategories$ = this.dataService.getCategories().pipe(
      map(categories => categories.filter(category => category.level === 0))
    );
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.loadHomepageMedia();

    this.latestPosts$.subscribe({
      next: (posts) => {
        this.isLoadingPosts = false;
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
        this.homepageImages = response.images || [];
        console.log('Image URLs received:', this.homepageImages);
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

