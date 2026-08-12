import { Component, DestroyRef, OnInit, inject } from '@angular/core';
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
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Observable, of, Subject } from 'rxjs';
import { map, catchError, switchMap, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Category, Post, Admin, CategoryTreeItem, Product, Consultation, ProcessTab } from '../../models/models';
import { CategoryDialogComponent } from '../../components/category-dialog/category-dialog.component';
import { PostDialogComponent } from '../../components/post-dialog/post-dialog.component';
import { ProductDialogComponent } from '../../components/product-dialog/product-dialog.component';
import { ConsultationDetailDialogComponent, ConsultationDetailDialogResult } from '../../components/consultation-detail-dialog/consultation-detail-dialog.component';
import { HomeContentEditDialog } from '../home-content-edit-dialog/home-content-edit-dialog.component';
import { ADMIN_CONSTANTS } from '../../constants/admin.constants';
import { OrderUpdate, HomepageMediaResponse } from '../../interfaces/admin.interfaces';
import { HomeContent } from '../../models/models';
import { UrlConverter } from '../../utils/url-converter.util';
import { FileValidator } from '../../utils/file-validator.util';
import { LoggerService } from '../../services/logger.service';
import { IconSelectorComponent } from '../../components/icon-selector/icon-selector.component';
import { GlobalSeoSettingsComponent } from '../global-seo-settings/global-seo-settings.component';
import { SeoPreviewComponent } from '../../components/seo-preview/seo-preview.component';
import { SkeletonImageDirective } from '../../directives/skeleton-image.directive';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../components/confirm-dialog/confirm-dialog.component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
    MatMenuModule,
    MatSelectModule,
    MatSortModule,
    MatChipsModule,
    MatExpansionModule,
    MatProgressBarModule,
    DragDropModule,
    IconSelectorComponent,
    GlobalSeoSettingsComponent,
    SeoPreviewComponent,
    SkeletonImageDirective
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly destroyRefForBreakpoints = inject(DestroyRef);

  /**
   * Sidenav trước đây hardcode `mode="side" opened`, và ở <=480px SCSS đặt
   * width:100% — vì mode="side" đẩy nội dung nên toàn bộ vùng làm việc bị đẩy
   * ra khỏi màn hình, không có cách nào đóng lại.
   */
  sidenavMode: 'side' | 'over' = 'side';
  sidenavOpened = true;
  isHandset = false;

  categories$: Observable<Category[]>;
  posts$: Observable<Post[]>;
  products$: Observable<Product[]>;
  currentUser$: Observable<Admin | null>;
  categoryTree$: Observable<CategoryTreeItem[]>;
  currentSection: string = ADMIN_CONSTANTS.SECTIONS.CATEGORIES;
  postColumns: string[] = [...ADMIN_CONSTANTS.POST_COLUMNS];
  productColumns: string[] = ['id', 'thumbnail', 'title', 'category', 'images', 'published', 'views', 'actions'];
  consultationColumns: string[] = ['id', 'name', 'phone', 'email', 'details', 'status', 'created_at', 'actions'];

  // Filter and search properties for posts
  postSearchQuery: string = '';
  postCategoryFilter: string = '';
  postSortBy: string = 'newest';
  originalPosts: Post[] = [];
  filteredPosts: Post[] = [];
  private postSearchSubject = new Subject<string>();

  // Filter and search properties for products  
  productSearchQuery: string = '';
  productCategoryFilter: string = '';
  productSortBy: string = 'newest';
  originalProducts: Product[] = [];
  filteredProducts: Product[] = [];
  private productSearchSubject = new Subject<string>();

  // Consultations Management Properties
  consultations: Consultation[] = [];
  filteredConsultations: Consultation[] = [];
  consultationFilter: string = 'all';

  // Homepage Management Properties
  homepageImages: string[] = [];
  homepageVideos: string[] = [];
  uploadProgress: number = 0;
  logoUploadProgress: number = 0;
  navbarLogoUrl: string = '';
  homepageContent: HomeContent = {
    id: 0,
    hero_title: '',
    hero_description: '',
    hero_stat1_number: '',
    hero_stat1_label: '',
    hero_stat2_number: '',
    hero_stat2_label: '',
    hero_stat3_number: '',
    hero_stat3_label: '',
    hero_stat4_number: '',
    hero_stat4_label: '',
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
    feature4_description: '',
    process_section_title: 'Quy Trình Làm Việc',
    process_tabs: '[]'
  };
  originalHomepageContent: HomeContent = {} as HomeContent;
  isContentModified: boolean = false;
  processTabs: ProcessTab[] = [];
  processTabsJson: string = '';
  uploadingStepIcon: boolean = false;

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

    // Process products with URL conversion
    this.products$ = this.dataService.getProducts().pipe(
      map(products => this.processProductImageUrls(products))
    );

    this.currentUser$ = this.authService.currentUser$;

    this.categoryTree$ = this.createCategoryTreeObservable();
  }

  ngOnInit(): void {
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(takeUntilDestroyed(this.destroyRefForBreakpoints))
      .subscribe(result => {
        this.isHandset = result.matches;
        this.sidenavMode = result.matches ? 'over' : 'side';
        this.sidenavOpened = !result.matches;
      });

    this.loadHomepageContent();
    this.loadHomepageMedia();
    this.loadFooterContent();
    this.loadNavbarLogo();
    this.loadPostsData();
    this.loadProductsData();
    this.setupSearchDebouncing();
  }

  private setupSearchDebouncing(): void {
    // Debounced search for posts
    this.postSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.filterPosts();
    });

    // Debounced search for products
    this.productSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.filterProducts();
    });
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
    if (section === ADMIN_CONSTANTS.SECTIONS.CONSULTATIONS) {
      this.loadConsultations();
    }
    if (section === ADMIN_CONSTANTS.SECTIONS.POSTS) {
      this.loadPostsData();
    }
    if (section === ADMIN_CONSTANTS.SECTIONS.PRODUCTS) {
      this.loadProductsData();
    }
  }

  // Load posts data for filtering
  private loadPostsData(): void {
    if (this.posts$) {
      this.posts$.subscribe({
        next: (posts) => {
          this.originalPosts = posts || [];
          this.filteredPosts = [...this.originalPosts];
          this.filterPosts(); // Apply any existing filters
        },
        error: (error) => {
          this.logger.error('Error loading posts', error, 'PostManagement');
          this.originalPosts = [];
          this.filteredPosts = [];
        }
      });
    }
  }

  // Load products data for filtering
  private loadProductsData(): void {
    if (this.products$) {
      this.products$.subscribe({
        next: (products) => {
          this.originalProducts = products || [];
          this.filteredProducts = [...this.originalProducts];
          this.filterProducts(); // Apply any existing filters
        },
        error: (error) => {
          this.logger.error('Error loading products', error, 'ProductManagement');
          this.originalProducts = [];
          this.filteredProducts = [];
        }
      });
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

  private processProductImageUrls(products: Product[]): Product[] {
    return products.map(product => {
      if (product.thumbnail_url) {
        product.thumbnail_url = UrlConverter.convertImageUrl(product.thumbnail_url);
      }
      if (product.images) {
        product.images = product.images.map(img => {
          img.image_url = UrlConverter.convertImageUrl(img.image_url);
          return img;
        });
      }
      return product;
    });
  }

  private createCategoryTreeObservable(): Observable<CategoryTreeItem[]> {
    return this.refreshSubject.pipe(
      startWith(undefined),
      switchMap(() =>
        this.dataService.getCategories().pipe(
          map(categories => {
            this.logger.logCategoryOperation('loaded', { count: categories.length });
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

  deleteCategory(category: Category): void {
    this.confirmDestructive({
      title: 'Xoá danh mục?',
      subject: category.name,
      message: 'Bài viết và sản phẩm thuộc danh mục này có thể không còn hiển thị. Không thể hoàn tác.'
    }, () => {
      this.dataService.deleteCategory(category.id).subscribe({
        next: () => {
          this.refreshData();
          this.showSuccessMessage(`Đã xoá danh mục "${category.name}"`);
        },
        error: (error) => {
          this.logger.error('Error deleting category', error, 'CategoryManagement');
          this.showErrorMessage('Lỗi khi xóa danh mục');
        }
      });
    });
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

  viewPost(post: Post): void {
    window.open(`/post/${post.id}`, '_blank');
  }

  deletePost(post: Post): void {
    this.confirmDestructive({
      title: 'Xoá bài viết?',
      subject: post.title,
      message: 'Bài viết sẽ bị gỡ khỏi website. Không thể hoàn tác.'
    }, () => {
      this.dataService.deletePost(post.id).subscribe({
        next: () => {
          this.refreshPostsList();
          this.showSuccessMessage(`Đã xoá "${post.title}"`);
        },
        error: (error) => {
          this.logger.error('Error deleting post', error, 'PostManagement');
          this.showErrorMessage('Lỗi khi xóa bài viết');
        }
      });
    });
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

    this.uploadProgress = 0;
    
    this.dataService.uploadHomepageImage(formData).subscribe({
      next: () => {
        this.uploadProgress = 100;
        setTimeout(() => {
          this.uploadProgress = 0;
          this.loadHomepageMedia();
          this.showSuccessMessage('Hình ảnh đã được tải lên');
        }, 500);
      },
      error: (error) => {
        this.uploadProgress = 0;
        this.logger.error('Error uploading image', error, 'MediaManagement');
        this.showErrorMessage('Lỗi khi tải lên hình ảnh');
      }
    });

    // Simulate progress (since we don't have real progress from backend)
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += 10;
      } else {
        clearInterval(progressInterval);
      }
    }, 200);
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

    this.confirmDestructive({
      title: `Xoá ${mediaType}?`,
      subject: filename,
      message: 'Tệp sẽ bị xoá khỏi máy chủ. Không thể hoàn tác.'
    }, () => {
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
    });
  }

  playVideo(videoUrl: string): void {
    // Open video in a new tab or modal
    window.open(videoUrl, '_blank');
  }

  // Navbar Logo Management
  uploadNavbarLogo(): void {
    this.createFileInput('image/*', false, (files) => {
      const file = files[0];
      if (file) {
        this.handleLogoUpload(file);
      }
    });
  }

  private handleLogoUpload(file: File): void {
    const validation = FileValidator.validateImage(file);
    if (!validation.isValid) {
      this.showErrorMessage(validation.error!);
      return;
    }

    const formData = new FormData();
    formData.append('logo', file);

    this.logoUploadProgress = 0;

    this.dataService.uploadNavbarLogo(formData).subscribe({
      next: (response: any) => {
        this.logoUploadProgress = 100;
        setTimeout(() => {
          this.logoUploadProgress = 0;
          this.navbarLogoUrl = response.url || response.logo_url;
          // Nạp lại logo thay vì reload cả trang.
          this.loadNavbarLogo();
          this.showSuccessMessage('Đã tải lên logo mới');
        }, 500);
      },
      error: (error) => {
        this.logoUploadProgress = 0;
        this.logger.error('Error uploading logo', error, 'LogoManagement');
        this.showErrorMessage('Lỗi khi tải lên logo');
      }
    });

    // Simulate progress
    const progressInterval = setInterval(() => {
      if (this.logoUploadProgress < 90) {
        this.logoUploadProgress += 10;
      } else {
        clearInterval(progressInterval);
      }
    }, 200);
  }

  deleteNavbarLogo(): void {
    this.confirmDestructive({
      title: 'Xoá logo navbar?',
      message: 'Navbar sẽ quay về icon mặc định cho tới khi bạn tải logo mới.'
    }, () => {
      this.dataService.deleteNavbarLogo().subscribe({
        next: () => {
          this.navbarLogoUrl = '';
          // Không reload cả trang nữa: reload làm mất section đang mở và mọi
          // nội dung chưa lưu ở tab khác. Chỉ nạp lại đúng dữ liệu vừa đổi.
          this.loadNavbarLogo();
          this.showSuccessMessage('Đã xoá logo navbar');
        },
        error: (error) => {
          this.logger.error('Error deleting logo', error, 'LogoManagement');
          this.showErrorMessage('Lỗi khi xóa logo');
        }
      });
    });
  }

  loadNavbarLogo(): void {
    this.dataService.getNavbarLogo().subscribe({
      next: (response: any) => {
        this.navbarLogoUrl = response.logo_url || '';
      },
      error: (error) => {
        this.logger.debug('No navbar logo found or error loading', error, 'LogoManagement');
        this.navbarLogoUrl = '';
      }
    });
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
        
        // Parse process tabs
        this.parseProcessTabs();
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
          hero_stat3_number: '+152',
          hero_stat3_label: 'Công Trình Thi Công',
          hero_stat4_number: '+1679',
          hero_stat4_label: 'Lên Phương Án Miễn Phí',
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
          feature4_description: 'Đã hoàn thành hơn 500 dự án biệt thự và nhà ở trên toàn quốc, được khách hàng tin tưởng.',
          process_section_title: 'Quy Trình Làm Việc',
          process_tabs: '[]'
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

  openHomeContentDialog(): void {
    const dialogRef = this.dialog.open(HomeContentEditDialog, {
      width: '900px',
      maxHeight: '90vh',
      data: { ...this.homepageContent }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.homepageContent = { ...result };
        this.onContentChange();
        this.saveHomepageContent();
      }
    });
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
  /**
   * Hộp thoại xác nhận theo Material, nêu rõ đối tượng sắp bị xoá.
   * Thay cho `window.confirm()` vốn lệch giao diện và chỉ hỏi chung chung
   * ("Bạn có chắc chắn muốn xóa danh mục này?") nên rất dễ xoá nhầm.
   */
  private confirmDestructive(data: Omit<ConfirmDialogData, 'destructive'>, onConfirm: () => void): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      maxWidth: '92vw',
      autoFocus: 'dialog',
      data: { ...data, destructive: true, confirmLabel: 'Xoá' } satisfies ConfirmDialogData
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        onConfirm();
      }
    });
  }

  /** Đóng sidenav sau khi chọn mục trên điện thoại (mode overlay). */
  onSidenavItemSelected(): void {
    if (this.isHandset) {
      this.sidenavOpened = false;
    }
  }

  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
  }

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

  // ============================================
  // PRODUCT MANAGEMENT METHODS
  // ============================================

  openProductDialog(product?: Product): void {
    const dialogRef = this.dialog.open(ProductDialogComponent, {
      width: '900px',
      data: { product: product || null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.refreshProductsList();
      }
    });
  }

  editProduct(product: Product): void {
    const processedProduct = { ...product };
    if (processedProduct.thumbnail_url) {
      processedProduct.thumbnail_url = UrlConverter.convertImageUrl(processedProduct.thumbnail_url);
    }
    this.openProductDialog(processedProduct);
  }

  viewProduct(product: Product): void {
    window.open(`/product/${product.id}`, '_blank');
  }

  deleteProduct(product: Product): void {
    this.confirmDestructive({
      title: 'Xoá sản phẩm?',
      subject: product.title,
      message: 'Sản phẩm và toàn bộ ảnh đính kèm sẽ bị gỡ. Không thể hoàn tác.'
    }, () => {
      this.dataService.deleteProduct(product.id).subscribe({
        next: () => {
          this.refreshProductsList();
          this.showSuccessMessage(`Đã xoá "${product.title}"`);
        },
        error: (error) => {
          this.logger.error('Error deleting product', error, 'ProductManagement');
          this.showErrorMessage('Lỗi khi xóa sản phẩm');
        }
      });
    });
  }

  private refreshProductsList(): void {
    this.products$ = this.dataService.getProducts().pipe(
      map(products => this.processProductImageUrls(products))
    );
  }

  // ============================================
  // CONSULTATIONS MANAGEMENT
  // ============================================

  loadConsultations(): void {
    this.dataService.getConsultations().subscribe({
      next: (consultations) => {
        this.consultations = consultations;
        this.filterConsultations();
      },
      error: (error) => {
        this.logger.error('Error loading consultations', error, 'ConsultationManagement');
        this.showErrorMessage('Lỗi khi tải danh sách yêu cầu tư vấn');
      }
    });
  }

  filterConsultations(): void {
    if (this.consultationFilter === 'all') {
      this.filteredConsultations = [...this.consultations];
    } else {
      this.filteredConsultations = this.consultations.filter(
        c => c.status === this.consultationFilter
      );
    }
  }

  updateConsultationStatus(id: number, status: string): void {
    this.dataService.updateConsultationStatus(id, status).subscribe({
      next: () => {
        this.loadConsultations();
        this.showSuccessMessage('Cập nhật trạng thái thành công');
      },
      error: (error) => {
        this.logger.error('Error updating consultation status', error, 'ConsultationManagement');
        this.showErrorMessage('Lỗi khi cập nhật trạng thái');
      }
    });
  }

  deleteConsultation(consultation: Consultation): void {
    this.confirmDestructive({
      title: 'Xoá yêu cầu tư vấn?',
      subject: `${consultation.name} — ${consultation.phone}`,
      message: 'Thông tin liên hệ của khách sẽ mất vĩnh viễn.'
    }, () => {
      this.dataService.deleteConsultation(consultation.id).subscribe({
        next: () => {
          this.loadConsultations();
          this.showSuccessMessage('Đã xoá yêu cầu tư vấn');
        },
        error: (error) => {
          this.logger.error('Error deleting consultation', error, 'ConsultationManagement');
          this.showErrorMessage('Lỗi khi xóa yêu cầu tư vấn');
        }
      });
    });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Chưa xử lý',
      'contacted': 'Đã liên hệ',
      'completed': 'Hoàn thành'
    };
    return labels[status] || status;
  }

  openConsultationDetail(consultation: Consultation): void {
    const dialogRef = this.dialog.open(ConsultationDetailDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: { consultation }
    });

    dialogRef.afterClosed().subscribe((result: ConsultationDetailDialogResult) => {
      if (!result) return;

      if (result.action === 'save' && result.status) {
        this.updateConsultationStatus(consultation.id, result.status);
      } else if (result.action === 'delete') {
        this.deleteConsultation(consultation);
      }
    });
  }

  // Process Tabs Methods
  parseProcessTabs(): void {
    if (this.homepageContent.process_tabs) {
      try {
        this.processTabs = JSON.parse(this.homepageContent.process_tabs);
        this.processTabsJson = JSON.stringify(this.processTabs, null, 2);
      } catch (error) {
        this.logger.error('Error parsing process tabs', error, 'HomepageManagement');
        this.processTabs = this.getDefaultProcessTabs();
        this.processTabsJson = JSON.stringify(this.processTabs, null, 2);
      }
    } else {
      this.processTabs = this.getDefaultProcessTabs();
      this.processTabsJson = JSON.stringify(this.processTabs, null, 2);
    }
  }

  getDefaultProcessTabs(): ProcessTab[] {
    return [
      {
        tab_id: 'design',
        tab_name: 'Quy Trình Thiết Kế',
        steps: [
          {
            icon_url: '/uploads/svg-icons/process-1.png',
            title: 'TRAO ĐỔI TƯ VẤN',
            description: 'Trao đổi yêu cầu, tư vấn định hướng ý tưởng, phong cách và mức đầu tư'
          },
          {
            icon_url: '/uploads/svg-icons/process-2.png',
            title: 'BÁO GIÁ THIẾT KẾ',
            description: 'Gửi khách hàng báo giá theo đúng gói thiết kế mà Khách Hàng đang đề cập, kèm quy trình làm việc cụ thể, chi tiết'
          },
          {
            icon_url: '/uploads/svg-icons/process-3.png',
            title: 'KÝ HĐ THIẾT KẾ',
            description: 'Thực hiện các thủ tục hành chính và bắt đầu triển khai các công việc theo tiến độ thống nhất'
          },
          {
            icon_url: '/uploads/svg-icons/process-4.png',
            title: 'BÀN GIAO BẢN VẼ THIẾT KẾ',
            description: 'Sau khi thống nhất hồ sơ báo cáo tiến độ, khách hàng thanh toán lần cuối giá trị HĐ còn lại trước khi nhận hồ sơ hoàn chỉnh.'
          }
        ]
      },
      {
        tab_id: 'construction',
        tab_name: 'Quy Trình Thi Công',
        steps: [
          {
            icon_url: '/uploads/svg-icons/process-1.png',
            title: 'TRAO ĐỔI TƯ VẤN',
            description: 'Trao đổi và tư vấn khách hàng về nhu cầu, mong muốn, và định hướng mức đầu tư.'
          },
          {
            icon_url: '/uploads/svg-icons/process-2.png',
            title: 'BÁO GIÁ THI CÔNG',
            description: 'Gửi báo giá thi công, chủng loại vật tư và Quy trình thi công để khách hàng nắm được thông tin.'
          },
          {
            icon_url: '/uploads/svg-icons/process-5.png',
            title: 'KÝ HĐ THI CÔNG',
            description: 'Hai bên gặp gỡ trao đổi thống nhất các vấn đề liên quan tiến độ, chất lượng, ngày khởi công và các điều khoản hợp đồng.'
          },
          {
            icon_url: '/uploads/svg-icons/process-6.png',
            title: 'BÀN GIAO & QUYẾT TOÁN',
            description: 'Kiểm tra, nghiệm thu và thanh quyết toán hợp đồng. Tiến hành bảo hành bảo trì dài hạn theo cam kết hợp đồng.'
          }
        ]
      }
    ];
  }

  updateProcessTabsFromJson(): void {
    try {
      this.processTabs = JSON.parse(this.processTabsJson);
      this.homepageContent.process_tabs = this.processTabsJson;
      this.onContentChange();
    } catch {
      this.showErrorMessage('JSON không hợp lệ. Kiểm tra lại dấu ngoặc và dấu phẩy.');
    }
  }

  addProcessTab(): void {
    this.processTabs.push({
      tab_id: 'new-tab-' + Date.now(),
      tab_name: 'Tab mới',
      steps: []
    });
    this.updateProcessTabsModel();
  }

  removeProcessTab(index: number): void {
    this.processTabs.splice(index, 1);
    this.updateProcessTabsModel();
  }

  addStep(tabIndex: number): void {
    this.processTabs[tabIndex].steps.push({
      icon_url: '/uploads/svg-icons/default-icon.png',
      title: 'Bước mới',
      description: 'Mô tả bước'
    });
    this.updateProcessTabsModel();
  }

  removeStep(tabIndex: number, stepIndex: number): void {
    this.processTabs[tabIndex].steps.splice(stepIndex, 1);
    this.updateProcessTabsModel();
  }

  updateProcessTabsModel(): void {
    this.processTabsJson = JSON.stringify(this.processTabs, null, 2);
    this.homepageContent.process_tabs = this.processTabsJson;
    this.onContentChange();
  }

  // Icon upload methods
  uploadStepIcon(tabIndex: number, stepIndex: number): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.svg';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.uploadingStepIcon = true;
        const formData = new FormData();
        formData.append('svg', file);  // Backend expects 'svg' field name

        this.dataService.uploadSvgIcon(formData).subscribe({
          next: (response) => {
            this.processTabs[tabIndex].steps[stepIndex].icon_url = response.url;
            this.updateProcessTabsModel();
            this.uploadingStepIcon = false;
            this.showSuccessMessage('Icon đã được upload thành công');
          },
          error: (error) => {
            this.logger.error('Error uploading icon', error, 'MediaManagement');
            this.showErrorMessage('Lỗi khi upload icon. Vui lòng thử lại.');
            this.uploadingStepIcon = false;
          }
        });
      }
    };
    input.click();
  }

  onIconError(event: any, tabIndex: number, stepIndex: number): void {
    // Hide broken image and show placeholder
    event.target.style.display = 'none';
    this.logger.warn(`Icon not found: ${this.processTabs[tabIndex].steps[stepIndex].icon_url}`, 'MediaManagement');
  }

  // Posts filtering methods
  filterPosts(): void {
    let filtered = [...this.originalPosts];

    // Apply search filter
    if (this.postSearchQuery.trim()) {
      const query = this.postSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(query) ||
        (post.summary && post.summary.toLowerCase().includes(query)) ||
        (post.category && post.category.name.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (this.postCategoryFilter) {
      filtered = filtered.filter(post => 
        post.category_id?.toString() === this.postCategoryFilter
      );
    }

    // Note: Posts don't have subcategory_id field, filtering by main category only

    // Apply sorting
    filtered = this.sortPosts(filtered, this.postSortBy);

    this.filteredPosts = filtered;
  }

  sortPosts(posts: Post[], sortBy: string): Post[] {
    switch (sortBy) {
      case 'alphabetical':
        return posts.sort((a, b) => a.title.localeCompare(b.title));
      case 'reverse-alphabetical':
        return posts.sort((a, b) => b.title.localeCompare(a.title));
      case 'newest':
        return posts.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
      case 'popular':
        return posts.sort((a, b) => (b.views || 0) - (a.views || 0));
      default:
        return posts;
    }
  }

  onPostSearch(): void {
    this.postSearchSubject.next(this.postSearchQuery);
  }

  onPostCategoryChange(): void {
    this.filterPosts();
  }

  onPostSubcategoryChange(): void {
    this.filterPosts();
  }

  onPostSortChange(): void {
    this.filterPosts();
  }

  getPostSubcategories(): Observable<Category[]> {
    if (!this.postCategoryFilter) {
      return of([]);
    }
    
    return this.categoryTree$.pipe(
      map(tree => {
        const parentCategory = tree.find(cat => cat.id?.toString() === this.postCategoryFilter);
        return parentCategory?.children || [];
      })
    );
  }

  // Products filtering methods
  filterProducts(): void {
    let filtered = [...this.originalProducts];

    // Apply search filter
    if (this.productSearchQuery.trim()) {
      const query = this.productSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(product => 
        product.title.toLowerCase().includes(query) ||
        (product.summary && product.summary.toLowerCase().includes(query)) ||
        (product.category && product.category.name.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (this.productCategoryFilter) {
      filtered = filtered.filter(product => 
        product.category_id?.toString() === this.productCategoryFilter
      );
    }

    // Note: Products don't have subcategory_id field, filtering by main category only

    // Apply sorting
    filtered = this.sortProducts(filtered, this.productSortBy);

    this.filteredProducts = filtered;
  }

  sortProducts(products: Product[], sortBy: string): Product[] {
    switch (sortBy) {
      case 'alphabetical':
        return products.sort((a, b) => a.title.localeCompare(b.title));
      case 'reverse-alphabetical':
        return products.sort((a, b) => b.title.localeCompare(a.title));
      case 'newest':
        return products.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
      case 'popular':
        return products.sort((a, b) => (b.views || 0) - (a.views || 0));
      default:
        return products;
    }
  }

  onProductSearch(): void {
    this.productSearchSubject.next(this.productSearchQuery);
  }

  onProductCategoryChange(): void {
    this.filterProducts();
  }

  onProductSubcategoryChange(): void {
    this.filterProducts();
  }

  onProductSortChange(): void {
    this.filterProducts();
  }

  getProductSubcategories(): Observable<Category[]> {
    if (!this.productCategoryFilter) {
      return of([]);
    }
    
    return this.categoryTree$.pipe(
      map(tree => {
        const parentCategory = tree.find(cat => cat.id?.toString() === this.productCategoryFilter);
        return parentCategory?.children || [];
      })
    );
  }
}