import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DataService } from '../../services/data.service';
import { GlobalSEOSettings } from '../../models/models';

@Component({
  selector: 'app-global-seo-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    MatTabsModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="seo-settings-container">
      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>settings</mat-icon>
          <mat-card-title>Global SEO Settings</mat-card-title>
          <mat-card-subtitle>Configure default SEO settings for your website</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="seoForm" (ngSubmit)="onSubmit()">

            <mat-tab-group>
              <!-- Basic SEO Tab -->
              <mat-tab label="Basic SEO">
                <div class="tab-content">
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Site Name</mat-label>
                      <input matInput formControlName="site_name" placeholder="Your website name">
                      <mat-hint>Used in title tags and social sharing</mat-hint>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Default Meta Title</mat-label>
                      <input matInput formControlName="default_meta_title"
                             placeholder="Default title for pages without custom titles">
                      <mat-hint>{{ getTitleLength() }}/60 characters</mat-hint>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Default Meta Description</mat-label>
                      <textarea matInput formControlName="default_meta_description"
                                rows="3" placeholder="Default description for your website"></textarea>
                      <mat-hint>{{ getDescriptionLength() }}/160 characters</mat-hint>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Default Open Graph Image URL</mat-label>
                      <input matInput formControlName="default_og_image_url"
                             placeholder="Default image for social sharing">
                      <button mat-icon-button matSuffix type="button" 
                              (click)="uploadOgImage()" 
                              matTooltip="Upload Image">
                        <mat-icon>upload</mat-icon>
                      </button>
                      <mat-hint>Recommended size: 1200x630px</mat-hint>
                    </mat-form-field>
                  </div>

                  <!-- OG Image Preview -->
                  <div class="form-row" *ngIf="seoForm.get('default_og_image_url')?.value">
                    <div class="og-image-preview">
                      <img [src]="seoForm.get('default_og_image_url')?.value" 
                           alt="OG Image Preview"
                           (error)="onOgImageError($event)">
                    </div>
                  </div>
                </div>
              </mat-tab>

              <!-- Social Media Tab -->
              <mat-tab label="Social Media">
                <div class="tab-content">
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Facebook App ID</mat-label>
                      <input matInput formControlName="facebook_app_id"
                             placeholder="Your Facebook App ID">
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Twitter Handle</mat-label>
                      <input matInput formControlName="twitter_handle"
                             placeholder="@yourusername">
                    </mat-form-field>
                  </div>
                </div>
              </mat-tab>

              <!-- Analytics Tab -->
              <mat-tab label="Analytics">
                <div class="tab-content">
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Google Analytics ID</mat-label>
                      <input matInput formControlName="google_analytics_id"
                             placeholder="GA-XXXXXXXX-X">
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Google Search Console ID</mat-label>
                      <input matInput formControlName="google_search_console_id"
                             placeholder="Your Search Console verification ID">
                    </mat-form-field>
                  </div>
                </div>
              </mat-tab>

              <!-- Business Info Tab -->
              <mat-tab label="Business Info">
                <div class="tab-content">
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Company Name</mat-label>
                      <input matInput formControlName="company_name"
                             placeholder="Your company name">
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Company Description</mat-label>
                      <textarea matInput formControlName="company_description"
                                rows="3" placeholder="Brief description of your company"></textarea>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Company Address</mat-label>
                      <textarea matInput formControlName="company_address"
                                rows="2" placeholder="Full business address"></textarea>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="half-width">
                      <mat-label>Phone Number</mat-label>
                      <input matInput formControlName="company_phone"
                             placeholder="+84 xxx xxx xxx">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="half-width">
                      <mat-label>Email Address</mat-label>
                      <input matInput formControlName="company_email"
                             placeholder="info@yourcompany.com">
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="half-width">
                      <mat-label>Company Logo URL</mat-label>
                      <input matInput formControlName="company_logo_url"
                             placeholder="URL to your company logo">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="half-width">
                      <mat-label>Business Hours</mat-label>
                      <input matInput formControlName="business_hours"
                             placeholder="Mo-Fr 08:00-17:00, Sa 08:00-12:00">
                    </mat-form-field>
                  </div>
                </div>
              </mat-tab>
            </mat-tab-group>

          </form>
        </mat-card-content>

        <mat-card-actions align="end">
          <button mat-button type="button" (click)="onReset()">Reset</button>
          <button mat-raised-button color="primary" (click)="onSubmit()"
                  [disabled]="seoForm.invalid || isLoading">
            {{ isLoading ? 'Saving...' : 'Save Settings' }}
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styleUrls: ['./global-seo-settings.component.scss']
})
export class GlobalSeoSettingsComponent implements OnInit {
  seoForm: FormGroup;
  isLoading = false;
  settings: GlobalSEOSettings | null = null;

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private snackBar: MatSnackBar
  ) {
    this.seoForm = this.fb.group({
      site_name: ['', [Validators.required]],
      default_meta_title: ['', [Validators.required, Validators.maxLength(60)]],
      default_meta_description: ['', [Validators.required, Validators.maxLength(160)]],
      default_og_image_url: [''],
      google_analytics_id: [''],
      google_search_console_id: [''],
      facebook_app_id: [''],
      twitter_handle: [''],
      company_name: ['', [Validators.required]],
      company_description: [''],
      company_address: [''],
      company_phone: [''],
      company_email: ['', [Validators.email]],
      company_logo_url: [''],
      business_hours: ['']
    });
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading = true;
    this.dataService.getGlobalSEOSettings().subscribe({
      next: (settings) => {
        this.settings = settings;
        this.seoForm.patchValue(settings);
        this.isLoading = false;
      },
      error: (error) => {
        this.snackBar.open('Error loading SEO settings', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.seoForm.valid) {
      this.isLoading = true;
      const formData = {
        ...this.seoForm.value,
        id: this.settings?.id || 0
      };

      this.dataService.updateGlobalSEOSettings(formData).subscribe({
        next: (settings) => {
          this.settings = settings;
          this.seoForm.patchValue(settings);
          this.snackBar.open('SEO settings saved successfully!', 'Close', { duration: 3000 });
          this.isLoading = false;
        },
        error: (error) => {
          this.snackBar.open('Error saving SEO settings', 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
    } else {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
    }
  }

  onReset(): void {
    this.seoForm.reset();
    if (this.settings) {
      this.seoForm.patchValue(this.settings);
    }
  }

  getTitleLength(): number {
    return this.seoForm.get('default_meta_title')?.value?.length || 0;
  }

  getDescriptionLength(): number {
    return this.seoForm.get('default_meta_description')?.value?.length || 0;
  }

  uploadOgImage(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/jpg,image/webp';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.handleOgImageUpload(file);
      }
    };
    input.click();
  }

  handleOgImageUpload(file: File): void {
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      this.snackBar.open('Image size must be less than 2MB', 'Close', { duration: 3000 });
      return;
    }

    // Validate file type
    if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/)) {
      this.snackBar.open('Only PNG, JPG, and WEBP images are allowed', 'Close', { duration: 3000 });
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    this.dataService.uploadOGImage(formData).subscribe({
      next: (response: any) => {
        this.seoForm.patchValue({
          default_og_image_url: response.url
        });
        this.snackBar.open('OG Image uploaded successfully!', 'Close', { duration: 3000 });
      },
      error: (_error: any) => {
        this.snackBar.open('Error uploading OG image', 'Close', { duration: 3000 });
      }
    });
  }

  onOgImageError(event: any): void {
    event.target.style.display = 'none';
  }
}