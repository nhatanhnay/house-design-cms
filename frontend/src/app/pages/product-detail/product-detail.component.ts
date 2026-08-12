import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { SeoService } from '../../services/seo.service';
import { environment } from '../../../environments/environment';
import { Product } from '../../models/models';
import { SkeletonImageDirective } from '../../directives/skeleton-image.directive';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, RouterModule, SkeletonImageDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly dataService = inject(DataService);
  private readonly authService = inject(AuthService);
  private readonly seo = inject(SeoService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentUser$ = this.authService.currentUser$;

  product: Product | null = null;
  isLoading = true;
  hasError = false;
  selectedImage: string | null = null;

  relatedProducts: Product[] = [];
  suggestedProducts: Product[] = [];

  trackByProductId(_index: number, product: Product): number {
    return product.id;
  }

  trackByImageUrl(_index: number, image: { image_url: string }): string {
    return image.image_url;
  }

  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap(params => {
          const slugOrId = params['slug'];
          this.isLoading = true;
          this.hasError = false;
          this.product = null;
          this.selectedImage = null;
          this.relatedProducts = [];
          this.suggestedProducts = [];
          this.cdr.markForCheck();

          if (!slugOrId) {
            return of(null);
          }

          const numericId = Number(slugOrId);
          const isNumeric = Number.isInteger(numericId) && String(numericId) === slugOrId;

          return (isNumeric
            ? this.dataService.getProduct(numericId)
            : this.dataService.getProductBySlug(slugOrId)
          ).pipe(catchError(() => of(null)));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(product => {
        this.isLoading = false;

        if (!product) {
          this.hasError = true;
          this.seo.update({
            title: 'Không tìm thấy sản phẩm',
            description: 'Sản phẩm không tồn tại hoặc đã bị xoá.',
            noindex: true
          });
          this.cdr.markForCheck();
          return;
        }

        this.product = product;
        this.selectedImage = product.thumbnail_url || product.images?.[0]?.image_url || null;
        this.applySeo(product);
        this.loadRelated(product);
        this.countView(product);
        this.cdr.markForCheck();
      });
  }

  /** Ghi dữ liệu SEO của sản phẩm ra <head> thay vì để trống như trước. */
  private applySeo(product: Product): void {
    const image = product.og_image_url || product.thumbnail_url || product.images?.[0]?.image_url;

    this.seo.update({
      title: product.meta_title || product.title,
      description: product.meta_description || product.summary,
      keywords: product.focus_keywords,
      image,
      path: `/product/${product.slug || product.id}`,
      type: 'product',
      publishedAt: product.created_at,
      modifiedAt: product.updated_at
    });

    this.seo.setStructuredData('product', {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description: product.meta_description || product.summary || '',
      image: [image, ...(product.images || []).map(i => i.image_url)].filter(Boolean),
      category: product.category?.name,
      brand: {
        '@type': 'Brand',
        name: environment.siteName
      },
      url: `${environment.baseUrl}/product/${product.slug || product.id}`
    });

    const trail: Array<{ name: string; path?: string }> = [{ name: 'Trang chủ', path: '/' }];
    if (product.category?.parent) {
      trail.push({
        name: product.category.parent.name,
        path: `/category/${product.category.parent.slug}`
      });
    }
    if (product.category) {
      trail.push({ name: product.category.name, path: `/category/${product.category.slug}` });
    }
    trail.push({ name: product.title, path: `/product/${product.slug || product.id}` });
    this.seo.setBreadcrumb(trail);
  }

  private loadRelated(product: Product): void {
    if (!product.category_id) {
      return;
    }

    this.dataService.getRelatedProducts(product.category_id, product.id)
      .pipe(catchError(() => of([] as Product[])), takeUntilDestroyed(this.destroyRef))
      .subscribe(products => {
        this.relatedProducts = products.slice(0, 3);
        this.suggestedProducts = products.slice(3, 7);
        this.cdr.markForCheck();
      });
  }

  private countView(product: Product): void {
    if (this.authService.getToken()) {
      return;
    }

    this.dataService.incrementProductView(product.id)
      .pipe(catchError(() => of(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  selectImage(imageUrl: string): void {
    this.selectedImage = imageUrl;
  }

  shareOnFacebook(product: Product): void {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(product.title);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank', 'noopener');
  }

  async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(window.location.href);
      this.snackBar.open('Đã sao chép liên kết', 'Đóng', { duration: 2500 });
    } catch {
      this.snackBar.open('Không sao chép được. Hãy copy từ thanh địa chỉ.', 'Đóng', { duration: 4000 });
    }
  }
}
