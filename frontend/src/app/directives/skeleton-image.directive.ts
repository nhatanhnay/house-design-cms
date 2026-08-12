import { Directive, ElementRef, Input, OnChanges, inject } from '@angular/core';

/**
 * GIF 1×1 trong suốt.
 *
 * Ảnh hỏng được gán về pixel này thay vì gỡ hẳn thuộc tính `src`: một `<img>`
 * không có nguồn thôi không còn là replaced element, nên CSS `width`/`height`
 * bị bỏ qua và thẻ co lại còn 16×16 kèm icon ảnh vỡ. Giữ một pixel hợp lệ thì
 * thẻ vẫn nhận đúng kích thước từ container, và nền skeleton hiện xuyên qua.
 */
const TRANSPARENT_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

type SkeletonState = 'loading' | 'loaded' | 'failed';

/**
 * Khung skeleton cho ảnh.
 *
 * Ảnh tự mang nền skeleton: khi chưa tải xong, nền nhấp nháy hiện qua phần trong
 * suốt của thẻ `<img>`; tải xong thì ảnh đè lên và skeleton tắt.
 *
 * Ba trạng thái:
 *   - đang tải   → nền nhấp nháy
 *   - xong       → bỏ nền, ảnh hiện
 *   - hỏng/trống → nền đứng yên (nhấp nháy mãi khi ảnh sẽ không bao giờ đến là
 *                  nói dối người dùng)
 *
 * Cách dùng: `<img [src]="url" [appSkeleton]="url">`
 * Bind chính URL vào directive để nó biết khi nào phải đặt lại trạng thái — lưới
 * dùng `trackBy` nên Angular tái sử dụng thẻ `<img>` khi chuyển trang carousel.
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
export class SkeletonImageDirective implements OnChanges {
  @Input('appSkeleton') source?: string | null;

  private readonly el: ElementRef<HTMLImageElement> = inject(ElementRef);
  private state: SkeletonState = 'loading';

  ngOnChanges(): void {
    const img = this.el.nativeElement;
    this.state = 'loading';
    img.classList.remove('is-loaded', 'is-failed');

    if (!this.source) {
      this.markFailed();
      return;
    }

    // Ảnh có sẵn trong cache trình duyệt hoàn tất trước khi listener kịp chạy,
    // nên không có sự kiện `load` nào bắn ra. Kiểm tra lại ở microtask kế tiếp,
    // lúc đó Angular đã gán xong thuộc tính src.
    queueMicrotask(() => {
      if (this.state === 'loading' && img.complete && img.naturalWidth > 0) {
        this.markLoaded();
      }
    });
  }

  markLoaded(): void {
    // Pixel trong suốt của trạng thái hỏng cũng bắn `load`; bỏ qua nó, nếu không
    // skeleton sẽ tắt và để lại một ô trống trơn.
    if (this.state === 'failed') {
      return;
    }
    this.state = 'loaded';
    this.el.nativeElement.classList.add('is-loaded');
  }

  markFailed(): void {
    if (this.state === 'failed') {
      return;
    }
    this.state = 'failed';

    const img = this.el.nativeElement;
    img.classList.remove('is-loaded');
    img.classList.add('is-failed');
    img.src = TRANSPARENT_PIXEL;
  }
}
