import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-consultation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './consultation-form.component.html',
  styleUrls: ['./consultation-form.component.scss']
})
export class ConsultationFormComponent implements OnInit {
  consultationForm!: FormGroup;
  isSubmitting = false;
  submitSuccess = false;
  submitError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.consultationForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
      email: ['', [Validators.email]],
      details: ['']
    });
  }

  onSubmit(): void {
    if (this.consultationForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.consultationForm.controls).forEach(key => {
        this.consultationForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.submitSuccess = false;
    this.submitError = null;

    const formData = this.consultationForm.value;

    this.dataService.createConsultation(formData).subscribe({
      next: (response) => {
        console.log('Consultation submitted successfully:', response);
        this.isSubmitting = false;
        this.submitSuccess = true;
        this.consultationForm.reset();

        // Hide success message after 5 seconds
        setTimeout(() => {
          this.submitSuccess = false;
        }, 5000);
      },
      error: (error) => {
        console.error('Error submitting consultation:', error);
        this.isSubmitting = false;
        this.submitError = 'Có lỗi xảy ra. Vui lòng thử lại sau.';

        // Hide error message after 5 seconds
        setTimeout(() => {
          this.submitError = null;
        }, 5000);
      }
    });
  }
}
