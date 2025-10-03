import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HomeContent } from '../../models/models';

@Component({
  selector: 'home-content-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule
  ],
  templateUrl: './home-content-edit-dialog.component.html'
})
export class HomeContentEditDialog {
  constructor(
    public dialogRef: MatDialogRef<HomeContentEditDialog>,
    @Inject(MAT_DIALOG_DATA) public data: HomeContent
  ) {}

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
}