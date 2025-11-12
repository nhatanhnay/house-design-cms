import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { ConsultationFormComponent } from './components/consultation-form/consultation-form.component';
import { VisitorTrackingService } from './services/visitor-tracking.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent, ConsultationFormComponent],
  template: `
    <div class="app-container">
      <app-navbar></app-navbar>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      <app-consultation-form></app-consultation-form>
      <app-footer></app-footer>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .main-content {
      flex: 1;
      padding-top: 64px; /* Navbar height */
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'Modern House Design';

  constructor(private visitorTrackingService: VisitorTrackingService) {}

  ngOnInit(): void {
    // Initialize visitor tracking
    this.visitorTrackingService.initialize();
  }
}
