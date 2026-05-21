import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  NgZone,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { Observable } from 'rxjs';
import { SanityService } from '../services/sanity.service';
import { Category, PostSummary } from '../models/post.model';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [RouterLink, MatCardModule],
  templateUrl: './blog-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  posts: PostSummary[] = [];
  categories: Category[] = [];
  currentCategory?: Category;
  loading = true;
  error = false;
  searchTerm = '';
  currentPage = 1;
  readonly pageSize = 6;

  constructor(
    private sanity: SanityService,
    private route: ActivatedRoute,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sanity
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      // Clarity faz monkey-patch no XHR e quebra o Zone do Angular —
      // por isso forçamos a callback a rodar dentro da zone.
      next: cats => {
        this.zone.run(() => {
          this.categories = cats ?? [];
          this.cdr.markForCheck();
        });
      },
      error: () => {},
    });

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const slug = params.get('slug');
        this.searchTerm = '';
        this.currentPage = 1;
        this.loadForRoute(slug);
      });
  }

  private loadForRoute(categorySlug: string | null): void {
    this.loading = true;
    this.error = false;
    this.currentCategory = undefined;
    this.posts = [];
    this.cdr.markForCheck();

    if (categorySlug) {
      this.sanity
        .getCategoryBySlug(categorySlug)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: cat => {
            this.zone.run(() => {
              this.currentCategory = cat ?? undefined;
              this.cdr.markForCheck();
            });
          },
          error: () => {},
        });
      this.fetchPosts(this.sanity.getPostsByCategory(categorySlug));
    } else {
      this.fetchPosts(this.sanity.getPosts());
    }
  }

  private fetchPosts(source$: Observable<PostSummary[]>): void {
    source$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: posts => {
        this.zone.run(() => {
          this.posts = (posts ?? []).map(p => ({
            ...p,
            imageUrl:
              p.imageUrl && /^https?:\/\//i.test(p.imageUrl)
                ? this.sanity.optimizeImageUrl(p.imageUrl, { w: 600, h: 338 })
                : undefined,
          }));
          this.loading = false;
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.error = true;
          this.loading = false;
          this.cdr.markForCheck();
        });
      },
    });
  }

  get filteredPosts(): PostSummary[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.posts;
    return this.posts.filter(
      p =>
        p.title.toLowerCase().includes(term) ||
        (p.excerpt?.toLowerCase().includes(term) ?? false) ||
        (p.tags?.some(t => t.toLowerCase().includes(term)) ?? false) ||
        (p.categories?.some(c => c.title.toLowerCase().includes(term)) ?? false)
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredPosts.length / this.pageSize));
  }

  get pagedPosts(): PostSummary[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredPosts.slice(start, start + this.pageSize);
  }

  get pageNumbers(): (number | null)[] {
    const total = this.totalPages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | null)[] = [1];
    if (this.currentPage > 3) pages.push(null);
    const start = Math.max(2, this.currentPage - 1);
    const end = Math.min(total - 1, this.currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (this.currentPage < total - 2) pages.push(null);
    pages.push(total);
    return pages;
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
}
