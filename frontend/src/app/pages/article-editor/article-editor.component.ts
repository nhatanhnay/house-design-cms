import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

import { DataService } from '../../services/data.service';
import { Article, Category } from '../../models/models';
import { SeoPreviewComponent } from '../../components/seo-preview/seo-preview.component';

@Component({
  selector: 'app-article-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    CKEditorModule,
    SeoPreviewComponent
  ],
  templateUrl: './article-editor.component.html',
  styleUrls: ['./article-editor.component.scss']
})
export class ArticleEditorComponent implements OnInit {
  public Editor = ClassicEditor;
  articleForm: FormGroup;
  categories: Category[] = [];
  isEditMode = false;
  articleId: number | null = null;
  isLoading = false;

  editorConfig = {
    toolbar: {
      items: [
        'heading',
        '|',
        'bold',
        'italic',
        'link',
        'bulletedList',
        'numberedList',
        '|',
        'outdent',
        'indent',
        '|',
        'imageUpload',
        'blockQuote',
        'insertTable',
        'mediaEmbed',
        'undo',
        'redo'
      ]
    },
    language: 'en',
    image: {
      toolbar: [
        'imageTextAlternative',
        'imageStyle:full',
        'imageStyle:side'
      ]
    },
    table: {
      contentToolbar: [
        'tableColumn',
        'tableRow',
        'mergeTableCells'
      ]
    }
  };

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.articleForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(500)]],
      content: ['', [Validators.required]],
      summary: ['', [Validators.maxLength(500)]],
      featured_image_url: [''],
      category_id: ['', [Validators.required]],
      published: [false],
      tags: [''],
      meta_title: ['', [Validators.maxLength(255)]],
      meta_description: [''],
      focus_keywords: [''],
      og_image_url: [''],
      slug: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.loadCategories();

    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.articleId = +params['id'];
        this.loadArticle(this.articleId);
      }
    });
  }

  loadCategories(): void {
    this.dataService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        this.snackBar.open('Error loading categories', 'Close', { duration: 3000 });
      }
    });
  }

  loadArticle(id: number): void {
    this.isLoading = true;
    this.dataService.getArticle(id).subscribe({
      next: (article) => {
        this.articleForm.patchValue({
          title: article.title,
          content: article.content,
          summary: article.summary,
          featured_image_url: article.featured_image_url,
          category_id: article.category_id,
          published: article.published,
          tags: article.tags,
          meta_title: article.meta_title,
          meta_description: article.meta_description,
          slug: article.slug
        });
        this.isLoading = false;
      },
      error: (error) => {
        this.snackBar.open('Error loading article', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.articleForm.valid) {
      this.isLoading = true;
      const articleData = this.articleForm.value;

      const operation = this.isEditMode
        ? this.dataService.updateArticle(this.articleId!, articleData)
        : this.dataService.createArticle(articleData);

      operation.subscribe({
        next: (article) => {
          const action = this.isEditMode ? 'updated' : 'created';
          this.snackBar.open(`Article ${action} successfully!`, 'Close', { duration: 3000 });
          this.router.navigate(['/admin/articles']);
        },
        error: (error) => {
          const action = this.isEditMode ? 'update' : 'create';
          this.snackBar.open(`Error ${action} article`, 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
    } else {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin/articles']);
  }

  generateSlug(): void {
    const title = this.articleForm.get('title')?.value;
    if (title) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      this.articleForm.patchValue({ slug });
    }
  }

  updateSeoPreview(): void {
    // This method is called when SEO fields are updated
    // The preview component will automatically update via data binding
  }

  getMetaTitleLength(): number {
    const metaTitle = this.articleForm.get('meta_title')?.value || '';
    const title = this.articleForm.get('title')?.value || '';
    return (metaTitle || title).length;
  }

  getMetaDescriptionLength(): number {
    const metaDescription = this.articleForm.get('meta_description')?.value || '';
    return metaDescription.length;
  }
}