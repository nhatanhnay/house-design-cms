import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Observable, switchMap } from 'rxjs';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Product, Admin } from '../../models/models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, RouterModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit, AfterViewChecked {
  product$: Observable<Product>;
  isLoading = true;
  product: Product | null = null;
  hasError = false;
  currentUser$: Observable<Admin | null>;
  selectedImage: string | null = null;
  relatedProducts: Product[] = [];
  suggestedProducts: Product[] = [];
  private imagesProcessed = false;

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private authService: AuthService
  ) {
    this.product$ = this.route.params.pipe(
      switchMap(params => {
        const id = parseInt(params['id']);
        return this.dataService.getProduct(id);
      })
    );
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const slugOrId = params['slug'];

      if (slugOrId) {
        this.isLoading = true;
        this.hasError = false;
        this.product = null;
        this.selectedImage = null;

        // Try to parse as ID first (if it's a number, use old method)
        const numericId = parseInt(slugOrId);
        const isNumeric = !isNaN(numericId) && slugOrId === numericId.toString();

        const productObservable = isNumeric
          ? this.dataService.getProduct(numericId)
          : this.dataService.getProductBySlug(slugOrId);

        productObservable.subscribe({
          next: (product) => {
            this.isLoading = false;
            this.product = product;
            this.hasError = false;
            this.imagesProcessed = false; // Reset flag for new product
            // Set thumbnail as main image, or first gallery image if no thumbnail
            this.selectedImage = product.thumbnail_url ||
              (product.images && product.images.length > 0 ? product.images[0].image_url : null);

            // Load related products from the same category
            if (product.category_id) {
              this.loadRelatedProducts(product.category_id, product.id);
            }

            // Increment view count (only if not logged in as admin)
            if (!this.authService.getToken()) {
              this.dataService.incrementProductView(product.id).subscribe({
                next: () => console.log('Product view count incremented'),
                error: (error) => console.error('Error incrementing product views:', error)
              });
            }
          },
          error: (error) => {
            console.error('Error loading product:', error);
            this.isLoading = false;
            this.hasError = true;
            this.product = null;
          }
        });
      } else {
        this.isLoading = false;
        this.hasError = true;
        this.product = null;
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.product && !this.imagesProcessed) {
      this.removeImageDimensions();
      this.imagesProcessed = true;
    }
  }

  private removeImageDimensions(): void {
    // Remove width and height attributes from all images and figures in content
    const contentImages = document.querySelectorAll('.content-html img');
    contentImages.forEach((img: Element) => {
      img.removeAttribute('width');
      img.removeAttribute('height');
    });

    const contentFigures = document.querySelectorAll('.content-html figure');
    contentFigures.forEach((figure: Element) => {
      figure.removeAttribute('width');
      figure.removeAttribute('height');
      (figure as HTMLElement).style.width = '';
      (figure as HTMLElement).style.height = '';
    });
  }

  selectImage(imageUrl: string): void {
    this.selectedImage = imageUrl;
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/placeholder-product.jpg';
  }

  shareOnFacebook(product: Product): void {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(product.title);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank');
  }

  copyLink(): void {
    navigator.clipboard.writeText(window.location.href).then(() => {
      // Could show a snackbar notification here
    });
  }

  loadRelatedProducts(categoryId: number, currentProductId: number): void {
    this.dataService.getProducts().subscribe({
      next: (products) => {
        // Filter products from the same category, exclude current product
        const sameCategoryProducts = products.filter(p =>
          p.category_id === categoryId &&
          p.id !== currentProductId &&
          p.published
        );

        // Take 3 for sidebar, 4 for bottom (different sets)
        this.relatedProducts = sameCategoryProducts.slice(0, 3);
        this.suggestedProducts = sameCategoryProducts.slice(3, 7);

        // If not enough products, fill with other published products
        if (this.suggestedProducts.length < 4) {
          const otherProducts = products.filter(p =>
            p.id !== currentProductId &&
            p.published &&
            !this.relatedProducts.some(rp => rp.id === p.id) &&
            !this.suggestedProducts.some(sp => sp.id === p.id)
          );
          this.suggestedProducts = [...this.suggestedProducts, ...otherProducts].slice(0, 4);
        }
      },
      error: (error) => {
        console.error('Error loading related products:', error);
      }
    });
  }
}
