import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Observable, of, Subject } from 'rxjs';
import { map, catchError, switchMap, startWith } from 'rxjs/operators';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Category, Post, Admin, CategoryTreeItem } from '../../models/models';
import { CategoryDialogComponent } from '../../components/category-dialog/category-dialog.component';
import { PostDialogComponent } from '../../components/post-dialog/post-dialog.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSidenavModule,
    MatListModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    DragDropModule
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  categories$: Observable<Category[]>;
  posts$: Observable<Post[]>;
  currentUser$: Observable<Admin | null>;
  categoryTree$: Observable<CategoryTreeItem[]>;
  currentSection: string = 'categories';
  postColumns: string[] = ['id', 'title', 'category', 'published', 'views', 'created_at', 'actions'];

  // Homepage Management Properties
  homepageImages: string[] = [];
  homepageVideos: string[] = [];
  homepageContent: any = {
    hero_title: '',
    hero_description: '',
    hero_stat1_number: '',
    hero_stat1_label: '',
    hero_stat2_number: '',
    hero_stat2_label: ''
  };
  originalHomepageContent: any = {};
  isContentModified: boolean = false;

  private refreshSubject = new Subject<void>();

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.categories$ = this.dataService.getCategories();

    // Process posts with URL conversion
    this.posts$ = this.dataService.getPosts().pipe(
      map(posts => {
        return posts.map(post => {
          if (post.image_url) {
            post.image_url = this.convertImageUrl(post.image_url);
          }
          return post;
        });
      })
    );

    this.currentUser$ = this.authService.currentUser$;

    // Create observable for category tree with refresh capability
    this.categoryTree$ = this.refreshSubject.pipe(
      startWith(undefined), // Initial emit
      switchMap(() =>
        this.dataService.getCategories().pipe(
          map(categories => {
            console.log('🔄 Refreshing categories - All loaded:', categories.length, 'categories');
            console.log('📊 Category details:', categories.map(c => ({id: c.id, name: c.name, type: c.category_type, active: c.is_active})));

            // Convert image URLs for all categories
            const processedCategories = categories.map(category => {
              if (category.thumbnail_url) {
                category.thumbnail_url = this.convertImageUrl(category.thumbnail_url);
              }
              return category;
            });

            const tree = this.dataService.buildCategoryTree(processedCategories);
            console.log('🌳 Built tree:', tree.length, 'root items');
            // Filter for main categories (level 0 or no parent_id)
            const mainCategories = tree.filter(cat => cat.level === 0 || !cat.parent_id);
            console.log('🎯 Main categories after filter:', mainCategories.length, 'items');
            return mainCategories;
          }),
          catchError(error => {
            console.error('❌ Error loading categories:', error);
            return of([]);
          })
        )
      )
    );
  }

  ngOnInit(): void {
    this.loadHomepageContent();
    this.loadHomepageMedia();
  }

  setCurrentSection(section: string): void {
    this.currentSection = section;
    if (section === 'homepage') {
      this.loadHomepageMedia();
      this.loadHomepageContent();
    }
  }

  refreshData(): void {
    this.refreshSubject.next();
  }

  // Category Management
  openCategoryDialog(category?: Category, isSubcategory: boolean = false, parentId?: number): void {
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '600px',
      data: {
        category: category || undefined,
        isSubcategory,
        parentId: parentId || undefined,
        allCategories: this.dataService.getCategories()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('🔄 Dialog closed with result:', result);
      if (result) {
        console.log('✅ Refreshing category data after successful operation');
        // Force refresh data since the dialog already handles creating/updating the category
        this.refreshData();
        // Also refresh the standalone categories observable for backwards compatibility
        this.categories$ = this.dataService.getCategories();
      } else {
        console.log('❌ Dialog closed without result (cancelled)');
      }
    });
  }

  editCategory(category: Category): void {
    this.openCategoryDialog(category, category.level > 0);
  }

  deleteCategory(id: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      this.dataService.deleteCategory(id).subscribe({
        next: () => {
          this.refreshData();
          this.snackBar.open('Danh mục đã được xóa', 'Đóng', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error deleting category:', error);
          this.snackBar.open('Lỗi khi xóa danh mục', 'Đóng', { duration: 3000 });
        }
      });
    }
  }

  toggleCategory(category: CategoryTreeItem): void {
    category.expanded = !category.expanded;
  }

  getCategoryIcon(slug: string): string {
    const iconMap: { [key: string]: string } = {
      'gioi-thieu': 'info',
      'du-an-thiet-ke': 'architecture',
      'cong-trinh-thuc-te': 'business',
      'dich-vu': 'handyman',
      'tin-tuc': 'newspaper',
      'tuyen-dung': 'work',
      'lien-he': 'contact_page',
      'biet-thu-hien-dai': 'home',
      'nha-pho-hien-dai': 'apartment',
      'van-phong': 'business_center',
      'biet-thu': 'villa',
      'nha-pho': 'home_work',
      'thiet-ke': 'draw',
      'thi-cong': 'construction',
      'tu-van': 'support_agent',
      'default': 'category'
    };
    return iconMap[slug] || iconMap['default'];
  }

  // Category ordering methods
  moveCategoryUp(category: CategoryTreeItem, tree: CategoryTreeItem[], index: number): void {
    if (index > 0) {
      [tree[index], tree[index - 1]] = [tree[index - 1], tree[index]];
      this.updateCategoryOrder(tree);
    }
  }

  moveCategoryDown(category: CategoryTreeItem, tree: CategoryTreeItem[], index: number): void {
    if (index < tree.length - 1) {
      [tree[index], tree[index + 1]] = [tree[index + 1], tree[index]];
      this.updateCategoryOrder(tree);
    }
  }

  moveSubcategoryUp(subcategory: CategoryTreeItem, siblings: CategoryTreeItem[], index: number): void {
    if (index > 0) {
      [siblings[index], siblings[index - 1]] = [siblings[index - 1], siblings[index]];
      this.updateSubcategoryOrder(siblings);
    }
  }

  moveSubcategoryDown(subcategory: CategoryTreeItem, siblings: CategoryTreeItem[], index: number): void {
    if (index < siblings.length - 1) {
      [siblings[index], siblings[index + 1]] = [siblings[index + 1], siblings[index]];
      this.updateSubcategoryOrder(siblings);
    }
  }

  private updateCategoryOrder(tree: CategoryTreeItem[]): void {
    const orderUpdates = tree.map((item, index) => ({
      id: item.id,
      display_order: index + 1
    }));

    this.dataService.updateCategoryOrder(orderUpdates).subscribe({
      next: () => {
        this.snackBar.open('Thứ tự danh mục đã được cập nhật', 'Đóng', { duration: 2000 });
      },
      error: (error) => {
        console.error('Error updating category order:', error);
        this.snackBar.open('Lỗi khi cập nhật thứ tự', 'Đóng', { duration: 3000 });
        this.refreshData(); // Reload to restore original order
      }
    });
  }

  private updateSubcategoryOrder(siblings: CategoryTreeItem[]): void {
    const orderUpdates = siblings.map((item, index) => ({
      id: item.id,
      display_order: index + 1
    }));

    this.dataService.updateCategoryOrder(orderUpdates).subscribe({
      next: () => {
        this.snackBar.open('Thứ tự danh mục con đã được cập nhật', 'Đóng', { duration: 2000 });
      },
      error: (error) => {
        console.error('Error updating subcategory order:', error);
        this.snackBar.open('Lỗi khi cập nhật thứ tự', 'Đóng', { duration: 3000 });
        this.refreshData(); // Reload to restore original order
      }
    });
  }

  // Drag and drop handlers
  onCategoryDrop(event: CdkDragDrop<CategoryTreeItem[]>, tree: CategoryTreeItem[]): void {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(tree, event.previousIndex, event.currentIndex);
      this.updateCategoryOrder(tree);
    }
  }

  onSubcategoryDrop(event: CdkDragDrop<CategoryTreeItem[]>, siblings: CategoryTreeItem[]): void {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(siblings, event.previousIndex, event.currentIndex);
      this.updateSubcategoryOrder(siblings);
    }
  }

  // Post Management
  openPostDialog(post?: Post): void {
    const dialogRef = this.dialog.open(PostDialogComponent, {
      width: '800px',
      data: { post: post || null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh the posts list since the dialog handles the create/update operations
        this.posts$ = this.dataService.getPosts();
      }
    });
  }

  editPost(post: Post): void {
    this.openPostDialog(post);
  }

  deletePost(id: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      this.dataService.deletePost(id).subscribe({
        next: () => {
          this.posts$ = this.dataService.getPosts();
          this.snackBar.open('Bài viết đã được xóa', 'Đóng', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error deleting post:', error);
          this.snackBar.open('Lỗi khi xóa bài viết', 'Đóng', { duration: 3000 });
        }
      });
    }
  }

  // Homepage Management Methods
  loadHomepageMedia(): void {
    this.dataService.getHomepageMedia().subscribe({
      next: (response: any) => {
        this.homepageImages = response.images || [];
        this.homepageVideos = response.videos || [];
      },
      error: (error) => {
        console.error('Error loading homepage media:', error);
        this.homepageImages = [];
        this.homepageVideos = [];
      }
    });
  }

  refreshHomepageMedia(): void {
    this.loadHomepageMedia();
    this.snackBar.open('Media đã được làm mới', 'Đóng', { duration: 2000 });
  }

  uploadHomepageImage(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;

    input.onchange = (event: any) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        for (let file of files) {
          const formData = new FormData();
          formData.append('upload', file);

          this.dataService.uploadHomepageImage(formData).subscribe({
            next: (response) => {
              this.loadHomepageMedia(); // Refresh the media list
              this.snackBar.open('Hình ảnh đã được tải lên', 'Đóng', { duration: 3000 });
            },
            error: (error) => {
              console.error('Error uploading image:', error);
              this.snackBar.open('Lỗi khi tải lên hình ảnh', 'Đóng', { duration: 3000 });
            }
          });
        }
      }
    };

    input.click();
  }

  uploadHomepageVideo(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.multiple = true;

    input.onchange = (event: any) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        for (let file of files) {
          const formData = new FormData();
          formData.append('upload', file);

          this.dataService.uploadHomepageVideo(formData).subscribe({
            next: (response) => {
              this.loadHomepageMedia(); // Refresh the media list
              this.snackBar.open('Video đã được tải lên', 'Đóng', { duration: 3000 });
            },
            error: (error) => {
              console.error('Error uploading video:', error);
              this.snackBar.open('Lỗi khi tải lên video', 'Đóng', { duration: 3000 });
            }
          });
        }
      }
    };

    input.click();
  }

  replaceHomepageMedia(mediaUrl: string, type: 'images' | 'videos'): void {
    const filename = this.getFilename(mediaUrl);
    const acceptType = type === 'images' ? 'image/*' : 'video/*';

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = acceptType;

    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append(type === 'images' ? 'image' : 'video', file);

        this.dataService.replaceHomepageMedia(formData, type, filename).subscribe({
          next: (response) => {
            this.loadHomepageMedia(); // Refresh the media list
            this.snackBar.open(`${type === 'images' ? 'Hình ảnh' : 'Video'} đã được thay thế`, 'Đóng', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error replacing media:', error);
            this.snackBar.open(`Lỗi khi thay thế ${type === 'images' ? 'hình ảnh' : 'video'}`, 'Đóng', { duration: 3000 });
          }
        });
      }
    };

    input.click();
  }

  deleteHomepageMedia(mediaUrl: string, type: 'images' | 'videos'): void {
    const filename = this.getFilename(mediaUrl);

    if (confirm(`Bạn có chắc chắn muốn xóa ${type === 'images' ? 'hình ảnh' : 'video'} này?`)) {
      this.dataService.deleteHomepageMedia(type, filename).subscribe({
        next: (response) => {
          this.loadHomepageMedia(); // Refresh the media list
          this.snackBar.open(`${type === 'images' ? 'Hình ảnh' : 'Video'} đã được xóa`, 'Đóng', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error deleting media:', error);
          this.snackBar.open(`Lỗi khi xóa ${type === 'images' ? 'hình ảnh' : 'video'}`, 'Đóng', { duration: 3000 });
        }
      });
    }
  }

  playVideo(videoUrl: string): void {
    // Open video in a new tab or modal
    window.open(videoUrl, '_blank');
  }

  getFilename(url: string): string {
    return url.split('/').pop() || '';
  }

  // Homepage Content Management
  loadHomepageContent(): void {
    this.dataService.getHomeContent().subscribe({
      next: (content) => {
        this.homepageContent = { ...content };
        this.originalHomepageContent = { ...content };
        this.isContentModified = false;
      },
      error: (error) => {
        console.error('Error loading homepage content:', error);
        // Use default values if API fails
        this.homepageContent = {
          hero_title: 'MMA Architectural Design',
          hero_description: 'Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo',
          hero_stat1_number: '37',
          hero_stat1_label: 'Tỉnh Thành Phủ Sóng',
          hero_stat2_number: '500+',
          hero_stat2_label: 'Dự Án Biệt Thự/Nhà Ở Chuyên Nghiệp'
        };
        this.originalHomepageContent = { ...this.homepageContent };
        this.isContentModified = false;
      }
    });
  }

  onContentChange(): void {
    this.isContentModified = JSON.stringify(this.homepageContent) !== JSON.stringify(this.originalHomepageContent);
  }

  saveHomepageContent(): void {
    this.dataService.updateHomeContent(this.homepageContent).subscribe({
      next: (updatedContent) => {
        this.homepageContent = { ...updatedContent };
        this.originalHomepageContent = { ...updatedContent };
        this.isContentModified = false;
        this.snackBar.open('Nội dung trang chủ đã được lưu', 'Đóng', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error saving homepage content:', error);
        this.snackBar.open('Lỗi khi lưu nội dung trang chủ', 'Đóng', { duration: 3000 });
      }
    });
  }

  onThumbnailError(event: any): void {
    // Hide the broken image and show the fallback icon
    const target = event.target;
    target.style.display = 'none';

    // Find the parent container and show the fallback icon
    const container = target.closest('.category-thumbnail-container');
    if (container) {
      const iconElement = container.querySelector('mat-icon');
      if (iconElement) {
        iconElement.style.display = 'block';
      }
    }
  }

  // Convert absolute backend URLs to relative URLs for proxy support
  private convertImageUrl = (url: string): string => {
    if (!url) return url;

    console.log('Admin - Original URL:', url);

    // Handle localhost URLs
    if (url.startsWith('http://localhost:8080/')) {
      const converted = url.replace('http://localhost:8080/', '/');
      console.log('Admin - Converted localhost URL:', converted);
      return converted;
    }

    // Handle HTTPS backend URLs
    if (url.startsWith('https://') && url.includes(':8080/')) {
      const converted = url.replace(/https:\/\/[^\/]+:8080\//, '/');
      console.log('Admin - Converted HTTPS URL:', converted);
      return converted;
    }

    // Handle HTTP backend URLs with any domain
    if (url.startsWith('http://') && url.includes(':8080/')) {
      const converted = url.replace(/http:\/\/[^\/]+:8080\//, '/');
      console.log('Admin - Converted HTTP URL:', converted);
      return converted;
    }

    console.log('Admin - URL not converted:', url);
    return url;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        this.router.navigate(['/']);
      }
    });
  }
}