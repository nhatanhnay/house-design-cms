import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { HomeContent, ProcessTab } from '../../models/models';
import { DataService } from '../../services/data.service';
import { LoggerService } from '../../services/logger.service';

@Component({
  selector: 'home-content-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    FormsModule
  ],
  templateUrl: './home-content-edit-dialog.component.html'
})
export class HomeContentEditDialog {
  private readonly logger = inject(LoggerService);
  processTabs: ProcessTab[] = [];
  processTabsJson: string = '';
  uploadingStepIcon: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<HomeContentEditDialog>,
    @Inject(MAT_DIALOG_DATA) public data: HomeContent,
    private dataService: DataService
  ) {
    // Parse process tabs from JSON string
    this.parseProcessTabs();
  }

  // SEO Helper Methods
  getMetaTitleLength(): number {
    const metaTitle = this.data.meta_title || '';
    const heroTitle = this.data.hero_title || '';
    return (metaTitle || heroTitle).length;
  }

  getMetaDescriptionLength(): number {
    const metaDescription = this.data.meta_description || '';
    return metaDescription.length;
  }

  // Process Tabs Methods
  parseProcessTabs(): void {
    if (this.data.process_tabs) {
      try {
        this.processTabs = JSON.parse(this.data.process_tabs);
        this.processTabsJson = JSON.stringify(this.processTabs, null, 2);
      } catch (error) {
        this.logger.error('Error parsing process tabs', error, 'HomeContentDialog');
        this.processTabs = this.getDefaultProcessTabs();
        this.processTabsJson = JSON.stringify(this.processTabs, null, 2);
      }
    } else {
      this.processTabs = this.getDefaultProcessTabs();
      this.processTabsJson = JSON.stringify(this.processTabs, null, 2);
    }
  }

  getDefaultProcessTabs(): ProcessTab[] {
    return [
      {
        tab_id: 'design',
        tab_name: 'Quy Trình Thiết Kế',
        steps: [
          {
            icon_url: '/uploads/svg-icons/process-1.png',
            title: 'TRAO ĐỔI TƯ VẤN',
            description: 'Trao đổi yêu cầu, tư vấn định hướng ý tưởng, phong cách và mức đầu tư'
          },
          {
            icon_url: '/uploads/svg-icons/process-2.png',
            title: 'BÁO GIÁ THIẾT KẾ',
            description: 'Gửi khách hàng báo giá theo đúng gói thiết kế mà Khách Hàng đang đề cập, kèm quy trình làm việc cụ thể, chi tiết'
          },
          {
            icon_url: '/uploads/svg-icons/process-3.png',
            title: 'KÝ HĐ THIẾT KẾ',
            description: 'Thực hiện các thủ tục hành chính và bắt đầu triển khai các công việc theo tiến độ thống nhất'
          },
          {
            icon_url: '/uploads/svg-icons/process-4.png',
            title: 'BÀN GIAO BẢN VẼ THIẾT KẾ',
            description: 'Sau khi thống nhất hồ sơ báo cáo tiến độ, khách hàng thanh toán lần cuối giá trị HĐ còn lại trước khi nhận hồ sơ hoàn chỉnh.'
          }
        ]
      },
      {
        tab_id: 'construction',
        tab_name: 'Quy Trình Thi Công',
        steps: [
          {
            icon_url: '/uploads/svg-icons/process-1.png',
            title: 'TRAO ĐỔI TƯ VẤN',
            description: 'Trao đổi và tư vấn khách hàng về nhu cầu, mong muốn, và định hướng mức đầu tư.'
          },
          {
            icon_url: '/uploads/svg-icons/process-2.png',
            title: 'BÁO GIÁ THI CÔNG',
            description: 'Gửi báo giá thi công, chủng loại vật tư và Quy trình thi công để khách hàng nắm được thông tin.'
          },
          {
            icon_url: '/uploads/svg-icons/process-5.png',
            title: 'KÝ HĐ THI CÔNG',
            description: 'Hai bên gặp gỡ trao đổi thống nhất các vấn đề liên quan tiến độ, chất lượng, ngày khởi công và các điều khoản hợp đồng.'
          },
          {
            icon_url: '/uploads/svg-icons/process-6.png',
            title: 'BÀN GIAO & QUYẾT TOÁN',
            description: 'Kiểm tra, nghiệm thu và thanh quyết toán hợp đồng. Tiến hành bảo hành bảo trì dài hạn theo cam kết hợp đồng.'
          }
        ]
      }
    ];
  }

  updateProcessTabsFromJson(): void {
    try {
      this.processTabs = JSON.parse(this.processTabsJson);
      this.data.process_tabs = this.processTabsJson;
    } catch (error) {
      alert('JSON không hợp lệ. Vui lòng kiểm tra lại cú pháp.');
    }
  }

  addProcessTab(): void {
    this.processTabs.push({
      tab_id: 'new-tab-' + Date.now(),
      tab_name: 'Tab mới',
      steps: []
    });
    this.processTabsJson = JSON.stringify(this.processTabs, null, 2);
    this.data.process_tabs = this.processTabsJson;
  }

  removeProcessTab(index: number): void {
    this.processTabs.splice(index, 1);
    this.processTabsJson = JSON.stringify(this.processTabs, null, 2);
    this.data.process_tabs = this.processTabsJson;
  }

  addStep(tabIndex: number): void {
    this.processTabs[tabIndex].steps.push({
      icon_url: '/uploads/svg-icons/default-icon.png',
      title: 'Bước mới',
      description: 'Mô tả bước'
    });
    this.processTabsJson = JSON.stringify(this.processTabs, null, 2);
    this.data.process_tabs = this.processTabsJson;
  }

  removeStep(tabIndex: number, stepIndex: number): void {
    this.processTabs[tabIndex].steps.splice(stepIndex, 1);
    this.processTabsJson = JSON.stringify(this.processTabs, null, 2);
    this.data.process_tabs = this.processTabsJson;
  }

  updateProcessTabsModel(): void {
    this.processTabsJson = JSON.stringify(this.processTabs, null, 2);
    this.data.process_tabs = this.processTabsJson;
  }

  // Icon upload methods
  uploadStepIcon(tabIndex: number, stepIndex: number): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.svg';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.uploadingStepIcon = true;
        const formData = new FormData();
        formData.append('icon', file);

        this.dataService.uploadSvgIcon(formData).subscribe({
          next: (response) => {
            this.processTabs[tabIndex].steps[stepIndex].icon_url = response.url;
            this.updateProcessTabsModel();
            this.uploadingStepIcon = false;
          },
          error: (error) => {
            this.logger.error('Error uploading icon', error, 'HomeContentDialog');
            alert('Lỗi khi upload icon. Vui lòng thử lại.');
            this.uploadingStepIcon = false;
          }
        });
      }
    };
    input.click();
  }

  selectExistingIcon(tabIndex: number, stepIndex: number): void {
    // For now, show prompt to enter existing icon path
    // In the future, this can be enhanced with a file browser dialog
    const iconPath = prompt('Nhập đường dẫn icon (ví dụ: /uploads/svg-icons/process-1.png):');
    if (iconPath) {
      this.processTabs[tabIndex].steps[stepIndex].icon_url = iconPath;
      this.updateProcessTabsModel();
    }
  }

  onIconError(event: any, tabIndex: number, stepIndex: number): void {
    // Hide broken image and show placeholder
    event.target.style.display = 'none';
    this.logger.warn(`Icon not found: ${this.processTabs[tabIndex].steps[stepIndex].icon_url}`, 'HomeContentDialog');
  }
}