import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DataService } from '../../services/data.service';

/** Chờ tối thiểu giữa hai lần gửi, chặn bấm liên tục và bot đơn giản. */
const RESUBMIT_COOLDOWN_MS = 30_000;
const FEEDBACK_TIMEOUT_MS = 8_000;

/**
 * Bỏ mọi ký tự không phải số và quy `+84` về `0`.
 * Người Việt gõ số điện thoại theo rất nhiều kiểu: "0912 345 678",
 * "0912.345.678", "+84 912 345 678".
 */
export function normalizePhone(raw: string): string {
  const digitsOnly = (raw || '').replace(/[^\d+]/g, '');
  if (digitsOnly.startsWith('+84')) {
    return `0${digitsOnly.slice(3)}`;
  }
  if (digitsOnly.startsWith('84') && digitsOnly.length >= 11) {
    return `0${digitsOnly.slice(2)}`;
  }
  return digitsOnly.replace(/\+/g, '');
}

/**
 * Kiểm tra số điện thoại SAU khi chuẩn hoá.
 *
 * Regex cũ `^[0-9]{10,11}$` chạy thẳng trên chuỗi người dùng gõ, nên từ chối cả
 * những số hoàn toàn hợp lệ chỉ vì có dấu cách hay dấu chấm.
 */
export function vietnamesePhoneValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value || '').trim();
  if (!value) {
    return null; // Validators.required lo phần bắt buộc
  }
  return /^0\d{9,10}$/.test(normalizePhone(value)) ? null : { phone: true };
}

@Component({
  selector: 'app-consultation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './consultation-form.component.html',
  styleUrls: ['./consultation-form.component.scss']
})
export class ConsultationFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dataService = inject(DataService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('feedback') feedbackRef?: ElementRef<HTMLElement>;

  consultationForm!: FormGroup;
  isSubmitting = false;
  submitSuccess = false;
  submitError: string | null = null;

  private lastSubmitAt = 0;
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.consultationForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, vietnamesePhoneValidator]],
      email: ['', [Validators.email]],
      details: [''],
      // Honeypot: người thật không thấy ô này, bot điền tự động thì lộ.
      website: ['']
    });

    this.destroyRef.onDestroy(() => this.clearFeedbackTimer());
  }

  get nameControl() { return this.consultationForm.get('name')!; }
  get phoneControl() { return this.consultationForm.get('phone')!; }
  get emailControl() { return this.consultationForm.get('email')!; }

  showError(controlName: string): boolean {
    const control = this.consultationForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  onSubmit(): void {
    if (this.isSubmitting) {
      return;
    }

    // Nút submit không còn bị disable khi form chưa hợp lệ: người dùng bấm được
    // và thấy ngay chỗ nào sai, thay vì đối diện một nút xám không giải thích.
    if (this.consultationForm.invalid) {
      this.consultationForm.markAllAsTouched();
      this.focusFirstInvalid();
      this.cdr.markForCheck();
      return;
    }

    if (this.consultationForm.value.website) {
      // Bot điền honeypot: giả vờ thành công, không gửi lên server.
      this.showSuccess();
      return;
    }

    const now = Date.now();
    if (now - this.lastSubmitAt < RESUBMIT_COOLDOWN_MS) {
      this.submitError = 'Bạn vừa gửi yêu cầu. Vui lòng đợi ít phút trước khi gửi tiếp.';
      this.scheduleFeedbackReset();
      this.cdr.markForCheck();
      return;
    }

    this.isSubmitting = true;
    this.submitSuccess = false;
    this.submitError = null;

    const { name, phone, email, details } = this.consultationForm.value;

    this.dataService.createConsultation({
      name: name.trim(),
      phone: normalizePhone(phone),
      email: email?.trim() || undefined,
      details: details?.trim() || undefined
    }).subscribe({
      next: () => {
        this.lastSubmitAt = Date.now();
        this.isSubmitting = false;
        this.showSuccess();
      },
      error: () => {
        this.isSubmitting = false;
        this.submitError = 'Không gửi được. Vui lòng thử lại hoặc gọi trực tiếp cho chúng tôi.';
        this.scheduleFeedbackReset();
        this.revealFeedback();
        this.cdr.markForCheck();
      }
    });
  }

  private showSuccess(): void {
    this.submitSuccess = true;
    this.consultationForm.reset();
    this.scheduleFeedbackReset();
    this.revealFeedback();
    this.cdr.markForCheck();
  }

  /** Form khá dài; trên điện thoại thông báo có thể nằm ngoài khung nhìn. */
  private revealFeedback(): void {
    setTimeout(() => {
      this.feedbackRef?.nativeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  private focusFirstInvalid(): void {
    const firstInvalid = Object.keys(this.consultationForm.controls)
      .find(key => this.consultationForm.get(key)?.invalid);

    if (firstInvalid) {
      setTimeout(() => {
        document.getElementById(firstInvalid)?.focus();
      });
    }
  }

  private scheduleFeedbackReset(): void {
    this.clearFeedbackTimer();
    this.feedbackTimer = setTimeout(() => {
      this.submitSuccess = false;
      this.submitError = null;
      this.cdr.markForCheck();
    }, FEEDBACK_TIMEOUT_MS);
  }

  private clearFeedbackTimer(): void {
    if (this.feedbackTimer) {
      clearTimeout(this.feedbackTimer);
      this.feedbackTimer = null;
    }
  }
}
