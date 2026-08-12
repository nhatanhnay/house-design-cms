import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Admin, CategoryTreeItem } from '../../models/models';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

/** Icon Material tương ứng với từng slug danh mục, dùng cho menu mobile. */
const CATEGORY_ICONS: Record<string, string> = {
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
  'tu-van': 'support_agent'
};

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  private readonly dataService = inject(DataService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentUser$: Observable<Admin | null> = this.authService.currentUser$;

  readonly mainCategories = signal<CategoryTreeItem[]>([]);
  readonly navbarLogoUrl = signal<string>('');
  readonly isMobileMenuOpen = signal<boolean>(false);

  /** Danh mục đang mở dropdown trên desktop; null = không có. */
  readonly openDropdownId = signal<number | null>(null);

  ngOnInit(): void {
    this.dataService.getCategories()
      .pipe(
        map(categories => {
          const active = categories.filter(cat => cat.is_active);
          return this.dataService.buildCategoryTree(active).filter(cat => cat.level === 0);
        }),
        catchError(() => of([] as CategoryTreeItem[])),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(categories => this.mainCategories.set(categories));

    this.dataService.getNavbarLogo()
      .pipe(
        map((response: { logo_url?: string }) => response?.logo_url || ''),
        catchError(() => of('')),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(url => this.navbarLogoUrl.set(url));
  }

  /** Logo trỏ tới file không tồn tại thì bỏ hẳn, để icon mặc định hiện thay vì ảnh vỡ. */
  onLogoError(): void {
    this.navbarLogoUrl.set('');
  }

  getCategoryIcon(slug: string): string {
    return CATEGORY_ICONS[slug] || 'category';
  }

  trackByCategoryId(_index: number, category: CategoryTreeItem): number {
    return category.id;
  }

  // ----------------------------------------------------------- dropdown ----

  /**
   * Dropdown desktop mở bằng cả hover lẫn bàn phím.
   *
   * Trước đây chỉ có `:hover` trong CSS, nên người dùng bàn phím không mở được
   * menu con, còn trên tablet cảm ứng thì chạm vào sẽ nhảy thẳng tới danh mục cha.
   */
  openDropdown(categoryId: number): void {
    this.openDropdownId.set(categoryId);
  }

  closeDropdown(categoryId?: number): void {
    if (categoryId === undefined || this.openDropdownId() === categoryId) {
      this.openDropdownId.set(null);
    }
  }

  toggleDropdown(event: Event, categoryId: number): void {
    // Trên thiết bị cảm ứng, chạm lần đầu mở menu con thay vì điều hướng ngay.
    if (!this.supportsHover()) {
      event.preventDefault();
      this.openDropdownId.set(this.openDropdownId() === categoryId ? null : categoryId);
    }
  }

  private supportsHover(): boolean {
    return this.document.defaultView?.matchMedia('(hover: hover)').matches ?? true;
  }

  // -------------------------------------------------------- mobile menu ----

  toggleMobileMenu(): void {
    this.isMobileMenuOpen() ? this.closeMobileMenu() : this.openMobileMenu();
  }

  openMobileMenu(): void {
    this.isMobileMenuOpen.set(true);
    // Khoá cuộn nền: nếu không, trang phía sau vẫn trôi khi vuốt trên menu.
    this.document.body.style.overflow = 'hidden';
  }

  closeMobileMenu(): void {
    if (!this.isMobileMenuOpen()) {
      return;
    }
    this.isMobileMenuOpen.set(false);
    this.document.body.style.overflow = '';
    // Trả focus về nút mở để người dùng bàn phím không bị mất vị trí.
    this.host.nativeElement.querySelector<HTMLButtonElement>('.mobile-menu-btn')?.focus();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isMobileMenuOpen()) {
      this.closeMobileMenu();
      return;
    }
    this.closeDropdown();
  }

  // -------------------------------------------------------------- logout ---

  logout(): void {
    this.closeMobileMenu();
    // AuthService.logout() luôn xoá phiên cục bộ, kể cả khi API lỗi.
    this.authService.logout().subscribe({
      complete: () => this.router.navigate(['/'])
    });
  }
}
