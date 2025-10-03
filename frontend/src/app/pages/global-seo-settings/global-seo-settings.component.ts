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
    MatDividerModule
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
                      <mat-hint>Recommended size: 1200x630px</mat-hint>
                    </mat-form-field>
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
}