import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  HostListener,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Admin, Category, HomeContent, ProcessTab } from '../../models/models';
import { CardItem, byNewest, cardItemKey, toCardItem } from '../../models/card-item';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { SeoService } from '../../services/seo.service';
import { StructuredDataService } from '../../services/structured-data.service';
import { SearchComponent, SearchResponse } from '../../components/search/search.component';
import { convertImageUrl } from '../../utils/url-converter.util';
import { SkeletonImageDirective } from '../../directives/skeleton-image.directive';
import { BlueprintRevealDirective } from '../../directives/blueprint-reveal.directive';

/** Tab con của một danh mục. `id === null` là tab "Mới nhất". */
interface SubTab {
  id: number | null;
  label: string;
}

/**
 * Toàn bộ trạng thái hiển thị của một dải danh mục trên trang chủ.
 * Được tính sẵn khi dữ liệu về, template chỉ đọc — không gọi hàm.
 */
interface CategoryRow {
  id: number;
  name: string;
  slug: string;
  tabs: SubTab[];
  activeTabId: number | null;
  /** Item của tab đang chọn, tối đa MAX_ITEMS. */
  items: CardItem[];
  page: number;
  pageCount: number;
  visibleItems: CardItem[];
  /** Số hàng lưới thực cần, để không chừa chỗ trống khi ít bài. */
  rowCount: number;
}

const MAX_ITEMS = 24;
const CAROUSEL_INTERVAL_MS = 5000;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    SearchComponent,
    SkeletonImageDirective,
    BlueprintRevealDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly dataService = inject(DataService);
  private readonly authService = inject(AuthService);
  private readonly seo = inject(SeoService);
  private readonly structuredData = inject(StructuredDataService);
  private readonly document = inject(DOCUMENT);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentUser$ = this.authService.currentUser$;

  homeContent: HomeContent | null = null;
  processTabs: ProcessTab[] = [];
  activeProcessTabIndex = 0;
  currentProcessStepIndex = 0;

  /** Dữ liệu hiển thị đã tính sẵn cho từng danh mục cấp 1. */
  categoryRows: CategoryRow[] = [];

  homepageImages: string[] = [];
  currentSlideIndex = 0;
  carouselPaused = false;

  isLoading = true;
  showSearchResults = false;

  private carouselInterval: ReturnType<typeof setInterval> | null = null;
  private itemsPerPage = this.computeItemsPerPage();
  /** Item của từng danh mục theo tab, giữ lại để đổi tab không phải lọc lại. */
  private itemsByCategory = new Map<number, Map<number | null, CardItem[]>>();

  readonly trackByItem = cardItemKey;

  trackByRow(_index: number, row: CategoryRow): number {
    return row.id;
  }

  trackByTab(_index: number, tab: SubTab): string {
    return String(tab.id);
  }

  // ----------------------------------------------------------- lifecycle ---

  ngOnInit(): void {
    this.applySeo(null);
    this.structuredData.addOrganizationSchema();
    this.structuredData.addWebsiteSchema();
    this.loadHomepageMedia();
    this.loadContentGrid();
    this.loadHomeContent();
  }

  ngOnDestroy(): void {
    this.stopCarousel();
  }

  // --------------------------------------------------------------- data ----

  /**
   * Tải danh mục, bài viết, sản phẩm cùng lúc rồi dựng sẵn toàn bộ lưới.
   *
   * Trước đây ba lời gọi chạy độc lập và template tự lọc lại dữ liệu ở mỗi chu kỳ
   * change detection — kèm cả console.log dựng mảng mới mỗi lần.
   */
  private loadContentGrid(): void {
    forkJoin({
      categories: this.dataService.getCategories().pipe(catchError(() => of([] as Category[]))),
      posts: this.dataService.getPosts().pipe(catchError(() => of([]))),
      products: this.dataService.getProducts().pipe(catchError(() => of([])))
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ categories, posts, products }) => {
        this.buildRows(categories, posts, products);
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }

  private loadHomeContent(): void {
    this.dataService.getHomeContent()
      .pipe(catchError(() => of(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe(content => {
        this.homeContent = content;
        this.processTabs = this.parseProcessTabs(content);
        this.applySeo(content);
        this.cdr.markForCheck();
      });
  }

  private loadHomepageMedia(): void {
    this.dataService.getHomepageMedia()
      .pipe(
        map(response => (response?.images || []).map(convertImageUrl)),
        catchError(() => of([] as string[])),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(images => {
        this.homepageImages = images;
        this.startCarousel();
        this.cdr.markForCheck();
      });
  }

  private buildRows(categories: Category[], posts: any[], products: any[]): void {
    const processed = categories.map(category => ({
      ...category,
      thumbnail_url: category.thumbnail_url ? convertImageUrl(category.thumbnail_url) : category.thumbnail_url
    }));

    const isAdmin = this.authService.isAuthenticated();
    const cards = [
      ...posts.filter(p => isAdmin || p.published).map(p => toCardItem(p, false)),
      ...products.filter(p => isAdmin || p.published).map(p => toCardItem(p, true))
    ];

    const mainCategories = processed.filter(c => c.level === 0);
    this.itemsByCategory.clear();

    this.categoryRows = mainCategories.map(category => {
      const children = processed.filter(c => c.parent_id === category.id);
      const childIds = children.map(c => c.id);

      // Tab "Mới nhất" gộp cả danh mục cha và các danh mục con.
      const byTab = new Map<number | null, CardItem[]>();
      byTab.set(
        null,
        cards
          .filter(item => item.categoryId === category.id || childIds.includes(item.categoryId))
          .sort(byNewest)
          .slice(0, MAX_ITEMS)
      );

      children.forEach(child => {
        byTab.set(
          child.id,
          cards.filter(item => item.categoryId === child.id).sort(byNewest).slice(0, MAX_ITEMS)
        );
      });

      this.itemsByCategory.set(category.id, byTab);

      const tabs: SubTab[] = children.length
        ? [{ id: null, label: 'MỚI NHẤT' }, ...children.map(c => ({ id: c.id, label: c.name.toUpperCase() }))]
        : [];

      return this.withPagination({
        id: category.id,
        name: category.name,
        slug: category.slug,
        tabs,
        activeTabId: null,
        items: byTab.get(null) || [],
        page: 0,
        pageCount: 0,
        visibleItems: [],
        rowCount: 1
      });
    })
    // Danh mục không có nội dung thì không dựng dải trống.
    .filter(row => row.items.length > 0);
  }

  /** Tính lại số trang, hàng lưới và lát cắt hiển thị cho một dải. */
  private withPagination(row: CategoryRow): CategoryRow {
    const pageCount = Math.max(1, Math.ceil(row.items.length / this.itemsPerPage));
    const page = Math.min(row.page, pageCount - 1);
    const visibleItems = row.items.slice(page * this.itemsPerPage, (page + 1) * this.itemsPerPage);

    // Số cột hiện tại suy từ số item mỗi trang (mỗi trang tối đa 2 hàng).
    const columns = Math.max(1, this.itemsPerPage / 2);

    return {
      ...row,
      page,
      pageCount,
      visibleItems,
      rowCount: Math.max(1, Math.ceil(visibleItems.length / columns))
    };
  }

  private replaceRow(updated: CategoryRow): void {
    this.categoryRows = this.categoryRows.map(row => (row.id === updated.id ? updated : row));
    this.cdr.markForCheck();
  }

  // ---------------------------------------------------------------- tabs ---

  selectTab(row: CategoryRow, tabId: number | null): void {
    if (row.activeTabId === tabId) {
      return;
    }
    const items = this.itemsByCategory.get(row.id)?.get(tabId) || [];
    this.replaceRow(this.withPagination({ ...row, activeTabId: tabId, items, page: 0 }));
  }

  // ------------------------------------------------------------ carousel ---

  goToPage(row: CategoryRow, direction: -1 | 1): void {
    const page = row.page + direction;
    if (page < 0 || page >= row.pageCount) {
      return;
    }
    this.replaceRow(this.withPagination({ ...row, page }));
  }

  /**
   * Số item mỗi trang phụ thuộc bề rộng màn hình, nên khi người dùng xoay máy
   * hoặc đổi kích thước cửa sổ phải tính lại — nếu không, trang đang xem có thể
   * vượt quá số trang mới và lưới hiện ra trống trơn.
   */
  @HostListener('window:resize')
  onResize(): void {
    const next = this.computeItemsPerPage();
    if (next === this.itemsPerPage) {
      return;
    }
    this.itemsPerPage = next;
    this.categoryRows = this.categoryRows.map(row => this.withPagination(row));
    this.cdr.markForCheck();
  }

  private computeItemsPerPage(): number {
    const width = this.document.defaultView?.innerWidth ?? 1280;
    if (width <= 768) return 2;   // 1 cột × 2 hàng
    if (width <= 1024) return 4;  // 2 cột × 2 hàng
    return 6;                     // 3 cột × 2 hàng
  }

  // ------------------------------------------------------- hero carousel ---

  private startCarousel(): void {
    this.stopCarousel();
    if (this.homepageImages.length < 2 || this.prefersReducedMotion()) {
      return;
    }
    this.carouselInterval = setInterval(() => {
      // Không đổi ảnh khi tab đang ẩn hoặc người dùng đang rê chuột lên hero.
      if (this.document.hidden || this.carouselPaused) {
        return;
      }
      this.currentSlideIndex = (this.currentSlideIndex + 1) % this.homepageImages.length;
      this.cdr.markForCheck();
    }, CAROUSEL_INTERVAL_MS);
  }

  private stopCarousel(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
      this.carouselInterval = null;
    }
  }

  private prefersReducedMotion(): boolean {
    return this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  pauseCarousel(): void {
    this.carouselPaused = true;
  }

  resumeCarousel(): void {
    this.carouselPaused = false;
  }

  goToSlide(index: number): void {
    if (index < 0 || index >= this.homepageImages.length) {
      return;
    }
    this.currentSlideIndex = index;
  }

  nextSlide(): void {
    if (!this.homepageImages.length) return;
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.homepageImages.length;
  }

  previousSlide(): void {
    if (!this.homepageImages.length) return;
    this.currentSlideIndex =
      (this.currentSlideIndex - 1 + this.homepageImages.length) % this.homepageImages.length;
  }

  // -------------------------------------------------------- process tabs ---

  private parseProcessTabs(content: HomeContent | null): ProcessTab[] {
    if (!content?.process_tabs) {
      return [];
    }

    try {
      const tabs: ProcessTab[] = JSON.parse(content.process_tabs);
      tabs.forEach(tab => tab.steps?.forEach(step => {
        if (step.icon_url) {
          step.icon_url = convertImageUrl(step.icon_url);
        }
      }));
      return tabs;
    } catch {
      // Nội dung do người dùng nhập; JSON hỏng thì bỏ qua phần này thay vì vỡ trang.
      return [];
    }
  }

  setActiveProcessTab(index: number): void {
    this.activeProcessTabIndex = index;
    this.currentProcessStepIndex = 0;
  }

  nextProcessStep(): void {
    if (this.canGoToNextStep()) {
      this.currentProcessStepIndex++;
    }
  }

  prevProcessStep(): void {
    if (this.canGoToPrevStep()) {
      this.currentProcessStepIndex--;
    }
  }

  canGoToNextStep(): boolean {
    const steps = this.processTabs[this.activeProcessTabIndex]?.steps?.length ?? 0;
    return this.currentProcessStepIndex < steps - 1;
  }

  canGoToPrevStep(): boolean {
    return this.currentProcessStepIndex > 0;
  }

  // ----------------------------------------------------------------- seo ---

  private applySeo(content: HomeContent | null): void {
    this.seo.update({
      title: content?.meta_title || content?.hero_title || undefined,
      description: content?.meta_description || content?.hero_description || undefined,
      image: content?.og_image_url || undefined,
      path: '/',
      type: 'website'
    });
  }

  // ------------------------------------------------------------- helpers ---

  isMatIcon(value: string | undefined): boolean {
    if (!value) return false;
    return !value.includes('/') && !value.includes('http') && !value.startsWith('<svg');
  }

  onSearchResults(results: SearchResponse | null): void {
    this.showSearchResults = !!results && results.results.length > 0;
    this.cdr.markForCheck();
  }
}
