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
import { ADMIN_CONSTANTS } from '../../constants/admin.constants';
import { OrderUpdate, HomepageMediaResponse } from '../../interfaces/admin.interfaces';
import { HomeContent } from '../../models/models';
import { UrlConverter } from '../../utils/url-converter.util';
import { FileValidator } from '../../utils/file-validator.util';
import { LoggerService } from '../../services/logger.service';
import { IconSelectorComponent } from '../../components/icon-selector/icon-selector.component';
import { GlobalSeoSettingsComponent } from '../global-seo-settings/global-seo-settings.component';

export interface SocialMediaItem {
  name: string;
  url: string;
  icon: string;
}

export interface FooterContent {
  id?: number;
  company_name: string;
  address: string;
  phone: string;
  email: string;
  facebook_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  linkedin_url?: string;
  copyright_text: string;
  description: string;
  services: string[];
  social_media: SocialMediaItem[];
}

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
    DragDropModule,
    IconSelectorComponent,
    GlobalSeoSettingsComponent
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  categories$: Observable<Category[]>;
  posts$: Observable<Post[]>;
  currentUser$: Observable<Admin | null>;
  categoryTree$: Observable<CategoryTreeItem[]>;
  currentSection: string = ADMIN_CONSTANTS.SECTIONS.CATEGORIES;
  postColumns: string[] = [...ADMIN_CONSTANTS.POST_COLUMNS];

  // Homepage Management Properties
  homepageImages: string[] = [];
  homepageVideos: string[] = [];
  homepageContent: HomeContent = {
    id: 0,
    hero_title: '',
    hero_description: '',
    hero_stat1_number: '',
    hero_stat1_label: '',
    hero_stat2_number: '',
    hero_stat2_label: '',
    features_title: '',
    features_description: '',
    features_logo_url: '',
    feature1_icon: '',
    feature1_title: '',
    feature1_description: '',
    feature2_icon: '',
    feature2_title: '',
    feature2_description: '',
    feature3_icon: '',
    feature3_title: '',
    feature3_description: '',
    feature4_icon: '',
    feature4_title: '',
    feature4_description: ''
  };
  originalHomepageContent: HomeContent = {} as HomeContent;
  isContentModified: boolean = false;

  // Footer Management Properties
  footerContent: FooterContent = {
    company_name: '',
    address: '',
    phone: '',
    email: '',
    facebook_url: '',
    instagram_url: '',
    youtube_url: '',
    linkedin_url: '',
    copyright_text: '',
    description: '',
    services: [],
    social_media: []
  };
  originalFooterContent: FooterContent = {} as FooterContent;
  isFooterContentModified: boolean = false;

  private refreshSubject = new Subject<void>();

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private logger: LoggerService
  ) {
    this.categories$ = this.dataService.getCategories();

    // Process posts with URL conversion
    this.posts$ = this.dataService.getPosts().pipe(
      map(posts => this.processPostImageUrls(posts))
    );

    this.currentUser$ = this.authService.currentUser$;

    this.categoryTree$ = this.createCategoryTreeObservable();
  }

  ngOnInit(): void {
    this.loadHomepageContent();
    this.loadHomepageMedia();
    this.loadFooterContent();
  }

  setCurrentSection(section: string): void {
    this.currentSection = section;
    if (section === ADMIN_CONSTANTS.SECTIONS.HOMEPAGE) {
      this.loadHomepageMedia();
      this.loadHomepageContent();
    }
    if (section === ADMIN_CONSTANTS.SECTIONS.FOOTER) {
      this.loadFooterContent();
    }
  }

  // Helper Methods
  private processPostImageUrls(posts: Post[]): Post[] {
    return posts.map(post => {
      if (post.image_url) {
        post.image_url = UrlConverter.convertImageUrl(post.image_url);
      }
      return post;
    });
  }

  private createCategoryTreeObservable(): Observable<CategoryTreeItem[]> {
    return this.refreshSubject.pipe(
      startWith(undefined),
      switchMap(() =>
        this.dataService.getCategories().pipe(
          map(categories => {
            this.logger.logCategoryOperation('loaded', { count: categories.length });
            console.log('🔎 Raw categories from API:', categories);
            console.log('🔎 First category SEO fields:', {
              id: categories[0]?.id,
              meta_title: categories[0]?.meta_title,
              meta_description: categories[0]?.meta_description,
              meta_keywords: categories[0]?.meta_keywords
            });
            this.logger.debug('Category details:', categories.map(c => ({
              id: c.id,
              name: c.name,
              type: c.category_type,
              active: c.is_active
            })), 'CategoryManagement');

            const processedCategories = this.processCategoryImageUrls(categories);
            const tree = this.dataService.buildCategoryTree(processedCategories);
            this.logger.debug(`Built tree: ${tree.length} root items`, undefined, 'CategoryManagement');

            const mainCategories = tree.filter(cat => cat.level === 0 || !cat.parent_id);
            this.logger.debug(`Main categories after filter: ${mainCategories.length} items`, undefined, 'CategoryManagement');
            return mainCategories;
          }),
          catchError(error => {
            this.logger.error('Error loading categories', error, 'CategoryManagement');
            return of([]);
          })
        )
      )
    );
  }

  private processCategoryImageUrls(categories: Category[]): Category[] {
    return categories.map(category => {
      if (category.thumbnail_url) {
        category.thumbnail_url = UrlConverter.convertImageUrl(category.thumbnail_url);
      }
      return category;
    });
  }

  refreshData(): void {
    this.refreshSubject.next();
  }

  // Category Management
  openCategoryDialog(category?: Category, isSubcategory: boolean = false, parentId?: number): void {
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: ADMIN_CONSTANTS.DIALOG_WIDTH.CATEGORY,
      data: {
        category: category || undefined,
        isSubcategory,
        parentId: parentId || undefined,
        allCategories: this.dataService.getCategories()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.handleCategoryDialogResult(result);
    });
  }

  private handleCategoryDialogResult(result: any): void {
    this.logger.debug('Category dialog closed with result:', result, 'CategoryManagement');
    if (result) {
      this.logger.logCategoryOperation('dialog completed successfully');
      this.refreshData();
      this.categories$ = this.dataService.getCategories();
    } else {
      this.logger.debug('Category dialog cancelled by user', undefined, 'CategoryManagement');
    }
  }

  editCategory(category: Category): void {
    this.openCategoryDialog(category, category.level > 0);
  }

  deleteCategory(id: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      this.dataService.deleteCategory(id).subscribe({
        next: () => {
          this.refreshData();
          this.showSuccessMessage('Danh mục đã được xóa');
        },
        error: (error) => {
          this.logger.error('Error deleting category', error, 'CategoryManagement');
          this.showErrorMessage('Lỗi khi xóa danh mục');
        }
      });
    }
  }

  toggleCategory(category: CategoryTreeItem): void {
    category.expanded = !category.expanded;
  }

  getCategoryIcon(slug: string): string {
    return ADMIN_CONSTANTS.CATEGORY_ICONS[slug as keyof typeof ADMIN_CONSTANTS.CATEGORY_ICONS] || ADMIN_CONSTANTS.CATEGORY_ICONS['default'];
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
    const orderUpdates: OrderUpdate[] = tree.map((item, index) => ({
      id: item.id,
      display_order: index + 1
    }));

    this.dataService.updateCategoryOrder(orderUpdates).subscribe({
      next: () => {
        this.showSuccessMessage('Thứ tự danh mục đã được cập nhật', ADMIN_CONSTANTS.SNACKBAR_DURATION.SHORT);
      },
      error: (error) => {
        this.logger.error('Error updating category order', error, 'CategoryManagement');
        this.showErrorMessage('Lỗi khi cập nhật thứ tự');
        this.refreshData();
      }
    });
  }

  private updateSubcategoryOrder(siblings: CategoryTreeItem[]): void {
    const orderUpdates: OrderUpdate[] = siblings.map((item, index) => ({
      id: item.id,
      display_order: index + 1
    }));

    this.dataService.updateCategoryOrder(orderUpdates).subscribe({
      next: () => {
        this.showSuccessMessage('Thứ tự danh mục con đã được cập nhật', ADMIN_CONSTANTS.SNACKBAR_DURATION.SHORT);
      },
      error: (error) => {
        this.logger.error('Error updating subcategory order', error, 'CategoryManagement');
        this.showErrorMessage('Lỗi khi cập nhật thứ tự');
        this.refreshData();
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
      width: ADMIN_CONSTANTS.DIALOG_WIDTH.POST,
      data: { post: post || null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.refreshPostsList();
      }
    });
  }

  private refreshPostsList(): void {
    this.posts$ = this.dataService.getPosts().pipe(
      map(posts => this.processPostImageUrls(posts))
    );
  }

  editPost(post: Post): void {
    const processedPost = { ...post };
    if (processedPost.image_url) {
      processedPost.image_url = UrlConverter.convertImageUrl(processedPost.image_url);
    }
    this.openPostDialog(processedPost);
  }

  deletePost(id: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      this.dataService.deletePost(id).subscribe({
        next: () => {
          this.refreshPostsList();
          this.showSuccessMessage('Bài viết đã được xóa');
        },
        error: (error) => {
          this.logger.error('Error deleting post', error, 'PostManagement');
          this.showErrorMessage('Lỗi khi xóa bài viết');
        }
      });
    }
  }

  // Homepage Management Methods
  loadHomepageMedia(): void {
    this.dataService.getHomepageMedia().subscribe({
      next: (response: HomepageMediaResponse) => {
        this.homepageImages = response.images || [];
        this.homepageVideos = response.videos || [];
      },
      error: (error) => {
        this.logger.error('Error loading homepage media', error, 'MediaManagement');
        this.homepageImages = [];
        this.homepageVideos = [];
      }
    });
  }

  refreshHomepageMedia(): void {
    this.loadHomepageMedia();
    this.showSuccessMessage('Media đã được làm mới', ADMIN_CONSTANTS.SNACKBAR_DURATION.SHORT);
  }

  uploadHomepageImage(): void {
    this.createFileInput('image/*', true, (files) => {
      Array.from(files).forEach(file => {
        this.handleImageUpload(file);
      });
    });
  }

  private handleImageUpload(file: File): void {
    const validation = FileValidator.validateImage(file);
    if (!validation.isValid) {
      this.showErrorMessage(validation.error!);
      return;
    }

    const formData = new FormData();
    formData.append('upload', file);

    this.dataService.uploadHomepageImage(formData).subscribe({
      next: () => {
        this.loadHomepageMedia();
        this.showSuccessMessage('Hình ảnh đã được tải lên');
      },
      error: (error) => {
        this.logger.error('Error uploading image', error, 'MediaManagement');
        this.showErrorMessage('Lỗi khi tải lên hình ảnh');
      }
    });
  }

  uploadHomepageVideo(): void {
    this.createFileInput('video/*', true, (files) => {
      Array.from(files).forEach(file => {
        this.handleVideoUpload(file);
      });
    });
  }

  private handleVideoUpload(file: File): void {
    const validation = FileValidator.validateVideo(file);
    if (!validation.isValid) {
      this.showErrorMessage(validation.error!);
      return;
    }

    const formData = new FormData();
    formData.append('upload', file);

    this.dataService.uploadHomepageVideo(formData).subscribe({
      next: () => {
        this.loadHomepageMedia();
        this.showSuccessMessage('Video đã được tải lên');
      },
      error: (error) => {
        this.logger.error('Error uploading video', error, 'MediaManagement');
        this.showErrorMessage('Lỗi khi tải lên video');
      }
    });
  }

  replaceHomepageMedia(mediaUrl: string, type: 'images' | 'videos'): void {
    const filename = this.getFilename(mediaUrl);
    const acceptType = type === 'images' ? 'image/*' : 'video/*';

    this.createFileInput(acceptType, false, (files) => {
      const file = files[0];
      if (file) {
        this.handleMediaReplacement(file, type, filename);
      }
    });
  }

  private handleMediaReplacement(file: File, type: 'images' | 'videos', filename: string): void {
    const validation = type === 'images'
      ? FileValidator.validateImage(file)
      : FileValidator.validateVideo(file);

    if (!validation.isValid) {
      this.showErrorMessage(validation.error!);
      return;
    }

    const formData = new FormData();
    formData.append(type === 'images' ? 'image' : 'video', file);

    this.dataService.replaceHomepageMedia(formData, type, filename).subscribe({
      next: () => {
        this.loadHomepageMedia();
        const mediaType = type === 'images' ? 'Hình ảnh' : 'Video';
        this.showSuccessMessage(`${mediaType} đã được thay thế`);
      },
      error: (error) => {
        this.logger.error('Error replacing media', error, 'MediaManagement');
        const mediaType = type === 'images' ? 'hình ảnh' : 'video';
        this.showErrorMessage(`Lỗi khi thay thế ${mediaType}`);
      }
    });
  }

  deleteHomepageMedia(mediaUrl: string, type: 'images' | 'videos'): void {
    const filename = this.getFilename(mediaUrl);
    const mediaType = type === 'images' ? 'hình ảnh' : 'video';

    if (confirm(`Bạn có chắc chắn muốn xóa ${mediaType} này?`)) {
      this.dataService.deleteHomepageMedia(type, filename).subscribe({
        next: () => {
          this.loadHomepageMedia();
          const successType = type === 'images' ? 'Hình ảnh' : 'Video';
          this.showSuccessMessage(`${successType} đã được xóa`);
        },
        error: (error) => {
          this.logger.error('Error deleting media', error, 'MediaManagement');
          this.showErrorMessage(`Lỗi khi xóa ${mediaType}`);
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
        this.logger.debug('Loading homepage content', {
          features_title: content.features_title,
          feature1_title: content.feature1_title,
          feature2_title: content.feature2_title,
          feature3_title: content.feature3_title,
          feature4_title: content.feature4_title
        }, 'ContentManagement');
        this.homepageContent = { ...content };
        this.originalHomepageContent = { ...content };
        this.isContentModified = false;
      },
      error: (error) => {
        // Use default values if API fails
        this.homepageContent = {
          id: 0,
          hero_title: 'MMA Architectural Design',
          hero_description: 'Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo',
          hero_stat1_number: '37',
          hero_stat1_label: 'Tỉnh Thành Phủ Sóng',
          hero_stat2_number: '500+',
          hero_stat2_label: 'Dự Án Biệt Thự/Nhà Ở Chuyên Nghiệp',
          features_title: 'Ưu Thế MMA Architectural Design',
          features_description: '',
          features_logo_url: '',
          feature1_icon: 'architecture',
          feature1_title: 'Thiết Kế Kiến Trúc Độc Đáo',
          feature1_description: 'Chuyên gia kiến trúc sư với hơn 10 năm kinh nghiệm, tạo ra những công trình biệt thự và nhà ở đẳng cấp.',
          feature2_icon: 'engineering',
          feature2_title: 'Thi Công Chất Lượng Cao',
          feature2_description: 'Đội ngũ kỹ sư và công nhân tay nghề cao, sử dụng công nghệ hiện đại trong thi công.',
          feature3_icon: 'business',
          feature3_title: 'Dịch Vụ Toàn Diện',
          feature3_description: 'Từ thiết kế kiến trúc, nội thất đến giám sát thi công và bàn giao hoàn thiện.',
          feature4_icon: 'verified',
          feature4_title: 'Uy Tín 37 Tỉnh Thành',
          feature4_description: 'Đã hoàn thành hơn 500 dự án biệt thự và nhà ở trên toàn quốc, được khách hàng tin tưởng.'
        };
        this.originalHomepageContent = { ...this.homepageContent };
        this.isContentModified = false;
      }
    });
  }

  onContentChange(): void {
    this.isContentModified = JSON.stringify(this.homepageContent) !== JSON.stringify(this.originalHomepageContent);
  }

  onFeature1IconChange(iconValue: string): void {
    this.homepageContent.feature1_icon = iconValue;
    this.onContentChange();
  }

  onFeature2IconChange(iconValue: string): void {
    this.homepageContent.feature2_icon = iconValue;
    this.onContentChange();
  }

  onFeature3IconChange(iconValue: string): void {
    this.homepageContent.feature3_icon = iconValue;
    this.onContentChange();
  }

  onFeature4IconChange(iconValue: string): void {
    this.homepageContent.feature4_icon = iconValue;
    this.onContentChange();
  }

  saveHomepageContent(): void {
    this.logger.debug('Saving homepage content', {
      features_title: this.homepageContent.features_title,
      feature1_icon: this.homepageContent.feature1_icon,
      feature1_title: this.homepageContent.feature1_title,
      feature1_description: this.homepageContent.feature1_description,
      feature2_icon: this.homepageContent.feature2_icon,
      feature2_title: this.homepageContent.feature2_title,
      feature2_description: this.homepageContent.feature2_description,
      feature3_icon: this.homepageContent.feature3_icon,
      feature3_title: this.homepageContent.feature3_title,
      feature3_description: this.homepageContent.feature3_description,
      feature4_icon: this.homepageContent.feature4_icon,
      feature4_title: this.homepageContent.feature4_title,
      feature4_description: this.homepageContent.feature4_description
    }, 'ContentManagement');

    this.dataService.updateHomeContent(this.homepageContent).subscribe({
      next: (updatedContent) => {
        this.logger.debug('Homepage content saved successfully', {
          features_title: updatedContent.features_title,
          feature1_title: updatedContent.feature1_title,
          feature2_title: updatedContent.feature2_title,
          feature3_title: updatedContent.feature3_title,
          feature4_title: updatedContent.feature4_title
        }, 'ContentManagement');
        this.homepageContent = { ...updatedContent };
        this.originalHomepageContent = { ...updatedContent };
        this.isContentModified = false;
        this.showSuccessMessage('Nội dung trang chủ đã được lưu');
      },
      error: (error) => {
        this.logger.error('Error saving homepage content', error, 'ContentManagement');
        this.showErrorMessage('Lỗi khi lưu nội dung trang chủ');
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

  // Utility Methods
  private showSuccessMessage(message: string, duration: number = ADMIN_CONSTANTS.SNACKBAR_DURATION.MEDIUM): void {
    this.snackBar.open(message, 'Đóng', { duration });
  }

  private showErrorMessage(message: string, duration: number = ADMIN_CONSTANTS.SNACKBAR_DURATION.MEDIUM): void {
    this.snackBar.open(message, 'Đóng', { duration });
  }

  private createFileInput(
    accept: string,
    multiple: boolean,
    onFileSelect: (files: FileList) => void
  ): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;

    input.onchange = (event: any) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        onFileSelect(files);
      }
    };

    input.click();
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.logger.error('Logout error', error, 'Authentication');
        this.router.navigate(['/']);
      }
    });
  }

  // Footer Content Management Methods
  loadFooterContent(): void {
    this.dataService.getFooterContent().subscribe({
      next: (content) => {
        this.footerContent = JSON.parse(JSON.stringify(content)); // Deep copy
        // Ensure services array is always initialized
        if (!this.footerContent.services || !Array.isArray(this.footerContent.services)) {
          this.footerContent.services = ['Thiết kế kiến trúc', 'Thi công xây dựng', 'Nội thất cao cấp', 'Tư vấn phong thủy'];
        }
        // Ensure social media array is always initialized
        if (!this.footerContent.social_media || !Array.isArray(this.footerContent.social_media)) {
          this.footerContent.social_media = [
            { name: 'Facebook', url: 'https://facebook.com/company', icon: 'facebook' },
            { name: 'Instagram', url: 'https://instagram.com/company', icon: 'photo_camera' },
            { name: 'YouTube', url: 'https://youtube.com/company', icon: 'play_circle' },
            { name: 'LinkedIn', url: 'https://linkedin.com/company/company', icon: 'business' }
          ];
        }
        this.originalFooterContent = JSON.parse(JSON.stringify(this.footerContent)); // Deep copy
        this.isFooterContentModified = false;
      },
      error: (error) => {
        // Use default values if API fails
        this.footerContent = {
          company_name: 'MMA Architectural Design',
          address: '123 Đường ABC, Quận XYZ, TP.HCM',
          phone: '0123 456 789',
          email: 'contact@company.com',
          facebook_url: '',
          instagram_url: '',
          youtube_url: '',
          linkedin_url: '',
          copyright_text: '© 2024 MMA Architectural Design. All rights reserved.',
          description: 'Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo',
          services: ['Thiết kế kiến trúc', 'Thi công xây dựng', 'Nội thất cao cấp', 'Tư vấn phong thủy'],
          social_media: [
            { name: 'Facebook', url: 'https://facebook.com/company', icon: 'facebook' },
            { name: 'Instagram', url: 'https://instagram.com/company', icon: 'photo_camera' },
            { name: 'YouTube', url: 'https://youtube.com/company', icon: 'play_circle' },
            { name: 'LinkedIn', url: 'https://linkedin.com/company/company', icon: 'business' }
          ]
        };
        this.originalFooterContent = { ...this.footerContent };
        this.isFooterContentModified = false;
      }
    });
  }

  onFooterContentChange(): void {
    // Force deep comparison by creating new objects to ensure change detection works
    const currentContent = JSON.parse(JSON.stringify(this.footerContent));
    const originalContent = JSON.parse(JSON.stringify(this.originalFooterContent));
    this.isFooterContentModified = JSON.stringify(currentContent) !== JSON.stringify(originalContent);
  }

  saveFooterContent(): void {
    this.logger.debug('Saving footer content', this.footerContent, 'ContentManagement');

    this.dataService.updateFooterContent(this.footerContent).subscribe({
      next: (updatedContent) => {
        this.footerContent = JSON.parse(JSON.stringify(updatedContent)); // Deep copy
        this.originalFooterContent = JSON.parse(JSON.stringify(updatedContent)); // Deep copy
        this.isFooterContentModified = false;
        this.showSuccessMessage('Nội dung footer đã được lưu');
      },
      error: (error) => {
        this.logger.error('Error saving footer content', error, 'ContentManagement');
        this.showErrorMessage('Lỗi khi lưu nội dung footer');
      }
    });
  }

  // Service Management Methods
  addService(): void {
    // Ensure services array exists
    if (!this.footerContent.services) {
      this.footerContent.services = [];
    }

    // Create a new array to trigger change detection
    this.footerContent.services = [...this.footerContent.services, ''];

    // Force change detection
    setTimeout(() => {
      this.onFooterContentChange();
    }, 0);
  }

  removeService(index: number): void {
    if (this.footerContent.services && index >= 0 && index < this.footerContent.services.length) {
      // Create a new array to trigger change detection
      this.footerContent.services = this.footerContent.services.filter((_, i) => i !== index);

      // Force change detection
      setTimeout(() => {
        this.onFooterContentChange();
      }, 0);
    }
  }

  onServiceChange(index: number, value: string): void {
    if (this.footerContent.services && index >= 0 && index < this.footerContent.services.length) {
      this.footerContent.services[index] = value;
      setTimeout(() => {
        this.onFooterContentChange();
      }, 0);
    }
  }

  // Social Media Management Methods
  addSocialMedia(): void {
    // Ensure social media array exists
    if (!this.footerContent.social_media) {
      this.footerContent.social_media = [];
    }

    // Create a new social media item with default values
    const newSocialMedia: SocialMediaItem = {
      name: '',
      url: '',
      icon: 'public'
    };

    // Create a new array to trigger change detection
    this.footerContent.social_media = [...this.footerContent.social_media, newSocialMedia];

    // Force change detection
    setTimeout(() => {
      this.onFooterContentChange();
    }, 0);
  }

  removeSocialMedia(index: number): void {
    if (this.footerContent.social_media && index >= 0 && index < this.footerContent.social_media.length) {
      // Create a new array to trigger change detection
      this.footerContent.social_media = this.footerContent.social_media.filter((_, i) => i !== index);

      // Force change detection
      setTimeout(() => {
        this.onFooterContentChange();
      }, 0);
    }
  }

  onSocialMediaChange(index: number, field: 'name' | 'url', value: string): void {
    if (this.footerContent.social_media && index >= 0 && index < this.footerContent.social_media.length) {
      this.footerContent.social_media[index][field] = value;
      setTimeout(() => {
        this.onFooterContentChange();
      }, 0);
    }
  }

  onSocialMediaIconChange(index: number, iconName: string): void {
    if (this.footerContent.social_media && index >= 0 && index < this.footerContent.social_media.length) {
      this.footerContent.social_media[index].icon = iconName;
      setTimeout(() => {
        this.onFooterContentChange();
      }, 0);
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  // Get category hierarchy type for display
  getCategoryHierarchyType(category: any): string {
    if (category.category_type === 'regular') {
      return 'Danh mục thường';
    }
    // All parent categories - check if they have children or parent
    if (category.children && category.children.length > 0) {
      return 'Danh mục cha';
    }
    if (category.parent_id || category.level > 0) {
      return 'Danh mục thường';
    }
    return 'Danh mục cha';
  }

  // Get CSS class for hierarchy badge
  getCategoryHierarchyClass(category: any): string {
    if (category.category_type === 'regular') {
      return 'type-regular';
    }
    // Check hierarchy for parent categories
    if (category.children && category.children.length > 0) {
      return 'type-parent';
    }
    if (category.parent_id || category.level > 0) {
      return 'type-regular';
    }
    return 'type-parent';
  }
}