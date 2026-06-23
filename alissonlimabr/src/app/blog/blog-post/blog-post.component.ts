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
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, Meta, SafeHtml, Title } from '@angular/platform-browser';
import { switchMap } from 'rxjs';
import { SanityService } from '../services/sanity.service';
import { Post, PostSummary } from '../models/post.model';
import { ReadingPreferencesComponent } from '../components/reading-preferences/reading-preferences.component';
import { TocComponent, TocItem } from '../components/toc/toc.component';
import { IconComponent } from '../../shared/icon.component';
import { ActiveSectionDirective } from '../../shared/directives/active-section.directive';
import { CodeBlockEnhancerDirective } from '../../shared/directives/code-block-enhancer.directive';
import { ContentHeadingsDirective } from '../../shared/directives/content-headings.directive';
import { CopyToClipboardDirective } from '../../shared/directives/copy-to-clipboard.directive';
import { ScrollProgressDirective } from '../../shared/directives/scroll-progress.directive';

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

  post?: Post;
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
  private readonly siteOrigin = 'https://alissonlimadev.com';
  private readonly defaultOgImageUrl = 'https://homolog.alissonlimadev.com/assets/img/og-image.webp';

  constructor(
    private route: ActivatedRoute,
    private sanity: SanityService,
    private sanitizer: DomSanitizer,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private titleService: Title,
    private metaService: Meta,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.document.body.classList.add('blog-post-page');
    this.route.paramMap
      .pipe(
        switchMap(params => this.sanity.getPost(params.get('slug')!)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        // Clarity faz monkey-patch no XHR e quebra o Zone do Angular —
        // por isso forçamos a callback a rodar dentro da zone.
        next: post => {
          this.zone.run(() => {
            if (!post) {
              this.notFound = true;
              this.loading = false;
              this.relatedPosts = [];
              this.cdr.markForCheck();
              return;
            }
            if (post.imageUrl && !/^https?:\/\//i.test(post.imageUrl)) {
              post.imageUrl = undefined;
            }
            const socialImageUrl = post.ogImageUrl || post.imageUrl;
            post.imageUrl = this.sanity.optimizeImageUrl(post.imageUrl, { w: 1200, h: 675 });
            post.ogImageUrl = this.sanity.optimizeImageUrl(socialImageUrl, { w: 1200, h: 630 });
            post.author.imageUrl = this.sanity.optimizeAuthorImageUrl(post.author);

            this.post = post;
            const bodyHtml = this.sanity.portableTextToHtml(post.body);
            const safeBodyHtml = this.sanitizer.sanitize(SecurityContext.HTML, bodyHtml) ?? '';
            this.bodyHtml = this.sanitizer.bypassSecurityTrustHtml(safeBodyHtml);
            this.relatedPosts = [];
            this.loading = false;
            this.tocItems = [];
            this.tocSectionIds = [];
            this.activeTocId = '';
            this.cdr.markForCheck();

            this.applySeo(post);
            this.applyJsonLd(post);
            this.setCanonical(post.slug.current);
            this.loadRelatedPosts(post.slug.current, post.tags ?? []);

            if (this.isBrowser) {
              window.scrollTo({ top: 0, behavior: 'auto' });
            }
          });
        },
        error: () => {
          this.zone.run(() => {
            this.notFound = true;
            this.loading = false;
            this.relatedPosts = [];
            this.cdr.markForCheck();
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

  private loadRelatedPosts(slug: string, tags: string[]): void {
    this.sanity
      .getRelatedPosts(slug, tags, 3)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: related => {
        this.zone.run(() => {
          this.relatedPosts = (related ?? []).map(p => ({
            ...p,
            imageUrl:
              p.imageUrl && /^https?:\/\//i.test(p.imageUrl)
                ? this.sanity.optimizeImageUrl(p.imageUrl, { w: 600, h: 338 })
                : undefined,
          }));
          this.cdr.markForCheck();
        });
      },
      error: () => {},
    });
  }

  private applySeo(post: Post): void {
    const description = (post.seoDescription || post.excerpt || '').slice(0, 160);
    const imageUrl = post.ogImageUrl || post.imageUrl || this.defaultOgImageUrl;
    const title = `${post.title} | Alisson Lima Dev`;
    const url = `${this.siteOrigin}/blog/${post.slug.current}`;

    this.titleService.setTitle(title);
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ property: 'og:type', content: 'article' });
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:url', content: url });
    this.metaService.updateTag({ property: 'og:image', content: imageUrl });
    this.metaService.updateTag({ property: 'og:image:width', content: '1200' });
    this.metaService.updateTag({ property: 'og:image:height', content: '630' });
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
    this.metaService.updateTag({ name: 'twitter:image', content: imageUrl });
    this.metaService.updateTag({ property: 'article:author', content: post.author.name });
    this.metaService.updateTag({ property: 'article:published_time', content: post.publishedAt });
    if (post.updatedAt) {
      this.metaService.updateTag({ property: 'article:modified_time', content: post.updatedAt });
    }
  }

  private applyJsonLd(post: Post): void {
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
      ld['articleSection'] = post.categories.map(c => c.title).join(', ');
    }

    this.jsonLdScript = this.document.createElement('script');
    this.jsonLdScript.type = 'application/ld+json';
    // Escapa </ para evitar quebra do <script> caso o conteúdo contenha "</script>".
    this.jsonLdScript.textContent = JSON.stringify(ld).replace(/<\//g, '<\\/');
    this.document.head.appendChild(this.jsonLdScript);
  }

  getAuthorInitials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase() || 'A';
  }

  private clearJsonLd(): void {
    if (this.jsonLdScript) {
      this.jsonLdScript.remove();
      this.jsonLdScript = undefined;
    }
  }

  private setCanonical(slug: string): void {
    let link = this.document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = `${this.siteOrigin}/blog/${slug}`;
  }

  onContentHeadingsChange(items: TocItem[]): void {
    this.tocItems = items;
    this.tocSectionIds = items.map(item => item.id);
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

  get shareUrls(): { twitter: string; linkedin: string; whatsapp: string } | null {
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
    return this.post
      ? `${this.siteOrigin}/blog/${this.post.slug.current}`
      : '';
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

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
}
