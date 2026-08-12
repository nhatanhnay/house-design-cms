import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StructuredDataService {
  private readonly document = inject(DOCUMENT);

  /** Domain thật, lấy từ environment thay vì hardcode. */
  private get baseUrl(): string {
    return environment.baseUrl.replace(/\/+$/, '');
  }

  private removeExistingSchema(type: string): void {
    const scripts = this.document.querySelectorAll(`script[type="application/ld+json"][data-schema="${type}"]`);
    scripts.forEach(script => script.remove());
  }

  private appendSchema(type: string, schema: object): void {
    this.removeExistingSchema(type);

    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', type);
    script.text = JSON.stringify(schema);
    this.document.head.appendChild(script);
  }

  addOrganizationSchema(): void {
    this.appendSchema('organization', {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": environment.siteName,
      "url": this.baseUrl,
      "description": "Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "VN",
        "addressRegion": "Vietnam"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": ["Vietnamese", "English"]
      },
      "foundingDate": "2010",
      "numberOfEmployees": "50-100",
      "serviceArea": {
        "@type": "Place",
        "name": "Vietnam"
      }
    });
  }

  addLocalBusinessSchema(business: any): void {
    this.appendSchema('localbusiness', {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${this.baseUrl}/#localbusiness`,
      "name": business.name || environment.siteName,
      "description": business.description || "Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": business.address?.street || "",
        "addressLocality": business.address?.city || "",
        "addressRegion": business.address?.region || "",
        "postalCode": business.address?.postal || "",
        "addressCountry": "VN"
      },
      "telephone": business.phone || "",
      "email": business.email || "",
      "url": this.baseUrl,
      "image": business.logo ? `${this.baseUrl}${business.logo}` : "",
      "priceRange": "$$",
      "openingHours": business.openingHours || [
        "Mo-Fr 08:00-17:00",
        "Sa 08:00-12:00"
      ]
    });
  }

  addBreadcrumbSchema(breadcrumbs: Array<{ name: string, url: string }>): void {
    this.appendSchema('breadcrumb', {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": item.url
      }))
    });
  }

  addWebsiteSchema(): void {
    this.appendSchema('website', {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": environment.siteName,
      "url": this.baseUrl,
      "description": "Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo",
      "publisher": {
        "@type": "Organization",
        "name": environment.siteName
      },
      "inLanguage": "vi-VN"
    });
  }
}
