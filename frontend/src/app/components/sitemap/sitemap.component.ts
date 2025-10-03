import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { Category, Post } from '../../models/models';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
}

@Component({
  selector: 'app-sitemap',
  standalone: true,
  imports: [CommonModule],
  template: `{{ sitemapXml }}`
})
export class SitemapComponent implements OnInit {
  sitemapXml = '';

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.generateSitemap();
  }

  private generateSitemap(): void {
    combineLatest([
      this.dataService.getCategories(),
      this.dataService.getPosts()
    ]).pipe(
      map(([categories, posts]) => {
        const urls: SitemapUrl[] = [];
        const baseUrl = 'https://yourdomain.com';

        // Add homepage
        urls.push({
          loc: baseUrl,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: '1.0'
        });

        // Add categories
        categories.forEach(category => {
          urls.push({
            loc: `${baseUrl}/category/${category.slug}`,
            lastmod: category.updated_at ? new Date(category.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            changefreq: 'weekly',
            priority: '0.8'
          });
        });

        // Add posts (only published ones)
        posts.filter(post => post.published).forEach(post => {
          urls.push({
            loc: `${baseUrl}/post/${post.id}`,
            lastmod: post.updated_at ? new Date(post.updated_at).toISOString().split('T')[0] : new Date(post.created_at || '').toISOString().split('T')[0],
            changefreq: 'monthly',
            priority: '0.6'
          });
        });

        return this.generateXml(urls);
      })
    ).subscribe(xml => {
      this.sitemapXml = xml;
    });
  }

  private generateXml(urls: SitemapUrl[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    urls.forEach(url => {
      xml += '  <url>\n';
      xml += `    <loc>${url.loc}</loc>\n`;
      if (url.lastmod) {
        xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      }
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      xml += `    <priority>${url.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    xml += '</urlset>';
    return xml;
  }
}