import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  NgZone,
  OnInit,
  PLATFORM_ID,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCard, MatCardContent } from '@angular/material/card';
import { Observable } from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';
import { SanityService } from '../services/sanity.service';
import { Category, PostSummary } from '../models/post.model';
import { IconComponent } from '../../shared/icon.component';
@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [RouterLink, MatCard, MatCardContent, IconComponent],
  templateUrl: './blog-list.component.html',
  styleUrl: './blog-list.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly sanity = inject(SanityService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly siteOrigin = 'https://www.alissonlimadev.com';
  private readonly defaultOgImageUrl = `${this.siteOrigin}/assets/img/og-image.webp`;

  posts: PostSummary[] = [];
  categories: Category[] = [];
  currentCategory?: Category;
  loading = true;
  error = false;
  notFound = false;
  searchTerm = '';
  currentPage = 1;
  readonly pageSize = 6;

  ngOnInit(): void {
    this.sanity
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        // Clarity faz monkey-patch no XHR e quebra o Zone do Angular —
        // por isso forçamos a callback a rodar dentro da zone.
        next: (cats) => {
          this.zone.run(() => {
            this.categories = cats ?? [];
            this.cdr.markForCheck();
          });
        },
        error: () => {},
      });

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const slug = params.get('slug');
        this.searchTerm = '';
        this.currentPage = 1;
        this.loadForRoute(slug);
      });
  }

  private loadForRoute(categorySlug: string | null): void {
    this.loading = true;
    this.error = false;
    this.notFound = false;
    this.currentCategory = undefined;
    this.posts = [];
    this.cdr.markForCheck();

    if (categorySlug) {
      this.applySeo(
        'Categoria | Blog | Alisson Lima Dev',
        'Artigos de desenvolvimento filtrados por categoria.',
        `/blog/categoria/${categorySlug}`,
      );
      this.sanity
        .getCategoryBySlug(categorySlug)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (cat) => {
            this.zone.run(() => {
              if (!cat) {
                this.handleCategoryNotFound();
                return;
              }

              this.currentCategory = cat;
              this.applySeo(
                `${cat.title} | Blog | Alisson Lima Dev`,
                (
                  cat.description ||
                  `Artigos da categoria ${cat.title} no blog de Alisson Lima.`
                ).slice(0, 160),
                `/blog/categoria/${categorySlug}`,
              );
              this.fetchPosts(this.sanity.getPostsByCategory(categorySlug));
              this.cdr.markForCheck();
            });
          },
          error: () => {},
        });
    } else {
      this.applySeo(
        'Blog | Alisson Lima Dev',
        'Artigos sobre desenvolvimento web, APIs REST, integrações e carreira em tecnologia.',
        '/blog',
      );
      this.fetchPosts(this.sanity.getPosts());
    }
  }

  private applySeo(title: string, description: string, path: string): void {
    const url = `${this.siteOrigin}${path}`;
    this.titleService.setTitle(title);
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ name: 'robots', content: 'index, follow' });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({
      property: 'og:description',
      content: description,
    });
    this.metaService.updateTag({ property: 'og:url', content: url });
    this.metaService.updateTag({
      property: 'og:image',
      content: this.defaultOgImageUrl,
    });
    this.metaService.updateTag({ property: 'og:image:width', content: '1200' });
    this.metaService.updateTag({ property: 'og:image:height', content: '630' });
    this.metaService.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image',
    });
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({
      name: 'twitter:description',
      content: description,
    });
    this.metaService.updateTag({
      name: 'twitter:image',
      content: this.defaultOgImageUrl,
    });
    this.metaService.removeTag("property='article:author'");
    this.metaService.removeTag("property='article:published_time'");
    this.metaService.removeTag("property='article:modified_time'");
    this.setCanonicalPath(path);
  }

  private setCanonicalPath(path: string): void {
    let link = this.document.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement | null;
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = `${this.siteOrigin}${path}`;
  }

  private handleCategoryNotFound(): void {
    if (this.isBrowser) {
      void this.router.navigate(['/404'], { replaceUrl: true });
      return;
    }

    this.notFound = true;
    this.loading = false;
    this.error = false;
    this.posts = [];
    this.currentCategory = undefined;
    this.applySeo(
      'Categoria não encontrada | alissonlimadev',
      'A categoria solicitada não foi encontrada.',
      '/404',
    );
    this.metaService.updateTag({ name: 'robots', content: 'noindex, follow' });
    this.cdr.markForCheck();
  }

  private fetchPosts(source$: Observable<PostSummary[]>): void {
    source$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (posts) => {
        this.zone.run(() => {
          this.posts = (posts ?? []).map((p) => ({
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
      (p) =>
        p.title.toLowerCase().includes(term) ||
        (p.excerpt?.toLowerCase().includes(term) ?? false) ||
        (p.tags?.some((t) => t.toLowerCase().includes(term)) ?? false) ||
        (p.categories?.some((c) => c.title.toLowerCase().includes(term)) ??
          false),
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
