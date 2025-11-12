import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Observable } from 'rxjs';
import { HttpEventType } from '@angular/common/http';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Category, Product, ProductImage } from '../../models/models';
import { CKEditorUploadAdapterPlugin } from '../../utils/ckeditor-upload-adapter';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-product-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressBarModule,
    CKEditorModule,
    DragDropModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.product ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="productForm" class="product-form">
        <!-- Title -->
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Tiêu đề</mat-label>
          <input matInput formControlName="title" placeholder="Nhập tiêu đề sản phẩm">
          <mat-error *ngIf="productForm.get('title')?.hasError('required')">
            Tiêu đề là bắt buộc
          </mat-error>
        </mat-form-field>

        <!-- Category -->
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Danh mục</mat-label>
          <mat-select formControlName="category_id">
            <mat-option *ngFor="let category of categories$ | async" [value]="category.id">
              {{ getCategoryDisplayName(category) }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="productForm.get('category_id')?.hasError('required')">
            Danh mục là bắt buộc
          </mat-error>
        </mat-form-field>


        <!-- Summary -->
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Tóm tắt</mat-label>
          <textarea matInput formControlName="summary" rows="3" placeholder="Nhập tóm tắt sản phẩm"></textarea>
        </mat-form-field>

        <!-- Thumbnail Image -->
        <div class="image-upload-field">
          <label class="upload-label">Hình ảnh thumbnail</label>
          <div class="upload-container">
            <input
              type="file"
              #fileInput
              accept="image/*"
              (change)="onImageSelect($event)"
              style="display: none">

            <div class="upload-area"
                 (click)="fileInput.click()"
                 [class.has-image]="selectedImageUrl">

              <div class="upload-content" *ngIf="!selectedImageUrl && !isUploadingImage">
                <mat-icon class="upload-icon">cloud_upload</mat-icon>
                <p>Nhấn để chọn hình ảnh thumbnail</p>
                <span class="upload-hint">PNG, JPG, GIF tối đa 5MB</span>
              </div>

              <div class="upload-loading" *ngIf="isUploadingImage">
                <div class="loading-spinner"></div>
                <p>Đang tải lên... {{featuredImageUploadProgress}}%</p>
                <mat-progress-bar mode="determinate" [value]="featuredImageUploadProgress"></mat-progress-bar>
              </div>

              <div class="image-preview" *ngIf="selectedImageUrl && !isUploadingImage">
                <img [src]="selectedImageUrl" [alt]="productForm.get('title')?.value || 'Preview'">
                <div class="image-overlay">
                  <button mat-icon-button type="button" (click)="removeImage($event)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Product Images Gallery -->
        <div class="gallery-section">
          <div class="gallery-header">
            <label class="upload-label">Gallery ảnh sản phẩm (như Shopee)</label>
            <button mat-raised-button type="button" color="primary" (click)="galleryInput.click()">
              <mat-icon>add_photo_alternate</mat-icon>
              Thêm ảnh
            </button>
          </div>
          <input
            type="file"
            #galleryInput
            accept="image/*"
            multiple
            (change)="onGalleryImagesSelect($event)"
            style="display: none">

          <div class="gallery-grid" cdkDropList (cdkDropListDropped)="onGalleryDrop($event)" *ngIf="galleryImages.length > 0">
            <div class="gallery-item" *ngFor="let img of galleryImages; let i = index" cdkDrag>
              <div class="drag-handle" cdkDragHandle>
                <mat-icon>drag_indicator</mat-icon>
              </div>
              <img [src]="img.url" [alt]="'Gallery ' + (i + 1)">
              <div class="gallery-overlay">
                <span class="image-order">{{ i + 1 }}</span>
                <button mat-icon-button type="button" (click)="removeGalleryImage(i)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </div>
          <div class="empty-gallery" *ngIf="galleryImages.length === 0">
            <mat-icon>photo_library</mat-icon>
            <p>Chưa có ảnh trong gallery</p>
          </div>
        </div>

        <!-- Content Editor -->
        <div class="editor-field">
          <label class="editor-label">Nội dung chi tiết</label>
          <ckeditor
            [editor]="Editor"
            formControlName="content"
            [config]="editorConfig">
          </ckeditor>
        </div>

        <!-- Published Checkbox -->
        <mat-checkbox formControlName="published" class="published-checkbox">
          Xuất bản ngay
        </mat-checkbox>

        <!-- SEO Section (Collapsible) -->
        <div class="seo-section">
          <h3 class="section-title" (click)="toggleSEO()">
            <mat-icon>{{ showSEO ? 'expand_less' : 'expand_more' }}</mat-icon>
            Tối ưu SEO (Tùy chọn)
          </h3>

          <div class="seo-fields" *ngIf="showSEO">
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Meta Title ({{ getMetaTitleLength() }}/60)</mat-label>
              <input matInput formControlName="meta_title" placeholder="Tiêu đề SEO">
              <mat-hint>Để trống sẽ dùng tiêu đề chính</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Meta Description ({{ getMetaDescriptionLength() }}/160)</mat-label>
              <textarea matInput formControlName="meta_description" rows="3" placeholder="Mô tả SEO"></textarea>
            </mat-form-field>

            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Focus Keywords</mat-label>
              <input matInput formControlName="focus_keywords" placeholder="từ khóa 1, từ khóa 2">
            </mat-form-field>

            <div class="slug-field">
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>URL Slug</mat-label>
                <input matInput formControlName="slug" placeholder="san-pham-abc">
              </mat-form-field>
              <button mat-button type="button" (click)="generateSlug()">Tự động tạo</button>
            </div>
          </div>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="isLoading || isUploadingImage">Hủy</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!productForm.valid || isLoading || isUploadingImage">
        <span *ngIf="!isLoading && !isUploadingImage">{{ data.product ? 'Cập nhật' : 'Thêm' }}</span>
        <span *ngIf="isUploadingImage">Đang upload...</span>
        <span *ngIf="isLoading && !isUploadingImage">Đang lưu...</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .product-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 800px;
    }

    .full-width {
      width: 100%;
    }

    .gallery-section {
      margin: 16px 0;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: #fafafa;
    }

    .gallery-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
    }

    .gallery-item {
      position: relative;
      aspect-ratio: 1;
      border-radius: 8px;
      overflow: hidden;
      cursor: move;
      border: 2px solid #e0e0e0;
    }

    .gallery-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .drag-handle {
      position: absolute;
      top: 4px;
      left: 4px;
      background: rgba(0,0,0,0.7);
      color: white;
      border-radius: 4px;
      cursor: move;
      z-index: 10;
    }

    .drag-handle mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .gallery-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0,0,0,0.7));
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      opacity: 0;
      transition: opacity 0.3s;
    }

    .gallery-item:hover .gallery-overlay {
      opacity: 1;
    }

    .image-order {
      color: white;
      font-weight: bold;
      font-size: 14px;
    }

    .gallery-overlay button {
      color: white;
    }

    .empty-gallery {
      text-align: center;
      padding: 40px;
      color: #999;
    }

    .empty-gallery mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ccc;
    }

    .image-upload-field {
      margin: 16px 0;
    }

    .upload-label {
      display: block;
      font-weight: 500;
      margin-bottom: 8px;
      color: rgba(0, 0, 0, 0.6);
    }

    .upload-area {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
      min-height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fafafa;
    }

    .upload-area:hover {
      border-color: #1976d2;
      background: #f0f8ff;
    }

    .upload-area.has-image {
      padding: 0;
      min-height: 200px;
    }

    .image-preview {
      width: 100%;
      height: 100%;
      position: relative;
    }

    .image-preview img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .image-overlay {
      position: absolute;
      top: 0;
      right: 0;
      background: rgba(0,0,0,0.7);
      border-radius: 0 0 0 8px;
    }

    .upload-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #1976d2;
    }

    .seo-section {
      margin-top: 16px;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .section-title {
      display: flex;
      align-items: center;
      cursor: pointer;
      margin: 0;
      user-select: none;
    }

    .slug-field {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .loading-spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #1976d2;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    mat-dialog-content {
      max-height: 80vh;
      overflow-y: auto;
    }

    .cdk-drag-preview {
      opacity: 0.8;
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    }

    .cdk-drag-placeholder {
      opacity: 0.4;
    }
  `]
})
export class ProductDialogComponent implements OnInit {
  productForm!: FormGroup;
  categories$: Observable<Category[]>;
  public Editor: any = ClassicEditor;
  editorConfig: any;
  isLoading = false;
  isUploadingImage = false;
  selectedImageUrl: string | null = null;
  galleryImages: { url: string; file?: File; id?: number }[] = [];
  originalImageIds: number[] = []; // Track original image IDs to detect deletions
  showSEO = false;

  // Upload progress tracking
  featuredImageUploadProgress = 0;
  galleryImageUploadProgress: { [key: number]: number } = {};

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private authService: AuthService,
    private dialogRef: MatDialogRef<ProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { product?: Product },
    private snackBar: MatSnackBar
  ) {
    this.productForm = this.fb.group({
      title: ['', [Validators.required]],
      category_id: ['', [Validators.required]],
      summary: [''],
      thumbnail_url: [''],
      content: ['', [Validators.required]],
      published: [false],
      meta_title: [''],
      meta_description: [''],
      focus_keywords: [''],
      slug: [''],
      og_image_url: ['']
    });

    this.categories$ = this.dataService.getCategories();
  }

  ngOnInit(): void {
    const token = this.authService.getToken();

    this.editorConfig = {
      toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|', 'imageUpload', 'blockQuote', 'undo', 'redo'],
      extraPlugins: [CKEditorUploadAdapterPlugin(this.dataService)]
    };

    if (this.data.product) {
      const product = this.data.product;
      this.productForm.patchValue({
        title: product.title,
        category_id: product.category_id,
        summary: product.summary,
        thumbnail_url: product.thumbnail_url,
        content: product.content,
        published: product.published,
        meta_title: product.meta_title || '',
        meta_description: product.meta_description || '',
        focus_keywords: product.focus_keywords || '',
        slug: product.slug || '',
        og_image_url: product.og_image_url || ''
      });

      this.selectedImageUrl = product.thumbnail_url || null;

      // Load existing gallery images
      if (product.images && product.images.length > 0) {
        this.galleryImages = product.images.map(img => ({
          url: img.image_url,
          id: img.id
        }));
        this.originalImageIds = product.images.map(img => img.id);
      }
    }
  }

  toggleSEO(): void {
    this.showSEO = !this.showSEO;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.productForm.valid) {
      this.isLoading = true;
      
      // Always ensure selectedImageUrl is synced to form if it exists
      if (this.selectedImageUrl) {
        const currentFormValue = this.productForm.get('thumbnail_url')?.value;
        // Only patch if selectedImageUrl is different from form value
        if (currentFormValue !== this.selectedImageUrl) {
          console.log('Syncing selectedImageUrl to form:', this.selectedImageUrl);
          this.productForm.patchValue({ thumbnail_url: this.selectedImageUrl }, { emitEvent: false });
        }
      }
      
      const productData = { ...this.productForm.value };

      console.log('Saving product with gallery images:', this.galleryImages.length);
      console.log('Product thumbnail_url:', productData.thumbnail_url);
      console.log('selectedImageUrl:', this.selectedImageUrl);

      const operation = this.data.product
        ? this.dataService.updateProduct(this.data.product.id, productData)
        : this.dataService.createProduct(productData);

      operation.subscribe({
        next: (result) => {
          console.log('Product saved, result:', result);
          const productId = result.id || this.data.product?.id;

          if (!productId) {
            this.isLoading = false;
            this.snackBar.open('Lỗi: Không có product ID', 'Đóng', { duration: 3000 });
            return;
          }

          // Handle gallery images update
          this.updateGalleryImages(productId);
        },
        error: (error) => {
          console.error('Error saving product:', error);
          this.isLoading = false;
          this.snackBar.open('Có lỗi xảy ra khi lưu sản phẩm!', 'Đóng', { duration: 3000 });
        }
      });
    }
  }

  onImageSelect(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.snackBar.open('Kích thước tệp không được vượt quá 5MB', 'Đóng', { duration: 3000 });
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Chỉ chấp nhận tệp hình ảnh', 'Đóng', { duration: 3000 });
      return;
    }

    this.isUploadingImage = true;
    this.featuredImageUploadProgress = 0;

    this.dataService.uploadImageWithProgress(file).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          if (event.total) {
            this.featuredImageUploadProgress = Math.round((100 * event.loaded) / event.total);
          }
        } else if (event.type === HttpEventType.Response) {
          this.isUploadingImage = false;
          this.featuredImageUploadProgress = 100;
          this.selectedImageUrl = event.body.url;
          
          // Patch value and force update
          this.productForm.patchValue({ thumbnail_url: event.body.url });
          this.productForm.get('thumbnail_url')?.updateValueAndValidity();
          
          console.log('Upload complete, URL set to:', event.body.url);
          console.log('Form thumbnail_url value:', this.productForm.get('thumbnail_url')?.value);
          
          this.snackBar.open('Tải lên hình ảnh thành công!', 'Đóng', { duration: 3000 });
        }
      },
      error: (error) => {
        this.isUploadingImage = false;
        this.featuredImageUploadProgress = 0;
        console.error('Upload error:', error);

        let errorMessage = 'Lỗi khi tải lên hình ảnh';
        if (error.status === 401) {
          errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
        } else if (error.status === 400) {
          errorMessage = error.error?.error || 'File không hợp lệ';
        } else if (error.status === 413) {
          errorMessage = 'File quá lớn (tối đa 5MB)';
        }

        this.snackBar.open(errorMessage, 'Đóng', { duration: 5000 });
      }
    });
  }

  removeImage(event: Event): void {
    event.stopPropagation();
    this.selectedImageUrl = null;
    this.productForm.patchValue({ thumbnail_url: '' });
  }

  onGalleryImagesSelect(event: any): void {
    const files = Array.from(event.target.files) as File[];
    if (!files.length) return;

    console.log('Selected gallery files:', files.length);

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        this.snackBar.open(`${file.name}: Kích thước tệp quá lớn`, 'Đóng', { duration: 3000 });
        return;
      }

      if (!file.type.startsWith('image/')) {
        this.snackBar.open(`${file.name}: Không phải file ảnh`, 'Đóng', { duration: 3000 });
        return;
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e: any) => {
        console.log('Gallery image added:', file.name);
        this.galleryImages.push({ url: e.target.result, file });
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    event.target.value = '';
  }

  removeGalleryImage(index: number): void {
    this.galleryImages.splice(index, 1);
  }

  onGalleryDrop(event: CdkDragDrop<any>): void {
    moveItemInArray(this.galleryImages, event.previousIndex, event.currentIndex);
  }

  getCategoryDisplayName(category: any): string {
    if (category.parent) {
      return `${category.parent.name} > ${category.name}`;
    }
    return category.name;
  }

  private updateGalleryImages(productId: number): void {
    // Step 1: Find deleted images (original images that are no longer in galleryImages)
    const currentImageIds = this.galleryImages.filter(img => img.id).map(img => img.id!);
    const deletedImageIds = this.originalImageIds.filter(id => !currentImageIds.includes(id));

    // Step 2: Find new images to upload (images with file property)
    const imagesToUpload = this.galleryImages.filter(img => img.file);

    console.log('Deleted images:', deletedImageIds);
    console.log('New images to upload:', imagesToUpload.length);

    // If nothing to do, just close
    if (deletedImageIds.length === 0 && imagesToUpload.length === 0) {
      this.isLoading = false;
      this.snackBar.open(
        this.data.product ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm thành công!',
        'Đóng',
        { duration: 3000 }
      );
      this.dialogRef.close(true);
      return;
    }

    // Step 3: Delete removed images
    let deletedCount = 0;
    const totalDeletes = deletedImageIds.length;

    if (totalDeletes > 0) {
      deletedImageIds.forEach(imageId => {
        this.dataService.deleteProductImage(productId, imageId).subscribe({
          next: () => {
            deletedCount++;
            if (deletedCount === totalDeletes && imagesToUpload.length === 0) {
              this.finishSave();
            } else if (deletedCount === totalDeletes) {
              this.uploadNewImages(productId, imagesToUpload);
            }
          },
          error: (error) => {
            console.error('Error deleting image:', error);
            this.isLoading = false;
            this.snackBar.open('Lỗi khi xóa ảnh gallery', 'Đóng', { duration: 3000 });
          }
        });
      });
    } else if (imagesToUpload.length > 0) {
      this.uploadNewImages(productId, imagesToUpload);
    }
  }

  private uploadNewImages(productId: number, imagesToUpload: { url: string; file?: File; id?: number }[]): void {
    let uploadedCount = 0;

    imagesToUpload.forEach((img, index) => {
      if (img.file) {
        this.galleryImageUploadProgress[index] = 0;
        
        this.dataService.uploadImageWithProgress(img.file).subscribe({
          next: (event: any) => {
            if (event.type === HttpEventType.UploadProgress) {
              if (event.total) {
                this.galleryImageUploadProgress[index] = Math.round((100 * event.loaded) / event.total);
              }
            } else if (event.type === HttpEventType.Response) {
              this.galleryImageUploadProgress[index] = 100;
              
              this.dataService.addProductImage(productId, {
                image_url: event.body.url,
                display_order: this.galleryImages.indexOf(img),
                alt_text: '',
                is_primary: index === 0 && this.galleryImages.length === imagesToUpload.length
              }).subscribe({
                next: () => {
                  uploadedCount++;
                  if (uploadedCount === imagesToUpload.length) {
                    this.finishSave();
                  }
                },
                error: (error) => {
                  console.error('Error adding product image:', error);
                  this.isLoading = false;
                  this.snackBar.open('Lỗi khi lưu ảnh gallery vào database', 'Đóng', { duration: 5000 });
                }
              });
            }
          },
          error: (error) => {
            console.error('Error uploading gallery image:', error);
            this.isLoading = false;
            this.snackBar.open('Lỗi khi upload ảnh gallery', 'Đóng', { duration: 5000 });
          }
        });
      }
    });
  }

  private finishSave(): void {
    this.isLoading = false;
    this.snackBar.open(
      this.data.product ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm thành công!',
      'Đóng',
      { duration: 3000 }
    );
    this.dialogRef.close(true);
  }

  private uploadGalleryImages(productId: number): void {
    const imagesToUpload = this.galleryImages.filter(img => img.file);

    console.log('Gallery images to upload:', imagesToUpload.length, 'out of', this.galleryImages.length);
    console.log('Gallery images detail:', this.galleryImages);

    if (imagesToUpload.length === 0) {
      this.isLoading = false;
      this.snackBar.open('Sản phẩm đã được lưu!', 'Đóng', { duration: 3000 });
      this.dialogRef.close(true);
      return;
    }

    let uploadedCount = 0;

    imagesToUpload.forEach((img, index) => {
      if (img.file) {
        this.galleryImageUploadProgress[index] = 0;
        
        this.dataService.uploadImageWithProgress(img.file).subscribe({
          next: (event: any) => {
            if (event.type === HttpEventType.UploadProgress) {
              if (event.total) {
                this.galleryImageUploadProgress[index] = Math.round((100 * event.loaded) / event.total);
              }
            } else if (event.type === HttpEventType.Response) {
              this.galleryImageUploadProgress[index] = 100;
              
              this.dataService.addProductImage(productId, {
                image_url: event.body.url,
                display_order: this.galleryImages.indexOf(img),
                alt_text: '',
                is_primary: index === 0
              }).subscribe({
                next: () => {
                  uploadedCount++;
                  if (uploadedCount === imagesToUpload.length) {
                    this.isLoading = false;
                    this.snackBar.open('Sản phẩm và ảnh đã được lưu!', 'Đóng', { duration: 3000 });
                    this.dialogRef.close(true);
                  }
                },
                error: (error) => {
                  console.error('Error adding product image:', error);
                  this.isLoading = false;
                  this.snackBar.open('Lỗi khi lưu ảnh gallery vào database', 'Đóng', { duration: 5000 });
                }
              });
            }
          },
          error: (error) => {
            console.error('Error uploading gallery image:', error);
            this.isLoading = false;
            this.snackBar.open('Lỗi khi upload ảnh gallery', 'Đóng', { duration: 5000 });
          }
        });
      }
    });
  }

  getMetaTitleLength(): number {
    const metaTitle = this.productForm.get('meta_title')?.value || '';
    const title = this.productForm.get('title')?.value || '';
    return (metaTitle || title).length;
  }

  getMetaDescriptionLength(): number {
    return (this.productForm.get('meta_description')?.value || '').length;
  }

  generateSlug(): void {
    const title = this.productForm.get('title')?.value;
    if (title) {
      const slug = this.removeVietnameseTones(title)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      this.productForm.patchValue({ slug });
    }
  }

  private removeVietnameseTones(str: string): string {
    const accents = 'ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠạẢảẤấẦầẨẩẪẫẬậẮắẰằẲẳẴẵẶặẸẹẺẻẼẽẾếỀềỂểỄễỆệỈỉỊịỌọỎỏỐốỒồỔổỖỗỘộỚớỜờỞởỠỡỢợỤụỦủỨứỪừỬửỮữỰựỲỳỴỵỶỷỸỹ';
    const noAccents = 'AAAAEEEIIOOOOUUYaaaaeeeiioooouuyAaDdIiUuOoUuAaAaAaAaAaAaAaAaAaAaAaAaEeEeEeEeEeEeEeEeIiIiOoOoOoOoOoOoOoOoOoOoOoOoUuUuUuUuUuUuUuYyYyYyYy';

    return str.split('').map((char, index) => {
      const accentIndex = accents.indexOf(char);
      return accentIndex !== -1 ? noAccents[accentIndex] : char;
    }).join('');
  }
}
