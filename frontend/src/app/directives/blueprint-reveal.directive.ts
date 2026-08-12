import {
  Directive,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Hiện ảnh công trình bằng chính bản vẽ của nó.
 *
 * Trình duyệt đọc tấm ảnh đã tải, dò biên các mảng khối bằng bộ lọc Sobel, vẽ
 * lại thành nét theo một lằn quét ngang, rồi ảnh thật nổi lên xuyên qua nét.
 * Bản vẽ được sinh từ đúng tấm ảnh đó — không cần ai vẽ thêm file nào.
 *
 * Tham số dưới đây chọn sau khi thử trên ảnh thật của site: ngưỡng 26 bị nhiễu
 * vân gỗ và tán lá, ngưỡng 70 làm nét bè ra thành mảng. 45 kèm làm mượt 1px cho
 * nét sạch mà vẫn giữ được khung cửa và mép mái.
 */
const ANALYSIS_WIDTH = 360;
const EDGE_THRESHOLD = 45;
const EDGE_GAIN = 1.5;
const PRE_BLUR_PX = 1;

const DRAW_MS = 1500;
const HOLD_MS = 240;
const FADE_MS = 1000;

@Directive({
  selector: 'img[appBlueprint]',
  standalone: true
})
export class BlueprintRevealDirective implements OnInit, OnDestroy {
  /** Hoãn trước khi chạy, để cả lưới hiện lệch nhau thay vì dồn một lúc. */
  @Input() blueprintDelay = 0;

  /** Đặt false để tắt hiệu ứng cho riêng một ảnh mà không phải sửa template. */
  @Input() appBlueprint: boolean | '' = '';

  private readonly host: ElementRef<HTMLImageElement> = inject(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly document = inject(DOCUMENT);

  private canvas?: HTMLCanvasElement;
  private observer?: IntersectionObserver;
  private frameId = 0;
  private timerId?: ReturnType<typeof setTimeout>;
  private started = false;

  ngOnInit(): void {
    if (this.appBlueprint === false || !this.isSupported()) {
      return;
    }

    // Chờ ảnh lọt vào tầm nhìn mới chạy: thẻ dưới màn hình không cần tính toán.
    this.zone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(entries => {
        if (!entries.some(e => e.isIntersecting) || this.started) {
          return;
        }
        this.started = true;
        this.observer?.disconnect();
        this.timerId = setTimeout(() => this.whenDecoded(), this.blueprintDelay);
      }, { threshold: 0.25 });

      this.observer.observe(this.host.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    cancelAnimationFrame(this.frameId);
    if (this.timerId) {
      clearTimeout(this.timerId);
    }
    this.canvas?.remove();
    this.host.nativeElement.style.opacity = '';
  }

  // ------------------------------------------------------------ điều kiện ---

  private isSupported(): boolean {
    const win = this.document.defaultView;
    if (!win || typeof IntersectionObserver === 'undefined') {
      return false;
    }
    // Người dùng đã yêu cầu giảm chuyển động, hoặc đang bật tiết kiệm dữ liệu.
    if (win.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
    const conn = (win.navigator as any).connection;
    if (conn?.saveData) {
      return false;
    }
    // Máy yếu thì bỏ qua, ảnh hiện thẳng.
    return (win.navigator.hardwareConcurrency ?? 4) >= 4;
  }

  private whenDecoded(): void {
    const img = this.host.nativeElement;

    if (img.complete && img.naturalWidth > 0) {
      this.run();
      return;
    }
    img.addEventListener('load', () => this.run(), { once: true });
  }

  // -------------------------------------------------------------- xử lý ---

  private run(): void {
    const img = this.host.nativeElement;
    const parent = img.parentElement;
    const box = img.getBoundingClientRect();

    if (!parent || box.width < 120 || box.height < 90) {
      return;
    }

    let lineLayer: HTMLCanvasElement;
    try {
      lineLayer = this.buildLineLayer(img, box);
    } catch {
      // Canvas bị "tainted" vì ảnh khác domain và thiếu CORS — bỏ hiệu ứng,
      // hiện ảnh như bình thường thay vì để trống.
      return;
    }

    const canvas = this.document.createElement('canvas');
    canvas.width = lineLayer.width;
    canvas.height = lineLayer.height;
    Object.assign(canvas.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      zIndex: '2',
      pointerEvents: 'none'
    } as CSSStyleDeclaration);

    // Container phải có position để canvas phủ đúng lên ảnh.
    if (getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }
    parent.appendChild(canvas);
    this.canvas = canvas;

    img.style.opacity = '0';
    this.animate(canvas, lineLayer);
  }

  /** Dò biên ở kích thước rút gọn rồi dựng lớp nét màu đồng trên nền trong suốt. */
  private buildLineLayer(img: HTMLImageElement, box: DOMRect): HTMLCanvasElement {
    const w = ANALYSIS_WIDTH;
    const h = Math.max(1, Math.round(w * box.height / box.width));

    const work = this.document.createElement('canvas');
    work.width = w;
    work.height = h;
    const ctx = work.getContext('2d', { willReadFrequently: true })!;

    // Tái tạo đúng phần ảnh mà object-fit: cover đang hiển thị, để nét trùng khít.
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.filter = `blur(${PRE_BLUR_PX}px)`;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    ctx.filter = 'none';

    const edges = sobel(ctx.getImageData(0, 0, w, h).data, w, h);

    const layer = this.document.createElement('canvas');
    layer.width = w;
    layer.height = h;
    layer.getContext('2d')!.putImageData(toCopperLines(edges, w, h), 0, 0);
    return layer;
  }

  /** Nét hiện dần theo lằn quét, giữ một nhịp, rồi ảnh thật nổi lên. */
  private animate(canvas: HTMLCanvasElement, lines: HTMLCanvasElement): void {
    const img = this.host.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const { width: W, height: H } = canvas;
    const total = DRAW_MS + HOLD_MS + FADE_MS;
    let start = 0;

    const frame = (now: number) => {
      if (!start) start = now;
      const t = now - start;
      ctx.clearRect(0, 0, W, H);

      if (t < DRAW_MS) {
        const p = t / DRAW_MS;
        const edge = p * W * 1.16;

        ctx.save();
        ctx.drawImage(lines, 0, 0);
        // Cắt bỏ phần chưa tới lượt lằn quét
        ctx.globalCompositeOperation = 'destination-in';
        const grad = ctx.createLinearGradient(edge - W * 0.16, 0, edge, 0);
        grad.addColorStop(0, 'rgba(0,0,0,1)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();

        // Vạch quét
        const x = Math.min(edge, W);
        ctx.fillStyle = 'rgba(224,149,67,.85)';
        ctx.fillRect(x - 1.5, 0, 1.5, H);
        ctx.fillStyle = 'rgba(224,149,67,.10)';
        ctx.fillRect(x - 26, 0, 26, H);
      } else if (t < DRAW_MS + HOLD_MS) {
        ctx.drawImage(lines, 0, 0);
      } else {
        const p = Math.min(1, (t - DRAW_MS - HOLD_MS) / FADE_MS);
        const eased = 1 - Math.pow(1 - p, 3);
        img.style.opacity = String(eased);
        ctx.globalAlpha = 1 - eased;
        ctx.drawImage(lines, 0, 0);
        ctx.globalAlpha = 1;
      }

      if (t < total) {
        this.frameId = requestAnimationFrame(frame);
      } else {
        img.style.opacity = '';
        canvas.remove();
        this.canvas = undefined;
      }
    };

    this.zone.runOutsideAngular(() => {
      this.frameId = requestAnimationFrame(frame);
    });
  }
}

/** Sobel: tìm chỗ độ sáng đổi đột ngột — mép tường, mép mái, khung cửa. */
function sobel(data: Uint8ClampedArray, w: number, h: number): Uint8ClampedArray {
  const gray = new Float32Array(w * h);
  for (let i = 0, n = w * h; i < n; i++) {
    const p = i * 4;
    gray[i] = data[p] * 0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114;
  }

  const out = new Uint8ClampedArray(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = -gray[i - w - 1] - 2 * gray[i - 1] - gray[i + w - 1]
               + gray[i - w + 1] + 2 * gray[i + 1] + gray[i + w + 1];
      const gy = -gray[i - w - 1] - 2 * gray[i - w] - gray[i - w + 1]
               + gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1];
      const mag = Math.sqrt(gx * gx + gy * gy);
      out[i] = mag > EDGE_THRESHOLD ? Math.min(255, mag * EDGE_GAIN) : 0;
    }
  }
  return out;
}

/** Bản đồ biên → nét màu đồng ngả trắng trên nền trong suốt. */
function toCopperLines(edges: Uint8ClampedArray, w: number, h: number): ImageData {
  const img = new ImageData(w, h);
  const d = img.data;
  for (let i = 0, n = w * h; i < n; i++) {
    const e = edges[i];
    if (!e) continue;
    const t = e / 255;
    const p = i * 4;
    d[p] = 255;
    d[p + 1] = 210 + t * 45;
    d[p + 2] = 160 + t * 80;
    d[p + 3] = Math.min(255, 90 + t * 165);
  }
  return img;
}
