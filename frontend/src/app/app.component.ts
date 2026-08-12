import { Component, OnInit, inject } from '@angular/core';
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
    <a class="skip-link" href="#main-content">Tới nội dung chính</a>

    <div class="app-container">
      <app-navbar></app-navbar>
      <main class="main-content" id="main-content" tabindex="-1">
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

    /* Vùng nhận focus qua skip-link không cần viền riêng */
    .main-content:focus {
      outline: none;
    }

    .consultation-placeholder {
      min-height: 550px;
      background: linear-gradient(135deg, rgba(224, 149, 67, 0.1) 0%, rgba(58, 58, 58, 0.3) 100%);
    }

    /* Ẩn cho tới khi được focus bằng bàn phím: navbar có tới 10 mục,
       người dùng bàn phím không phải Tab hết mới tới được nội dung. */
    .skip-link {
      position: absolute;
      left: 12px;
      top: -100px;
      z-index: 2000;
      padding: 12px 20px;
      background: var(--accent-copper);
      color: #fff;
      font-weight: 600;
      text-decoration: none;
      border-radius: 0 0 6px 6px;
      transition: top 0.2s ease;
    }

    .skip-link:focus {
      top: 0;
    }

    @media (max-width: 768px) {
      .main-content {
        padding-top: 56px; /* Navbar thấp hơn ở mobile */
      }
    }
  `]
})
export class AppComponent implements OnInit {
  private readonly visitorTrackingService = inject(VisitorTrackingService);

  ngOnInit(): void {
    this.visitorTrackingService.initialize();
  }
}
