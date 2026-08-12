import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Category } from '../../models/models';
import { DataService } from '../../services/data.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="not-found-page">
      <div class="container">
        <p class="code">404</p>
        <h1>Không tìm thấy trang này</h1>
        <p class="lead">
          Đường dẫn bạn vừa mở không tồn tại hoặc nội dung đã được chuyển đi.
          Bạn có thể quay về trang chủ hoặc chọn một danh mục bên dưới.
        </p>

        <div class="actions">
          <button mat-raised-button routerLink="/" class="btn-primary">
            <mat-icon>home</mat-icon>
            Về trang chủ
          </button>
        </div>

        <nav class="suggestions" *ngIf="categories$ | async as categories">
          <ng-container *ngIf="categories.length > 0">
            <h2>Danh mục nổi bật</h2>
            <ul>
              <li *ngFor="let category of categories; trackBy: trackById">
                <a [routerLink]="'/category/' + category.slug">
                  <span>{{ category.name }}</span>
                  <mat-icon>arrow_forward</mat-icon>
                </a>
              </li>
            </ul>
          </ng-container>
        </nav>
      </div>
    </div>
  `,
  styles: [`
    .not-found-page {
      min-height: 70vh;
      background: var(--background);
      display: flex;
      align-items: center;
      padding: 80px 0;
    }

    .container {
      max-width: 760px;
      margin: 0 auto;
      padding: 0 20px;
      text-align: center;
    }

    .code {
      font-size: clamp(4rem, 14vw, 8rem);
      font-weight: 800;
      line-height: 1;
      margin: 0;
      color: var(--accent-copper);
      letter-spacing: -0.04em;
    }

    h1 {
      font-size: clamp(1.5rem, 4vw, 2.25rem);
      font-weight: 700;
      color: var(--text-primary);
      margin: 16px 0 0;
    }

    .lead {
      color: var(--text-secondary);
      font-size: 1.05rem;
      line-height: 1.7;
      max-width: 52ch;
      margin: 16px auto 0;
    }

    .actions {
      margin-top: 32px;
      display: flex;
      justify-content: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .actions button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .suggestions {
      margin-top: 56px;
      text-align: left;
    }

    .suggestions h2 {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--text-gray);
      font-weight: 600;
      margin: 0 0 12px;
    }

    .suggestions ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1px;
      background: var(--border);
      border: 1px solid var(--border);
    }

    .suggestions a {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 16px 18px;
      background: var(--surface);
      color: var(--text-primary);
      text-decoration: none;
      transition: background-color 0.2s ease, color 0.2s ease;
    }

    .suggestions a:hover {
      background: var(--accent-copper);
      color: var(--text-white);
    }

    .suggestions mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--accent-copper);
      transition: color 0.2s ease, transform 0.2s ease;
    }

    .suggestions a:hover mat-icon {
      color: var(--text-white);
      transform: translateX(3px);
    }
  `]
})
export class NotFoundComponent implements OnInit {
  private readonly dataService = inject(DataService);
  private readonly seo = inject(SeoService);

  /** Danh mục cấp 1 đang hoạt động, tối đa 6 mục làm lối thoát cho người dùng. */
  readonly categories$: Observable<Category[]> = this.dataService.getCategories().pipe(
    map(categories => categories.filter(c => c.is_active && c.level === 0).slice(0, 6))
  );

  ngOnInit(): void {
    this.seo.update({
      title: 'Không tìm thấy trang',
      description: 'Đường dẫn không tồn tại hoặc nội dung đã được chuyển đi.',
      noindex: true
    });
    this.seo.setBreadcrumb([]);
  }

  trackById(_index: number, item: Category): number {
    return item.id;
  }
}
