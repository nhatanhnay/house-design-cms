import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DataService } from '../../services/data.service';

export interface IconOption {
  name: string;
  type: 'material' | 'svg';
  value: string; // icon name for material, URL for SVG
  svg?: string; // SVG content for preview
}

@Component({
  selector: 'app-icon-selector-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTabsModule,
    MatGridListModule,
    MatTooltipModule
  ],
  template: `
    <div class="icon-selector-dialog">
      <h2 mat-dialog-title>Select Icon</h2>

      <mat-dialog-content>
        <mat-tab-group>
          <!-- Material Icons Tab -->
          <mat-tab label="Material Icons">
            <div class="material-icons-grid">
              <div class="icon-search">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Search icons...</mat-label>
                  <input matInput [(ngModel)]="searchTerm" (ngModelChange)="filterIcons()">
                </mat-form-field>
              </div>

              <div class="icons-container">
                <button
                  mat-raised-button
                  *ngFor="let icon of filteredMaterialIcons"
                  class="icon-button"
                  [class.selected]="selectedIcon?.value === icon"
                  (click)="selectMaterialIcon(icon)"
                  [matTooltip]="icon">
                  <mat-icon>{{ icon }}</mat-icon>
                  <span class="icon-name">{{ icon }}</span>
                </button>
              </div>
            </div>
          </mat-tab>

          <!-- Custom SVG Upload Tab -->
          <mat-tab label="Upload SVG">
            <div class="svg-upload-section">
              <p>Upload a custom SVG icon:</p>

              <input
                type="file"
                accept=".svg"
                (change)="onSvgFileSelected($event)"
                #fileInput
                style="display: none;">

              <button mat-raised-button color="primary" (click)="fileInput.click()">
                <mat-icon>upload_file</mat-icon>
                Choose SVG File
              </button>

              <div *ngIf="selectedSvgFile" class="svg-preview">
                <p>Selected: {{ selectedSvgFile.name }}</p>
                <div class="svg-preview-container" [innerHTML]="getSafeSvg(svgPreview)"></div>
                <button mat-raised-button color="accent" (click)="uploadSvg()">
                  <mat-icon>cloud_upload</mat-icon>
                  Upload & Use This Icon
                </button>
              </div>
            </div>
          </mat-tab>

          <!-- Previously Uploaded SVGs Tab -->
          <mat-tab label="My SVG Icons">
            <div class="custom-icons-grid">
              <div class="icons-container">
                <button
                  mat-raised-button
                  *ngFor="let customIcon of customSvgIcons"
                  class="icon-button custom-svg-button"
                  [class.selected]="selectedIcon?.value === customIcon.url"
                  (click)="selectCustomIcon(customIcon)"
                  [matTooltip]="customIcon.name">
                  <div class="custom-icon-preview" [innerHTML]="getSafeSvg(customIcon.svg)"></div>
                  <span class="icon-name">{{ customIcon.name }}</span>
                </button>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>

        <!-- Selected Icon Preview -->
        <div class="selected-preview" *ngIf="selectedIcon">
          <h3>Selected Icon:</h3>
          <div class="preview-container">
            <mat-icon *ngIf="selectedIcon.type === 'material'">{{ selectedIcon.value }}</mat-icon>
            <div *ngIf="selectedIcon.type === 'svg'" [innerHTML]="getSafeSvg(selectedIcon.svg || '')" class="svg-preview-selected"></div>
            <span>{{ selectedIcon.name }}</span>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions>
        <button mat-button (click)="cancel()">Cancel</button>
        <button mat-raised-button color="primary" (click)="confirm()" [disabled]="!selectedIcon">
          Use This Icon
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .icon-selector-dialog {
      min-width: 600px;
      max-width: 800px;
    }

    .material-icons-grid, .custom-icons-grid {
      padding: 16px;
    }

    .icon-search {
      margin-bottom: 16px;
    }

    .icons-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
      max-height: 400px;
      overflow-y: auto;
    }

    .icon-button {
      display: flex !important;
      flex-direction: column;
      align-items: center;
      padding: 12px !important;
      min-height: 80px;
      border: 2px solid transparent;
    }

    .icon-button:hover {
      background-color: rgba(0,0,0,0.1);
    }

    .icon-button.selected {
      border-color: #1976d2;
      background-color: rgba(25, 118, 210, 0.1);
    }

    .icon-name {
      font-size: 10px;
      margin-top: 4px;
      text-align: center;
      word-break: break-word;
    }

    .svg-upload-section {
      padding: 16px;
      text-align: center;
    }

    .svg-preview {
      margin-top: 16px;
      padding: 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .svg-preview-container, .custom-icon-preview, .svg-preview-selected {
      width: 40px;
      height: 40px;
      margin: 8px auto;
    }

    .svg-preview-container svg, .custom-icon-preview svg, .svg-preview-selected svg {
      width: 100%;
      height: 100%;
    }

    .selected-preview {
      margin-top: 16px;
      padding: 16px;
      background-color: rgba(0,0,0,0.05);
      border-radius: 4px;
    }

    .preview-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .full-width {
      width: 100%;
    }

    .custom-svg-button {
      position: relative;
    }
  `]
})
export class IconSelectorDialog implements OnInit {
  @Input() currentIcon?: string;

  searchTerm = '';
  selectedIcon?: IconOption;
  selectedSvgFile?: File;
  svgPreview = '';

  // Common Material Icons for features
  materialIcons = [
    'architecture', 'engineering', 'business', 'verified', 'design_services',
    'build', 'handshake', 'star', 'check_circle', 'workspace_premium',
    'construction', 'home_work', 'apartment', 'domain', 'foundation',
    'roofing', 'carpenter', 'plumbing', 'electrical_services', 'hvac',
    'security', 'shield', 'health_and_safety', 'support_agent', 'headset_mic',
    'phone', 'email', 'schedule', 'timer', 'speed', 'trending_up',
    'assessment', 'analytics', 'insights', 'lightbulb', 'innovation',
    'eco', 'energy_savings_leaf', 'recycling', 'solar_power', 'water_drop',
    'favorite', 'thumb_up', 'celebration', 'emoji_events', 'workspace_premium'
  ];

  filteredMaterialIcons = this.materialIcons;
  customSvgIcons: any[] = [];

  constructor(
    private dialogRef: MatDialogRef<IconSelectorDialog>,
    private dataService: DataService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    // Set current icon as selected if provided
    if (this.currentIcon) {
      if (this.currentIcon.startsWith('http') || this.currentIcon.startsWith('/')) {
        // Custom SVG icon
        this.selectedIcon = {
          name: 'Custom Icon',
          type: 'svg',
          value: this.currentIcon
        };
      } else {
        // Material icon
        this.selectedIcon = {
          name: this.currentIcon,
          type: 'material',
          value: this.currentIcon
        };
      }
    }

    // Load custom SVG icons
    this.loadCustomSvgIcons();
  }

  filterIcons() {
    if (!this.searchTerm) {
      this.filteredMaterialIcons = this.materialIcons;
    } else {
      this.filteredMaterialIcons = this.materialIcons.filter(icon =>
        icon.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  selectMaterialIcon(iconName: string) {
    this.selectedIcon = {
      name: iconName,
      type: 'material',
      value: iconName
    };
  }

  selectCustomIcon(customIcon: any) {
    this.selectedIcon = {
      name: customIcon.name,
      type: 'svg',
      value: customIcon.url,
      svg: customIcon.svg
    };
  }

  onSvgFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'image/svg+xml') {
      this.selectedSvgFile = file;

      // Preview the SVG
      const reader = new FileReader();
      reader.onload = (e) => {
        this.svgPreview = e.target?.result as string;
      };
      reader.readAsText(file);
    }
  }

  uploadSvg() {
    if (!this.selectedSvgFile || !this.svgPreview) {
      return;
    }

    const formData = new FormData();
    formData.append('svg', this.selectedSvgFile);


    this.dataService.uploadSvgIcon(formData).subscribe({
      next: (response: any) => {
        this.selectedIcon = {
          name: this.selectedSvgFile!.name.replace('.svg', ''),
          type: 'svg',
          value: response.url,
          svg: response.svg || this.svgPreview
        };

        // Add to custom icons list
        this.customSvgIcons.push({
          name: this.selectedIcon.name,
          url: this.selectedIcon.value,
          svg: this.selectedIcon.svg
        });

      },
      error: (error) => {

        // For now, use local preview
        this.selectedIcon = {
          name: this.selectedSvgFile!.name.replace('.svg', ''),
          type: 'svg',
          value: 'data:image/svg+xml;base64,' + btoa(this.svgPreview),
          svg: this.svgPreview
        };

      }
    });
  }

  loadCustomSvgIcons() {
    // Load previously uploaded SVG icons
    // This would call a backend endpoint to get user's custom icons
    // For now, we'll implement it later
    this.customSvgIcons = [];
  }

  confirm() {
    this.dialogRef.close(this.selectedIcon);
  }

  cancel() {
    this.dialogRef.close();
  }

  getSafeSvg(svgContent: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svgContent);
  }
}

@Component({
  selector: 'app-icon-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule
  ],
  template: `
    <div class="icon-selector-container">
      <div class="current-icon-preview">
        <mat-icon *ngIf="isMatIconUrl(iconValue)">{{ iconValue }}</mat-icon>
        <div *ngIf="!isMatIconUrl(iconValue) && iconValue.startsWith('http')" class="svg-icon">
          <img [src]="iconValue" alt="Custom SVG" style="width: 24px; height: 24px;">
        </div>
        <div *ngIf="!isMatIconUrl(iconValue) && !iconValue.startsWith('http')" class="svg-icon" [innerHTML]="getSafeSvgContent()"></div>
        <span class="icon-label">{{ getIconLabel() }}</span>
      </div>

      <button mat-raised-button color="primary" (click)="openIconSelector()">
        <mat-icon>palette</mat-icon>
        Choose Icon
      </button>
    </div>
  `,
  styles: [`
    .icon-selector-container {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .current-icon-preview {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 120px;
    }

    .svg-icon {
      width: 24px;
      height: 24px;
    }

    .svg-icon svg {
      width: 100%;
      height: 100%;
    }

    .icon-label {
      font-size: 12px;
      color: #666;
    }
  `]
})
export class IconSelectorComponent {
  @Input() iconValue = '';
  @Output() iconChange = new EventEmitter<string>();

  constructor(private dialog: MatDialog, private sanitizer: DomSanitizer) {}

  openIconSelector() {
    const dialogRef = this.dialog.open(IconSelectorDialog, {
      width: '800px',
      data: { currentIcon: this.iconValue }
    });

    dialogRef.afterClosed().subscribe((result: IconOption) => {
      if (result) {
        this.iconValue = result.value;
        this.iconChange.emit(result.value);
      }
    });
  }

  isMatIconUrl(value: string): boolean {
    return !value.includes('/') && !value.includes('http') && !value.startsWith('<svg');
  }

  getSvgContent(): string {
    if (this.iconValue.startsWith('data:image/svg+xml')) {
      // Decode base64 SVG
      const base64 = this.iconValue.split(',')[1];
      return atob(base64);
    } else if (this.iconValue.startsWith('http') || this.iconValue.startsWith('/')) {
      // If it's a URL, we need to fetch the SVG content or return a placeholder
      // For now, return empty string to avoid showing the URL
      return '';
    }
    return this.iconValue;
  }

  getIconLabel(): string {
    if (this.isMatIconUrl(this.iconValue)) {
      return this.iconValue;
    } else if (this.iconValue.startsWith('http') || this.iconValue.startsWith('/')) {
      // Extract filename from URL for better label
      const filename = this.iconValue.split('/').pop() || 'Custom SVG';
      return filename.replace('.svg', '');
    }
    return 'Custom SVG';
  }

  getSafeSvgContent(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.getSvgContent());
  }
}