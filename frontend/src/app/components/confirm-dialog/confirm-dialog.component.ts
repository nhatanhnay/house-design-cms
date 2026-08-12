import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  /** Câu hỏi ngắn, ví dụ 'Xoá bài viết?' */
  title: string;
  /** Tên đối tượng bị tác động — hiện nổi bật để người dùng đối chiếu trước khi xác nhận. */
  subject?: string;
  /** Giải thích hệ quả, nhất là khi không hoàn tác được. */
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** true = hành động phá huỷ, nút xác nhận chuyển sang màu cảnh báo. */
  destructive?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title class="confirm-title">
      <mat-icon *ngIf="data.destructive" class="warn-icon">warning_amber</mat-icon>
      {{ data.title }}
    </h2>

    <mat-dialog-content>
      <p class="subject" *ngIf="data.subject">{{ data.subject }}</p>
      <p class="message" *ngIf="data.message">{{ data.message }}</p>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(false)">
        {{ data.cancelLabel || 'Huỷ' }}
      </button>
      <button
        mat-raised-button
        cdkFocusInitial
        [color]="data.destructive ? 'warn' : 'primary'"
        (click)="dialogRef.close(true)">
        {{ data.confirmLabel || 'Xác nhận' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .confirm-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.15rem;
      font-weight: 600;
    }

    .warn-icon {
      color: #d32f2f;
    }

    .subject {
      font-weight: 600;
      font-size: 1rem;
      margin: 0 0 8px;
      overflow-wrap: anywhere;
    }

    .message {
      margin: 0;
      color: rgba(0, 0, 0, 0.6);
      line-height: 1.6;
    }

    mat-dialog-actions {
      gap: 8px;
      padding-top: 8px;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}
