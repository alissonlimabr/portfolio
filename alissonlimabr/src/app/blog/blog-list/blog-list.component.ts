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
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { Observable, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { SanityService } from '../services/sanity.service';
import { Category, PostSummary } from '../models/post.model';
import { resolveCategoryColor } from '../utils/category-color.util';
import { IconComponent } from '../../shared/icon.component';
import { SITE_BRAND, SITE_ORIGIN } from '../../shared/constants/site.constants';

interface BlogListRouteData {
  posts: PostSummary[];
  category?: Category;
  notFound: boolean;
}

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [RouterLink, MatCard, MatCardContent, IconComponent, FormsModule],
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
  private readonly siteOrigin = SITE_ORIGIN;
  private readonly siteBrand = SITE_BRAND;
  private readonly defaultOgImageUrl = `${this.siteOrigin}/assets/img/og-image.webp`;
  private requestedPage = 1;
  readonly resolveCategoryColor = resolveCategoryColor;

  posts: PostSummary[] = [];
  categories: Category[] = [];
  currentCategory?: Category;
  loading = true;
  error = false;
  notFound = false;
  searchTerm = '';
  searchInputValue = '';
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
      .pipe(
        map((params) => params.get('slug')),
        distinctUntilChanged(),
        switchMap((slug) => this.loadForRoute(slug)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          this.zone.run(() => {
            if (result.notFound) {
              this.handleCategoryNotFound();
              return;
            }

            this.currentCategory = result.category;
            if (result.category) {
              this.applySeo(
                `${result.category.title} | Blog | ${this.siteBrand}`,
                (
                  result.category.description ||
                  `Artigos da categoria ${result.category.title} no blog de Alisson Lima.`
                ).slice(0, 160),
                `/blog/categoria/${result.category.slug.current}`,
              );
            }

            this.posts = this.normalizePosts(result.posts);
            this.loading = false;
            this.syncPaginationWithResults(true);
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

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const term = (params.get('q') ?? '').trim();
        this.requestedPage = this.parsePageParam(params.get('page'));
        this.searchTerm = term;
        this.searchInputValue = term;
        this.currentPage = this.loading
          ? this.requestedPage
          : this.clampPage(this.requestedPage);
        if (!this.loading) {
          this.syncPaginationWithResults(true);
        }
        this.cdr.markForCheck();
      });
  }

  private loadForRoute(categorySlug: string | null): Observable<BlogListRouteData> {
    this.prepareRouteLoad(categorySlug);

    if (!categorySlug) {
      return this.sanity.getPosts().pipe(
        map(
          (posts): BlogListRouteData => ({
            posts,
            notFound: false,
          }),
        ),
      );
    }

    return this.sanity.getCategoryBySlug(categorySlug).pipe(
      switchMap((category) => {
        if (!category) {
          return of<BlogListRouteData>({
            posts: [],
            notFound: true,
          });
        }

        return this.sanity.getPostsByCategory(categorySlug).pipe(
          map(
            (posts): BlogListRouteData => ({
              posts,
              category,
              notFound: false,
            }),
          ),
        );
      }),
    );
  }

  private prepareRouteLoad(categorySlug: string | null): void {
    this.loading = true;
    this.error = false;
    this.notFound = false;
    this.currentCategory = undefined;
    this.posts = [];
    this.cdr.markForCheck();

    if (categorySlug) {
      this.applySeo(
        `Categoria | Blog | ${this.siteBrand}`,
        'Artigos de desenvolvimento filtrados por categoria.',
        `/blog/categoria/${categorySlug}`,
      );
    } else {
      this.applySeo(
        `Blog | ${this.siteBrand}`,
        'Artigos sobre desenvolvimento web, APIs REST, integrações e carreira em tecnologia.',
        '/blog',
      );
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

  private normalizePosts(posts: PostSummary[] = []): PostSummary[] {
    return posts.map((post) => ({
      ...post,
      imageUrl:
        post.imageUrl && /^https?:\/\//i.test(post.imageUrl)
          ? this.sanity.optimizeImageUrl(post.imageUrl, { w: 600, h: 338 })
          : undefined,
    }));
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
      `Categoria não encontrada | ${this.siteBrand}`,
      'A categoria solicitada não foi encontrada.',
      '/404',
    );
    this.metaService.updateTag({ name: 'robots', content: 'noindex, follow' });
    this.cdr.markForCheck();
  }

  private parsePageParam(value: string | null): number {
    if (!value) {
      return 1;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }

  private clampPage(page: number): number {
    return Math.min(Math.max(page, 1), this.totalPages);
  }

  private syncPaginationWithResults(replaceUrl: boolean): void {
    const nextPage = this.clampPage(this.requestedPage);
    this.currentPage = nextPage;

    const normalizedPage = nextPage > 1 ? String(nextPage) : null;
    const currentPageParam = this.route.snapshot.queryParamMap.get('page');

    if (currentPageParam !== normalizedPage) {
      this.updateQueryParams({ page: normalizedPage }, replaceUrl);
    }
  }

  private updateQueryParams(
    queryParams: Record<string, string | null>,
    replaceUrl: boolean,
  ): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl,
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

  submitSearch(term: string): void {
    const normalizedTerm = term.trim();
    this.updateQueryParams(
      {
        q: normalizedTerm || null,
        page: null,
      },
      false,
    );
  }

  goToPage(page: number): void {
    const nextPage = this.clampPage(page);
    if (nextPage === this.currentPage) return;

    this.updateQueryParams(
      { page: nextPage > 1 ? String(nextPage) : null },
      false,
    );

    if (this.isBrowser) {
      this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
}
