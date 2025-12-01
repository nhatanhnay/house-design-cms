import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { ConsultationFormComponent } from './components/consultation-form/consultation-form.component';
import { VisitorTrackingService } from './services/visitor-tracking.service';
import { filter } from 'rxjs/operators';

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
      @defer (on viewport) {
        <app-consultation-form></app-consultation-form>
      } @placeholder {
        <div class="consultation-placeholder"></div>
      }
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
    
    .consultation-placeholder {
      min-height: 550px;
      background: linear-gradient(135deg, rgba(224, 149, 67, 0.1) 0%, rgba(58, 58, 58, 0.3) 100%);
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'Modern House Design';

  constructor(
    private visitorTrackingService: VisitorTrackingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize visitor tracking
    this.visitorTrackingService.initialize();

    // Scroll to top on route change
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      });
  }
}
