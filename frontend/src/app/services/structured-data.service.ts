import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StructuredDataService {

  private removeExistingSchema(type: string): void {
    const scripts = document.querySelectorAll(`script[type="application/ld+json"][data-schema="${type}"]`);
    scripts.forEach(script => script.remove());
  }

  addOrganizationSchema(): void {
    this.removeExistingSchema('organization');

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', 'organization');
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "MMA Architectural Design",
      "url": "https://yourdomain.com",
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
    document.head.appendChild(script);
  }

  addLocalBusinessSchema(business: any): void {
    this.removeExistingSchema('localbusiness');

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', 'localbusiness');
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": "https://yourdomain.com/#localbusiness",
      "name": business.name || "MMA Architectural Design",
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
      "url": "https://yourdomain.com",
      "image": business.logo || "",
      "priceRange": "$$",
      "openingHours": business.openingHours || [
        "Mo-Fr 08:00-17:00",
        "Sa 08:00-12:00"
      ]
    });
    document.head.appendChild(script);
  }

  addArticleSchema(article: any): void {
    this.removeExistingSchema('article');

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', 'article');
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": article.title,
      "description": article.summary || article.meta_description,
      "image": article.featured_image_url || "",
      "author": {
        "@type": "Organization",
        "name": "MMA Architectural Design"
      },
      "publisher": {
        "@type": "Organization",
        "name": "MMA Architectural Design",
        "logo": {
          "@type": "ImageObject",
          "url": "https://yourdomain.com/assets/images/logo.png"
        }
      },
      "datePublished": article.created_at,
      "dateModified": article.updated_at || article.created_at,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": window.location.href
      }
    });
    document.head.appendChild(script);
  }

  addBreadcrumbSchema(breadcrumbs: Array<{name: string, url: string}>): void {
    this.removeExistingSchema('breadcrumb');

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', 'breadcrumb');
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": item.url
      }))
    });
    document.head.appendChild(script);
  }

  addWebsiteSchema(): void {
    this.removeExistingSchema('website');

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', 'website');
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "MMA Architectural Design",
      "url": "https://yourdomain.com",
      "description": "Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo",
      "publisher": {
        "@type": "Organization",
        "name": "MMA Architectural Design"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://yourdomain.com/search?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      },
      "inLanguage": "vi-VN"
    });
    document.head.appendChild(script);
  }
}