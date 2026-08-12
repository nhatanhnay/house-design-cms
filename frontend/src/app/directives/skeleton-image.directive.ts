import { Directive, ElementRef, Input, OnChanges, OnDestroy, inject } from '@angular/core';

type SkeletonState = 'loading' | 'loaded' | 'failed';

/**
 * Khung skeleton cho ảnh.
 *
 * Nền skeleton nằm ở phần tử cha, không nằm trên chính thẻ `<img>` — và tuyệt
 * đối không đụng vào thuộc tính `src`.
 *
 * Bản đầu tiên gán `src` về một pixel trong suốt khi ảnh hỏng, để tránh icon
 * ảnh vỡ. Nhưng gán `src` sẽ **huỷ request đang tải**: nếu vì lý do nào đó
 * `error` bắn ra trước khi ảnh kịp tải xong, việc gán lại src làm hỏng luôn lần
 * tải hợp lệ, và ảnh biến mất tuỳ thời điểm — một lỗi chập chờn rất khó lần.
 * Nay ảnh hỏng chỉ bị ẩn bằng `visibility`, request không bao giờ bị cắt.
 *
 * Ba trạng thái, đọc được qua class trên phần tử cha:
 *   - đang tải   → nền nhấp nháy
 *   - xong       → bỏ nền, ảnh hiện
 *   - hỏng/trống → nền đứng yên, ảnh bị ẩn
 */
@Directive({
  selector: 'img[appSkeleton]',
  standalone: true,
  host: {
    'class': 'skeleton-img',
    '(load)': 'markLoaded()',
    '(error)': 'markFailed()'
  }
})
export class SkeletonImageDirective implements OnChanges, OnDestroy {
  /** Bind chính URL ảnh vào đây để directive biết khi nào đặt lại trạng thái. */
  @Input('appSkeleton') source?: string | null;

  private readonly el: ElementRef<HTMLImageElement> = inject(ElementRef);
  private state: SkeletonState = 'loading';

  private get host(): HTMLElement | null {
    return this.el.nativeElement.parentElement;
  }

  ngOnChanges(): void {
    const img = this.el.nativeElement;
    this.state = 'loading';
    this.setHostState(null);
    img.style.visibility = '';

    if (!this.source) {
      this.markFailed();
      return;
    }

    // Ảnh có sẵn trong cache hoàn tất trước khi listener kịp chạy nên không có
    // sự kiện `load` nào bắn ra; kiểm tra lại ở microtask kế tiếp.
    queueMicrotask(() => {
      if (this.state === 'loading' && img.complete && img.naturalWidth > 0) {
        this.markLoaded();
      }
    });
  }

  ngOnDestroy(): void {
    this.setHostState(null);
  }

  markLoaded(): void {
    if (this.state === 'loaded') {
      return;
    }
    this.state = 'loaded';
    this.el.nativeElement.style.visibility = '';
    this.setHostState('is-loaded');
  }

  markFailed(): void {
    const img = this.el.nativeElement;

    // Ảnh đã có pixel hợp lệ thì bỏ qua sự kiện lỗi đến muộn.
    if (img.complete && img.naturalWidth > 0) {
      this.markLoaded();
      return;
    }

    if (this.state === 'failed') {
      return;
    }
    this.state = 'failed';
    // Ẩn thay vì đổi src: không cắt request, không hiện icon ảnh vỡ.
    img.style.visibility = 'hidden';
    this.setHostState('is-failed');
  }

  /** Gắn trạng thái lên phần tử cha, nơi mang nền skeleton. */
  private setHostState(state: 'is-loaded' | 'is-failed' | null): void {
    const host = this.host;
    if (!host) {
      return;
    }
    host.classList.add('skeleton-host');
    host.classList.remove('is-loaded', 'is-failed');
    if (state) {
      host.classList.add(state);
    }
  }
}
