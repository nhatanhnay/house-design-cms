import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { HomeContentEditDialog } from './home-content-edit-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Post, Category, Admin, HomeContent } from '../../models/models';

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
  templateUrl: './home-elementor.component.html',
  styleUrls: ['./home-elementor.component.scss']
})
export class HomeComponent implements OnInit {
  latestPosts$: Observable<Post[]>;
  categories$: Observable<Category[]>;
  currentUser$: Observable<Admin | null>;
  homeContent: HomeContent | null = null;
  isLoadingPosts = true;
  isLoadingCategories = true;

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {
    this.latestPosts$ = this.dataService.getPosts();
    this.categories$ = this.dataService.getCategories();
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
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

    this.categories$.subscribe({
      next: (categories) => {
        this.isLoadingCategories = false;
        console.log('Categories loaded:', categories.length);
      },
      error: (error) => {
        this.isLoadingCategories = false;
        console.error('Error loading categories:', error);
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

  onImageError(event: any): void {
    const target = event.target;
    target.style.display = 'none';

    const placeholder = target.parentElement.querySelector('.post-image-placeholder');
    if (!placeholder) {
      const placeholderDiv = document.createElement('div');
      placeholderDiv.className = 'post-image-placeholder';
      target.parentElement.appendChild(placeholderDiv);
    }
  }

  getCategoryIcon(slug: string): string {
    const iconMap: { [key: string]: string } = {
      'mau-thiet-ke': 'home',
      'tin-tuc': 'newspaper',
      'san-pham': 'inventory',
      'bao-chi': 'article'
    };
    return iconMap[slug] || 'category';
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
        hero_stat2_label: 'Dự Án Biệt Thư/Nhà Ở Chuyên Nghiệp'
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