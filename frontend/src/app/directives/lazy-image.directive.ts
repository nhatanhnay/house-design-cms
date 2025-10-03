import { Directive, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';

@Directive({
  selector: 'img[appLazyImage]',
  standalone: true
})
export class LazyImageDirective implements OnInit, OnDestroy {
  @Input() src!: string;
  @Input() alt!: string;
  @Input() placeholder?: string;

  private observer?: IntersectionObserver;

  constructor(private el: ElementRef<HTMLImageElement>) {}

  ngOnInit(): void {
    const img = this.el.nativeElement;

    // Set loading and decoding attributes for better performance
    img.loading = 'lazy';
    img.decoding = 'async';

    // Set placeholder if provided
    if (this.placeholder) {
      img.src = this.placeholder;
    }

    // Set alt text for accessibility
    if (this.alt) {
      img.alt = this.alt;
    }

    // Use Intersection Observer for more control over lazy loading
    if ('IntersectionObserver' in window) {
      this.setupIntersectionObserver();
    } else {
      // Fallback for browsers without Intersection Observer
      this.loadImage();
    }
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupIntersectionObserver(): void {
    const options = {
      root: null,
      rootMargin: '50px 0px', // Start loading 50px before the image comes into view
      threshold: 0.01
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage();
          this.observer?.unobserve(entry.target);
        }
      });
    }, options);

    this.observer.observe(this.el.nativeElement);
  }

  private loadImage(): void {
    const img = this.el.nativeElement;

    if (this.src && img.src !== this.src) {
      // Add loading class for CSS transitions
      img.classList.add('loading');

      // Create a new image to preload
      const imageLoader = new Image();

      imageLoader.onload = () => {
        img.src = this.src;
        img.classList.remove('loading');
        img.classList.add('loaded');
      };

      imageLoader.onerror = () => {
        img.classList.remove('loading');
        img.classList.add('error');
        // You could set a fallback image here
        console.warn(`Failed to load image: ${this.src}`);
      };

      imageLoader.src = this.src;
    }
  }
}