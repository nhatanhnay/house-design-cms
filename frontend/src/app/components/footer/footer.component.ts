import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatIconModule],
  template: `
    <footer class="footer dark-bg">
      <div class="container footer-content">
        <div class="footer-section">
          <h3>Modern House Design</h3>
          <p>Chuyên thiết kế và thi công nhà ở hiện đại, đẹp mắt và tiện nghi. 
             Mang đến cho bạn những ngôi nhà trong mơ với phong cách kiến trúc độc đáo.</p>
        </div>
        
        <div class="footer-section">
          <h4>Liên Hệ</h4>
          <div class="contact-item">
            <mat-icon>phone</mat-icon>
            <span>0123 456 789</span>
          </div>
          <div class="contact-item">
            <mat-icon>email</mat-icon>
            <span>info&#64;modernhousedesign.com</span>
          </div>
          <div class="contact-item">
            <mat-icon>location_on</mat-icon>
            <span>123 Đường ABC, Quận XYZ, TP.HCM</span>
          </div>
        </div>
        
        <div class="footer-section">
          <h4>Dịch Vụ</h4>
          <ul class="service-list">
            <li>Thiết kế kiến trúc</li>
            <li>Thi công xây dựng</li>
            <li>Nội thất cao cấp</li>
            <li>Tư vấn phong thủy</li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4>Theo Dõi</h4>
          <div class="social-links">
            <a href="#" class="social-link">
              <mat-icon>facebook</mat-icon>
            </a>
            <a href="#" class="social-link">
              <mat-icon>instagram</mat-icon>  
            </a>
            <a href="#" class="social-link">
              <mat-icon>youtube_searched_for</mat-icon>
            </a>
          </div>
        </div>
      </div>
      
      <div class="footer-bottom">
        <div class="container">
          <p>&copy; 2024 Modern House Design. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background-color: var(--dark-blue);
      color: white;
      padding: 40px 0 0 0;
      margin-top: 60px;
    }
    
    .footer-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
      margin-bottom: 30px;
    }
    
    .footer-section h3 {
      color: var(--light-blue);
      margin-bottom: 15px;
      font-size: 1.5rem;
    }
    
    .footer-section h4 {
      color: var(--light-blue);
      margin-bottom: 15px;
      font-size: 1.1rem;
    }
    
    .footer-section p {
      line-height: 1.6;
      color: #cccccc;
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      color: #cccccc;
    }
    
    .contact-item mat-icon {
      margin-right: 10px;
      color: var(--brown);
    }
    
    .service-list {
      list-style: none;
      padding: 0;
    }
    
    .service-list li {
      padding: 5px 0;
      color: #cccccc;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .service-list li:last-child {
      border-bottom: none;
    }
    
    .social-links {
      display: flex;
      gap: 15px;
    }
    
    .social-link {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background-color: var(--brown);
      border-radius: 50%;
      color: white;
      text-decoration: none;
      transition: all 0.3s ease;
    }
    
    .social-link:hover {
      background-color: var(--primary-blue);
      transform: translateY(-2px);
    }
    
    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding: 20px 0;
      text-align: center;
      color: #cccccc;
    }
    
    @media (max-width: 768px) {
      .footer-content {
        grid-template-columns: 1fr;
        text-align: center;
      }
      
      .contact-item {
        justify-content: center;
      }
      
      .social-links {
        justify-content: center;
      }
    }
  `]
})
export class FooterComponent {}
