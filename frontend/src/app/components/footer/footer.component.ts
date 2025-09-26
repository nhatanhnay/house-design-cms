import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DataService } from '../../services/data.service';
import { FooterContent } from '../../pages/admin/admin.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatIconModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  footerContent: FooterContent = {
    company_name: 'MMA Architectural Design',
    address: '123 Đường ABC, Phường XYZ, Quận 1, TP.HCM',
    phone: '0123 456 789',
    email: 'info@modernhousedesign.com',
    facebook_url: '#',
    instagram_url: '#',
    youtube_url: '#',
    linkedin_url: '#',
    copyright_text: '© 2024 MMA Architectural Design. Tất cả quyền được bảo lưu.',
    description: 'Chuyên thiết kế và thi công nhà ở hiện đại, đẹp mắt và tiện nghi. Mang đến cho bạn những ngôi nhà trong mơ với phong cách kiến trúc độc đáo.',
    services: ['Thiết kế kiến trúc', 'Thi công xây dựng', 'Nội thất cao cấp', 'Tư vấn phong thủy'],
    social_media: [
      { name: 'Facebook', url: 'https://facebook.com/company', icon: 'facebook' },
      { name: 'Instagram', url: 'https://instagram.com/company', icon: 'photo_camera' },
      { name: 'YouTube', url: 'https://youtube.com/company', icon: 'play_circle' },
      { name: 'LinkedIn', url: 'https://linkedin.com/company/company', icon: 'business' }
    ]
  };

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.loadFooterContent();
  }

  loadFooterContent(): void {
    this.dataService.getFooterContent().subscribe({
      next: (content) => {
        this.footerContent = content;
        // Ensure arrays are properly initialized
        if (!this.footerContent.services || !Array.isArray(this.footerContent.services)) {
          this.footerContent.services = ['Thiết kế kiến trúc', 'Thi công xây dựng', 'Nội thất cao cấp', 'Tư vấn phong thủy'];
        }
        if (!this.footerContent.social_media || !Array.isArray(this.footerContent.social_media)) {
          this.footerContent.social_media = [
            { name: 'Facebook', url: 'https://facebook.com/company', icon: 'facebook' },
            { name: 'Instagram', url: 'https://instagram.com/company', icon: 'photo_camera' },
            { name: 'YouTube', url: 'https://youtube.com/company', icon: 'play_circle' },
            { name: 'LinkedIn', url: 'https://linkedin.com/company/company', icon: 'business' }
          ];
        }
        console.log('Footer loaded services:', content.services);
        console.log('Footer loaded social media:', content.social_media);
      },
      error: (error) => {
        console.error('Error loading footer content:', error);
        // Keep using default values if API fails
      }
    });
  }
}
