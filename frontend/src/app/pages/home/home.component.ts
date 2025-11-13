import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HomeContentEditDialog } from '../home-content-edit-dialog/home-content-edit-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Admin, Category, HomeContent, Post, Product, ProcessTab } from '../../models/models';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { StructuredDataService } from '../../services/structured-data.service';
import { ConsultationFormComponent } from '../../components/consultation-form/consultation-form.component';

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
    FormsModule,
    ConsultationFormComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  latestPosts$: Observable<Post[]>;
  mainCategories$: Observable<Category[]>;
  mainCategories: Category[] = []; // Add explicit array for template
  currentUser$: Observable<Admin | null>;
  homeContent: HomeContent | null = null;
  isLoadingPosts = true;
  isLoadingCategories = true;

  // Store posts for category filtering
  allPosts: Post[] = [];
  
  // Store products for category filtering
  allProducts: Product[] = [];

  // Active tab tracking for each category
  activeSubCategoryTabs: { [categoryId: number]: number | null } = {};

  // Category carousel tracking
  categoryCarouselIndexes: { [categoryId: number]: number } = {};

  // Homepage carousel properties
  homepageImages: string[] = [];
  currentSlideIndex: number = 0;
  private carouselInterval: any;

  // Process tabs properties
  processTabs: ProcessTab[] = [];
  activeProcessTabIndex: number = 0;

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private dialog: MatDialog,
    private titleService: Title,
    private metaService: Meta,
    private structuredDataService: StructuredDataService
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

          // Debug log for dynamic-categories-section
          console.log(`DEBUG: Type: ${mainCategory.category_type} | Children: ${mainCategory.children?.length || 0} | Has Children: ${mainCategory.children && mainCategory.children.length > 0 ? 'YES' : 'NO'} | Children Array:`, JSON.stringify(mainCategory.children));
        });
        return mainCategories;
      })
    );
  }

  ngOnInit(): void {
    this.setPageMetadata();
    this.setupStructuredData();
    this.loadHomepageMedia();

    this.latestPosts$.subscribe({
      next: (posts) => {
        this.isLoadingPosts = false;
        this.allPosts = posts;
        console.log('📦 All posts loaded:', this.allPosts.length, this.allPosts);
      },
      error: (error) => {
        this.isLoadingPosts = false;
        console.error('❌ Error loading posts:', error);
      }
    });

    // Load all products
    this.dataService.getProducts().subscribe({
      next: (products) => {
        this.allProducts = products;
        console.log('🛍️ All products loaded:', this.allProducts.length, this.allProducts);
      },
      error: (error) => {
        console.error('❌ Error loading products:', error);
      }
    });

    this.mainCategories$.subscribe({
      next: (categories) => {
        this.isLoadingCategories = false;
        this.mainCategories = categories; // Store in component property
        console.log('📂 Categories loaded:', categories);
        
        // Initialize all category tabs to "Mới nhất" (null)
        categories.forEach(category => {
          if ((category.category_type === 'parent' || category.category_type === 'product') && 
              category.children && category.children.length > 0) {
            this.activeSubCategoryTabs[category.id] = null;
            console.log(`🏷️ Initialized tab for category ${category.id} (${category.name}) to null`);
          }
        });
        console.log('🎯 Active tabs:', this.activeSubCategoryTabs);
      },
      error: (error) => {
        this.isLoadingCategories = false;
        console.error('❌ Error loading categories:', error);
      }
    });

    // Load home content
    this.dataService.getHomeContent().subscribe({
      next: (content) => {
        this.homeContent = content;
        // Parse process tabs from JSON string
        this.parseProcessTabs();
        // Update meta tags with dynamic content
        this.updateDynamicMetadata();
      },
      error: (error) => {
        // Use default values if API fails
        this.homeContent = null;
        this.processTabs = [];
      }
    });
  }

  private setPageMetadata(): void {
    // Set base meta tags
    this.titleService.setTitle('MMA Architectural Design - Thiết Kế & Thi Công Biệt Thự Hiện Đại');

    this.metaService.updateTag({
      name: 'description',
      content: 'Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo. Đội ngũ chuyên nghiệp với hơn 10 năm kinh nghiệm trên toàn quốc.'
    });

    this.metaService.updateTag({
      name: 'keywords',
      content: 'thiết kế biệt thự, kiến trúc hiện đại, xây dựng nhà ở, thi công biệt thự, kiến trúc sư chuyên nghiệp'
    });

    // Open Graph tags
    this.metaService.updateTag({
      property: 'og:title',
      content: 'MMA Architectural Design - Thiết Kế & Thi Công Biệt Thự Hiện Đại'
    });

    this.metaService.updateTag({
      property: 'og:description',
      content: 'Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo.'
    });

    this.metaService.updateTag({
      property: 'og:type',
      content: 'website'
    });

    this.metaService.updateTag({
      property: 'og:url',
      content: window.location.href
    });

    // Twitter Card tags
    this.metaService.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image'
    });

    this.metaService.updateTag({
      name: 'twitter:title',
      content: 'MMA Architectural Design'
    });

    this.metaService.updateTag({
      name: 'twitter:description',
      content: 'Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo.'
    });
  }

  private updateDynamicMetadata(): void {
    if (this.homeContent) {
      // Update title with dynamic content
      const dynamicTitle = this.homeContent.hero_title || 'MMA Architectural Design';
      this.titleService.setTitle(`${dynamicTitle} - Thiết Kế & Thi Công Biệt Thự Hiện Đại`);

      // Update description with dynamic content
      const dynamicDescription = this.homeContent.hero_description ||
        'Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo.';

      this.metaService.updateTag({
        name: 'description',
        content: dynamicDescription
      });

      this.metaService.updateTag({
        property: 'og:title',
        content: dynamicTitle
      });

      this.metaService.updateTag({
        property: 'og:description',
        content: dynamicDescription
      });
    }
  }

  private setupStructuredData(): void {
    // Add organization schema
    this.structuredDataService.addOrganizationSchema();

    // Add website schema
    this.structuredDataService.addWebsiteSchema();

    // Add local business schema with default data
    const businessData = {
      name: 'MMA Architectural Design',
      description: 'Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo',
      address: {
        street: '',
        city: '',
        region: 'Vietnam',
        postal: ''
      },
      phone: '',
      email: '',
      logo: '/assets/images/logo.png',
      openingHours: [
        'Mo-Fr 08:00-17:00',
        'Sa 08:00-12:00'
      ]
    };

    this.structuredDataService.addLocalBusinessSchema(businessData);
  }

  onImageError(event: any, imageUrl?: string): void {
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
  }

  // Homepage carousel methods
  loadHomepageMedia(): void {
    this.dataService.getHomepageMedia().subscribe({
      next: (response: any) => {
        // Convert absolute URLs to relative URLs for proxy support
        this.homepageImages = (response.images || []).map((url: string) => {
          return this.convertImageUrl(url);
        });
        if (this.homepageImages.length > 0) {
          this.startCarouselAutoPlay();
        }
      },
      error: (error) => {
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


    // Handle localhost URLs
    if (url.startsWith('http://localhost:8080/')) {
      const converted = url.replace('http://localhost:8080/', '/');
      return converted;
    }

    // Handle production backend URLs - add your VPS backend URL here
    // Example: if (url.startsWith('http://your-vps-domain:8080/')) {
    //   return url.replace('http://your-vps-domain:8080/', '/');
    // }

    // Handle HTTPS backend URLs
    if (url.startsWith('https://') && url.includes(':8080/')) {
      const converted = url.replace(/https:\/\/[^\/]+:8080\//, '/');
      return converted;
    }

    // Handle HTTP backend URLs with any domain
    if (url.startsWith('http://') && url.includes(':8080/')) {
      const converted = url.replace(/http:\/\/[^\/]+:8080\//, '/');
      return converted;
    }

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
          },
          error: (error) => {
          }
        });
      }
    });
  }

  isMatIcon(value: string | undefined): boolean {
    // Check if the value is a Material Icon (not a URL or SVG content)
    if (!value) return false;
    return !value.includes('/') && !value.includes('http') && !value.startsWith('<svg');
  }

  parseProcessTabs(): void {
    if (this.homeContent?.process_tabs) {
      try {
        this.processTabs = JSON.parse(this.homeContent.process_tabs);
        // Convert image URLs for all step icons
        this.processTabs.forEach(tab => {
          tab.steps.forEach(step => {
            if (step.icon_url) {
              step.icon_url = this.convertImageUrl(step.icon_url);
            }
          });
        });
      } catch (error) {
        console.error('Error parsing process tabs:', error);
        this.processTabs = [];
      }
    } else {
      this.processTabs = [];
    }
  }

  setActiveProcessTab(index: number): void {
    this.activeProcessTabIndex = index;
  }

  // Set active sub-category tab (null means "Mới nhất")
  setActiveSubCategoryTab(categoryId: number, subCategoryId: number | null): void {
    this.activeSubCategoryTabs[categoryId] = subCategoryId;
    // Reset carousel position when changing tabs
    this.categoryCarouselIndexes[categoryId] = 0;
  }

  // Get active sub-category ID for a category
  getActiveSubCategoryTab(categoryId: number): number | null {
    return this.activeSubCategoryTabs[categoryId] !== undefined 
      ? this.activeSubCategoryTabs[categoryId] 
      : null; // Default to "Mới nhất"
  }

  // Get posts for a category or subcategory
  getFilteredCategoryPosts(categoryId: number, subCategoryId: number | null = null): Post[] {
    console.log('🔍 getFilteredCategoryPosts called:', { 
      categoryId, 
      subCategoryId, 
      totalPosts: this.allPosts.length,
      allPosts: this.allPosts.map(p => ({ id: p.id, title: p.title, category_id: p.category_id }))
    });
    
    if (subCategoryId === null) {
      // "Mới nhất" - show all posts from main category and its subcategories
      const category = this.mainCategories.find(c => c.id === categoryId);
      console.log('📁 Category found:', category);
      
      if (!category) return [];
      
      const subcategoryIds = (category.children || []).map(c => c.id);
      console.log('👶 Subcategory IDs:', subcategoryIds);
      
      const filteredPosts = this.allPosts.filter(post => 
        post.category_id === categoryId || subcategoryIds.includes(post.category_id)
      ).sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
      
      console.log('✅ Filtered posts (Mới nhất):', filteredPosts.length, filteredPosts);
      return filteredPosts;
    } else {
      // Specific subcategory
      const filteredPosts = this.allPosts
        .filter(post => post.category_id === subCategoryId)
        .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
      
      console.log('✅ Filtered posts (subcategory):', filteredPosts.length, filteredPosts);
      return filteredPosts;
    }
  }

  // Get products for a category or subcategory
  getFilteredCategoryProducts(categoryId: number, subCategoryId: number | null = null): Product[] {
    console.log('🔍 getFilteredCategoryProducts called:', { 
      categoryId, 
      subCategoryId, 
      totalProducts: this.allProducts.length,
      allProducts: this.allProducts.map(p => ({ id: p.id, title: p.title, category_id: p.category_id }))
    });
    
    if (subCategoryId === null) {
      // "Mới nhất" - show all products from main category and its subcategories
      const category = this.mainCategories.find(c => c.id === categoryId);
      console.log('📁 Category found:', category);
      
      if (!category) return [];
      
      const subcategoryIds = (category.children || []).map(c => c.id);
      console.log('👶 Subcategory IDs:', subcategoryIds);
      
      const filteredProducts = this.allProducts.filter(product => 
        product.category_id === categoryId || subcategoryIds.includes(product.category_id)
      ).sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
      
      console.log('✅ Filtered products (Mới nhất):', filteredProducts.length, filteredProducts);
      return filteredProducts;
    } else {
      // Specific subcategory
      const filteredProducts = this.allProducts
        .filter(product => product.category_id === subCategoryId)
        .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
      
      console.log('✅ Filtered products (subcategory):', filteredProducts.length, filteredProducts);
      return filteredProducts;
    }
  }

  // Get combined items (posts + products) for a category or subcategory
  getFilteredCategoryItems(categoryId: number, subCategoryId: number | null = null): (Post | Product)[] {
    const posts = this.getFilteredCategoryPosts(categoryId, subCategoryId);
    const products = this.getFilteredCategoryProducts(categoryId, subCategoryId);
    
    // Combine and sort by created_at
    const combined = [...posts, ...products].sort((a, b) => 
      new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
    );
    
    console.log('🎯 Combined items:', combined.length, combined);
    return combined;
  }

  // Helper to check if item is a Product
  isProduct(item: Post | Product): item is Product {
    return 'thumbnail_url' in item;
  }

  // Get route link for item
  getItemRoute(item: Post | Product): string {
    if (this.isProduct(item)) {
      return '/product/' + (item.slug || item.id);
    }
    return '/post/' + (item.slug || item.id);
  }

  // Get image URL for item
  getItemImageUrl(item: Post | Product): string | undefined {
    if (this.isProduct(item)) {
      return item.thumbnail_url;
    }
    return item.image_url;
  }

  // Category carousel methods
  getCategoryCarouselIndex(categoryId: number): number {
    return this.categoryCarouselIndexes[categoryId] || 0;
  }

  // Get visible items count based on screen size
  getVisibleItemsCount(): number {
    if (typeof window === 'undefined') return 3;
    const width = window.innerWidth;
    if (width <= 768) return 1; // Mobile: 1 item
    if (width <= 1024) return 2; // Tablet: 2 items
    return 3; // Desktop: 3 items
  }

  // Get percentage for transform based on visible items
  getCarouselTransformPercent(): number {
    const visibleItems = this.getVisibleItemsCount();
    return 100 / visibleItems; // 100% for 1 item, 50% for 2 items, 33.333% for 3 items
  }

  getMaxCarouselIndex(categoryId: number): number {
    const items = this.getFilteredCategoryItems(categoryId, this.activeSubCategoryTabs[categoryId]);
    const totalItems = Math.min(items.length, 6); // Max 6 items
    const visibleItems = this.getVisibleItemsCount();
    // Calculate max index: total items - visible items
    return Math.max(0, totalItems - visibleItems);
  }

  scrollCategoryCarousel(categoryId: number, direction: 'prev' | 'next'): void {
    const currentIndex = this.getCategoryCarouselIndex(categoryId);
    const maxIndex = this.getMaxCarouselIndex(categoryId);
    
    if (direction === 'prev' && currentIndex > 0) {
      this.categoryCarouselIndexes[categoryId] = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < maxIndex) {
      this.categoryCarouselIndexes[categoryId] = currentIndex + 1;
    }
  }
}

