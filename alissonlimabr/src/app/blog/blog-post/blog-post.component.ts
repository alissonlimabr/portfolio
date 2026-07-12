import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Inject,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  SecurityContext,
  TransferState,
  ViewEncapsulation,
  inject,
  makeStateKey,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, Meta, SafeHtml, Title } from '@angular/platform-browser';
import { Observable, catchError, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { SanityService } from '../services/sanity.service';
import { Post, PostSummary } from '../models/post.model';
import { resolveCategoryColor } from '../utils/category-color.util';
import { ReadingPreferencesComponent } from '../components/reading-preferences/reading-preferences.component';
import { TocComponent, TocItem } from '../components/toc/toc.component';
import { IconComponent } from '../../shared/icon.component';
import { ActiveSectionDirective } from '../../shared/directives/active-section.directive';
import { CodeBlockEnhancerDirective } from '../../shared/directives/code-block-enhancer.directive';
import { ContentHeadingsDirective } from '../../shared/directives/content-headings.directive';
import { CopyToClipboardDirective } from '../../shared/directives/copy-to-clipboard.directive';
import { ScrollProgressDirective } from '../../shared/directives/scroll-progress.directive';
import { SITE_BRAND, SITE_ORIGIN } from '../../shared/constants/site.constants';

type BlogPostViewModel = Omit<Post, 'body'>;

interface BlogPostPageState {
  post: BlogPostViewModel | null;
  bodyHtml: string;
  relatedPosts: PostSummary[];
}

const EMPTY_BLOG_POST_PAGE_STATE: BlogPostPageState = {
  post: null,
  bodyHtml: '',
  relatedPosts: [],
};

const BLOG_POST_PAGE_CACHE = new Map<string, BlogPostPageState>();
const BLOG_POST_TRANSFER_STATE_PREFIX = 'blog-post-page:';

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [
    RouterLink,
    ReadingPreferencesComponent,
    TocComponent,
    IconComponent,
    ActiveSectionDirective,
    CodeBlockEnhancerDirective,
    ContentHeadingsDirective,
    CopyToClipboardDirective,
    ScrollProgressDirective,
  ],
  templateUrl: './blog-post.component.html',
  styleUrl: './blog-post.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogPostComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly router = inject(Router);
  private readonly transferState = inject(TransferState);
  readonly resolveCategoryColor = resolveCategoryColor;

  post?: BlogPostViewModel;
  bodyHtml?: SafeHtml;
  loading = true;
  notFound = false;
  relatedPosts: PostSummary[] = [];
  linkCopied = false;
  tocItems: TocItem[] = [];
  tocSectionIds: string[] = [];
  activeTocId = '';

  private jsonLdScript?: HTMLScriptElement;
  private linkCopiedTimer: number | null = null;
  private readonly siteOrigin = SITE_ORIGIN;
  private readonly siteBrand = SITE_BRAND;
  private readonly defaultOgImageUrl = `${this.siteOrigin}/assets/img/og-image.webp`;

  constructor(
    private route: ActivatedRoute,
    private sanity: SanityService,
    private sanitizer: DomSanitizer,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private titleService: Title,
    private metaService: Meta,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngOnInit(): void {
    this.document.body.classList.add('blog-post-page');
    this.route.paramMap
      .pipe(
        map((params) => params.get('slug') ?? ''),
        distinctUntilChanged(),
        switchMap((slug) => this.loadPostPageState(slug)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        // Clarity faz monkey-patch no XHR e quebra o Zone do Angular —
        // por isso forçamos a callback a rodar dentro da zone.
        next: (pageState) => {
          this.zone.run(() => {
            if (!pageState.post) {
              this.handlePostNotFound();
              return;
            }
            this.applyLoadedPostPage(pageState);
          });
        },
        error: () => {
          this.zone.run(() => {
            this.handlePostError();
          });
        },
      });
  }

  ngOnDestroy(): void {
    this.document.body.classList.remove('blog-post-page');
    this.clearJsonLd();
    const window = this.document.defaultView;
    if (window && this.linkCopiedTimer !== null) {
      window.clearTimeout(this.linkCopiedTimer);
    }
  }

  private loadPostPageState(slug: string): Observable<BlogPostPageState> {
    this.preparePostLoad();

    if (!slug) {
      return of(EMPTY_BLOG_POST_PAGE_STATE);
    }

    const transferredState = this.takeTransferredPostPageState(slug);
    if (transferredState) {
      return of(transferredState);
    }

    const cachedState = BLOG_POST_PAGE_CACHE.get(slug);
    if (cachedState) {
      return of(cachedState);
    }

    return this.sanity.getPost(slug).pipe(
      switchMap((post) => {
        if (!post) {
          return of(
            this.persistPostPageState(slug, EMPTY_BLOG_POST_PAGE_STATE),
          );
        }

        const bodyHtml = this.sanity.portableTextToHtml(post.body);
        const preparedPost = this.preparePostViewModel(post);
        return this.sanity.getRelatedPosts(post.slug.current, post.tags ?? [], 3).pipe(
          map((related) =>
            this.persistPostPageState(slug, {
              post: preparedPost,
              bodyHtml,
              relatedPosts: this.normalizeRelatedPosts(related),
            }),
          ),
          catchError(() =>
            of(
              this.persistPostPageState(slug, {
                post: preparedPost,
                bodyHtml,
                relatedPosts: [],
              }),
            ),
          ),
        );
      }),
    );
  }

  private preparePostLoad(): void {
    this.loading = true;
    this.notFound = false;
    this.post = undefined;
    this.bodyHtml = undefined;
    this.relatedPosts = [];
    this.linkCopied = false;
    this.tocItems = [];
    this.tocSectionIds = [];
    this.activeTocId = '';
    this.clearJsonLd();
    this.cdr.markForCheck();
  }

  private takeTransferredPostPageState(
    slug: string,
  ): BlogPostPageState | null {
    if (!this.isBrowser) {
      return null;
    }

    const key = this.getPostPageStateKey(slug);
    if (!this.transferState.hasKey(key)) {
      return null;
    }

    const state = this.transferState.get(key, EMPTY_BLOG_POST_PAGE_STATE);
    this.transferState.remove(key);
    BLOG_POST_PAGE_CACHE.set(slug, state);
    return state;
  }

  private persistPostPageState(
    slug: string,
    state: BlogPostPageState,
  ): BlogPostPageState {
    BLOG_POST_PAGE_CACHE.set(slug, state);

    if (!this.isBrowser) {
      this.transferState.set(this.getPostPageStateKey(slug), state);
    }

    return state;
  }

  private getPostPageStateKey(slug: string) {
    return makeStateKey<BlogPostPageState>(
      `${BLOG_POST_TRANSFER_STATE_PREFIX}${slug}`,
    );
  }

  private preparePostViewModel(post: Post): BlogPostViewModel {
    const { body: _, ...postWithoutBody } = post;
    const normalizedImageUrl =
      post.imageUrl && /^https?:\/\//i.test(post.imageUrl)
        ? post.imageUrl
        : undefined;
    const socialImageUrl = post.ogImageUrl || normalizedImageUrl;
    const resolvedUpdatedAt = this.resolveUpdatedAt(post);

    return {
      ...postWithoutBody,
      updatedAt: resolvedUpdatedAt,
      author: {
        ...post.author,
        imageUrl: this.sanity.optimizeAuthorImageUrl(post.author),
      },
      imageUrl: this.sanity.optimizeImageUrl(normalizedImageUrl, {
        w: 1200,
        h: 675,
      }),
      ogImageUrl: this.sanity.optimizeImageUrl(socialImageUrl, {
        w: 1200,
        h: 630,
      }),
    };
  }

  private normalizeRelatedPosts(related: PostSummary[] = []): PostSummary[] {
    return related.map((relatedPost) => ({
      ...relatedPost,
      imageUrl:
        relatedPost.imageUrl && /^https?:\/\//i.test(relatedPost.imageUrl)
          ? this.sanity.optimizeImageUrl(relatedPost.imageUrl, {
              w: 600,
              h: 338,
            })
          : undefined,
    }));
  }

  private applyLoadedPostPage(pageState: BlogPostPageState): void {
    const post = pageState.post;
    if (!post) {
      return;
    }

    this.post = post;
    const safeBodyHtml =
      this.sanitizer.sanitize(SecurityContext.HTML, pageState.bodyHtml) ?? '';
    this.bodyHtml = this.sanitizer.bypassSecurityTrustHtml(safeBodyHtml);
    this.relatedPosts = pageState.relatedPosts;
    this.loading = false;
    this.notFound = false;
    this.cdr.markForCheck();

    this.applySeo(post);
    this.applyJsonLd(post);
    this.setCanonicalPath(`/blog/${post.slug.current}`);

    if (this.isBrowser) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }

  private applySeo(post: BlogPostViewModel): void {
    const description = (post.seoDescription || post.excerpt || '').slice(
      0,
      160,
    );
    const imageUrl = post.ogImageUrl || post.imageUrl || this.defaultOgImageUrl;
    const title = `${post.title} | ${this.siteBrand}`;
    const url = `${this.siteOrigin}/blog/${post.slug.current}`;

    this.titleService.setTitle(title);
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ name: 'robots', content: 'index, follow' });
    this.metaService.updateTag({ property: 'og:type', content: 'article' });
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({
      property: 'og:description',
      content: description,
    });
    this.metaService.updateTag({ property: 'og:url', content: url });
    this.metaService.updateTag({ property: 'og:image', content: imageUrl });
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
    this.metaService.updateTag({ name: 'twitter:image', content: imageUrl });
    this.metaService.updateTag({
      property: 'article:author',
      content: post.author.name,
    });
    this.metaService.updateTag({
      property: 'article:published_time',
      content: post.publishedAt,
    });
    if (post.updatedAt) {
      this.metaService.updateTag({
        property: 'article:modified_time',
        content: post.updatedAt,
      });
    } else {
      this.metaService.removeTag("property='article:modified_time'");
    }
  }

  private handlePostNotFound(): void {
    if (this.isBrowser) {
      void this.router.navigate(['/404'], { replaceUrl: true });
      return;
    }

    this.resetPostState();
    this.applyFallbackSeo(
      `Artigo não encontrado | ${this.siteBrand}`,
      'O artigo que você procurou não foi encontrado.',
      '/404',
    );
  }

  private handlePostError(): void {
    this.resetPostState();
    this.applyFallbackSeo(
      `Blog | ${this.siteBrand}`,
      'Não foi possível carregar este artigo agora. Tente novamente em instantes.',
      '/blog',
    );
  }

  private resetPostState(): void {
    this.post = undefined;
    this.bodyHtml = undefined;
    this.notFound = true;
    this.loading = false;
    this.relatedPosts = [];
    this.tocItems = [];
    this.tocSectionIds = [];
    this.activeTocId = '';
    this.clearJsonLd();
    this.cdr.markForCheck();
  }

  private applyFallbackSeo(
    title: string,
    description: string,
    path: string,
  ): void {
    const url = `${this.siteOrigin}${path}`;
    this.titleService.setTitle(title);
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ name: 'robots', content: 'noindex, follow' });
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

  private applyJsonLd(post: BlogPostViewModel): void {
    this.clearJsonLd();
    const url = `${this.siteOrigin}/blog/${post.slug.current}`;
    const description = post.seoDescription || post.excerpt || '';
    const imageUrl = post.ogImageUrl || post.imageUrl;

    const ld: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt || post.publishedAt,
      author: {
        '@type': 'Person',
        name: post.author.name,
        ...(post.author.url ? { url: post.author.url } : {}),
        ...(post.author.imageUrl ? { image: post.author.imageUrl } : {}),
      },
      publisher: {
        '@type': 'Person',
        name: 'Alisson Lima',
        url: this.siteOrigin,
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      url,
    };

    if (imageUrl) ld['image'] = imageUrl;
    if (post.tags?.length) ld['keywords'] = post.tags.join(', ');
    if (post.categories?.length) {
      ld['articleSection'] = post.categories.map((c) => c.title).join(', ');
    }

    this.jsonLdScript = this.document.createElement('script');
    this.jsonLdScript.type = 'application/ld+json';
    // Escapa </ para evitar quebra do <script> caso o conteúdo contenha "</script>".
    this.jsonLdScript.textContent = JSON.stringify(ld).replace(/<\//g, '<\\/');
    this.document.head.appendChild(this.jsonLdScript);
  }

  getAuthorInitials(name: string): string {
    return (
      name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join('')
        .toUpperCase() || 'A'
    );
  }

  private clearJsonLd(): void {
    if (this.jsonLdScript) {
      this.jsonLdScript.remove();
      this.jsonLdScript = undefined;
    }
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

  onContentHeadingsChange(items: TocItem[]): void {
    this.tocItems = items;
    this.tocSectionIds = items.map((item) => item.id);
    this.activeTocId = '';
  }

  onActiveTocSectionChange(sectionId: string): void {
    this.activeTocId = sectionId;
  }

  scrollToSection(id: string): void {
    const el = this.document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  get shareUrls(): {
    twitter: string;
    linkedin: string;
    whatsapp: string;
  } | null {
    if (!this.post) return null;
    const url = this.postUrl;
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(this.post.title);
    return {
      twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    };
  }

  get postUrl(): string {
    return this.post ? `${this.siteOrigin}/blog/${this.post.slug.current}` : '';
  }

  onPostLinkCopied(): void {
    const window = this.document.defaultView;
    if (!window) {
      return;
    }

    this.linkCopied = true;
    if (this.linkCopiedTimer !== null) {
      window.clearTimeout(this.linkCopiedTimer);
    }
    this.linkCopiedTimer = window.setTimeout(() => {
      this.linkCopied = false;
      this.linkCopiedTimer = null;
      this.cdr.markForCheck();
    }, 1800);
  }

  hasUpdatedDate(post: BlogPostViewModel): boolean {
    return Boolean(post.updatedAt);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatReadingTime(minutes: number): string {
    return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} de leitura`;
  }

  private getMeaningfulUpdatedAt(
    updatedAt: string | undefined,
    publishedAt: string,
  ): string | undefined {
    if (!updatedAt) {
      return undefined;
    }

    const updatedTime = Date.parse(updatedAt);
    const publishedTime = Date.parse(publishedAt);

    if (
      Number.isNaN(updatedTime) ||
      Number.isNaN(publishedTime) ||
      updatedTime <= publishedTime
    ) {
      return undefined;
    }

    return updatedAt;
  }

  private resolveUpdatedAt(post: Post): string | undefined {
    const editorialUpdatedAt = this.getMeaningfulUpdatedAt(
      post.updatedAt,
      post.publishedAt,
    );

    if (editorialUpdatedAt) {
      return editorialUpdatedAt;
    }

    return this.getFallbackSystemUpdatedAt(
      post.systemCreatedAt,
      post.systemUpdatedAt,
      post.publishedAt,
    );
  }

  private getFallbackSystemUpdatedAt(
    createdAt: string | undefined,
    updatedAt: string | undefined,
    publishedAt: string,
  ): string | undefined {
    const meaningfulSystemUpdatedAt = this.getMeaningfulUpdatedAt(
      updatedAt,
      publishedAt,
    );

    if (!meaningfulSystemUpdatedAt || !createdAt) {
      return undefined;
    }

    const createdTime = Date.parse(createdAt);
    const updatedTime = Date.parse(meaningfulSystemUpdatedAt);

    if (
      Number.isNaN(createdTime) ||
      Number.isNaN(updatedTime) ||
      updatedTime - createdTime < 5 * 60 * 1000
    ) {
      return undefined;
    }

    return meaningfulSystemUpdatedAt;
  }
}
