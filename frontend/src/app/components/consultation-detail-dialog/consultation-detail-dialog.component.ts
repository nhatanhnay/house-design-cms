import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatRadioModule } from '@angular/material/radio';
import { Consultation } from '../../models/models';

export interface ConsultationDetailDialogData {
  consultation: Consultation;
}

export interface ConsultationDetailDialogResult {
  action: 'save' | 'delete' | 'cancel';
  status?: string;
}

@Component({
  selector: 'app-consultation-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatRadioModule
  ],
  templateUrl: './consultation-detail-dialog.component.html',
  styleUrls: ['./consultation-detail-dialog.component.scss']
})
export class ConsultationDetailDialogComponent {
  selectedStatus: string;

  constructor(
    public dialogRef: MatDialogRef<ConsultationDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConsultationDetailDialogData
  ) {
    this.selectedStatus = data.consultation.status;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Chưa xử lý',
      'contacted': 'Đã liên hệ',
      'completed': 'Hoàn thành'
    };
    return labels[status] || status;
  }

  onSave(): void {
    const result: ConsultationDetailDialogResult = {
      action: 'save',
      status: this.selectedStatus
    };
    this.dialogRef.close(result);
  }

  onDelete(): void {
    if (confirm('Bạn có chắc chắn muốn xóa yêu cầu tư vấn này?')) {
      const result: ConsultationDetailDialogResult = {
        action: 'delete'
      };
      this.dialogRef.close(result);
    }
  }
}
