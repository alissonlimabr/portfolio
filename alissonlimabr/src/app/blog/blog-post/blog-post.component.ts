import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  Inject,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, Meta, SafeHtml, Title } from '@angular/platform-browser';
import { switchMap } from 'rxjs';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import { SanityService } from '../services/sanity.service';
import { Post, PostSummary } from '../models/post.model';
import { ReadingPreferencesComponent } from '../components/reading-preferences/reading-preferences.component';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [RouterLink, ReadingPreferencesComponent, IconComponent],
  templateUrl: './blog-post.component.html',
  styleUrl: './blog-post.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogPostComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);

  post?: Post;
  bodyHtml?: SafeHtml;
  loading = true;
  notFound = false;
  relatedPosts: PostSummary[] = [];
  linkCopied = false;

  @ViewChild('postContent') postContentRef?: ElementRef<HTMLDivElement>;

  private jsonLdScript?: HTMLScriptElement;
  private readonly siteOrigin = 'https://alissonlimadev.com';

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
            post.imageUrl = this.sanity.optimizeImageUrl(post.imageUrl, { w: 1200, h: 675 });
            post.ogImageUrl = this.sanity.optimizeImageUrl(post.ogImageUrl, { w: 1200, h: 630 });

            this.post = post;
            this.bodyHtml = this.sanitizer.bypassSecurityTrustHtml(
              this.sanity.portableTextToHtml(post.body)
            );
            this.relatedPosts = [];
            this.loading = false;
            this.cdr.markForCheck();

            this.applySeo(post);
            this.applyJsonLd(post);
            this.setCanonical(post.slug.current);
            this.loadRelatedPosts(post.slug.current, post.tags ?? []);

            window.scrollTo({ top: 0, behavior: 'auto' });
            setTimeout(() => this.enhanceCodeBlocks(), 0);
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
    this.clearJsonLd();
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
    const imageUrl = post.ogImageUrl || post.imageUrl || '';
    const title = `${post.title} | Alisson Lima Dev`;
    const url = `${this.siteOrigin}/blog/${post.slug.current}`;

    this.titleService.setTitle(title);
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ property: 'og:type', content: 'article' });
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:url', content: url });
    if (imageUrl) {
      this.metaService.updateTag({ property: 'og:image', content: imageUrl });
    }
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
    if (imageUrl) {
      this.metaService.updateTag({ name: 'twitter:image', content: imageUrl });
    }
    this.metaService.updateTag({ property: 'article:published_time', content: post.publishedAt });
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
      author: {
        '@type': 'Person',
        name: 'Alisson Lima',
        url: this.siteOrigin,
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

  private enhanceCodeBlocks(): void {
    const container = this.postContentRef?.nativeElement;
    if (!container) return;
    Prism.highlightAllUnder(container);
    this.addCopyButtons(container);
  }

  private addCopyButtons(container: HTMLElement): void {
    const pres = container.querySelectorAll<HTMLPreElement>('pre');
    pres.forEach(pre => {
      if (pre.querySelector('.code-copy-btn')) return;
      const btn = this.document.createElement('button');
      btn.type = 'button';
      btn.className = 'code-copy-btn';
      btn.setAttribute('aria-label', 'Copiar código');
      btn.textContent = 'Copiar';
      btn.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        this.handleCopyClick(btn, pre);
      });
      pre.appendChild(btn);
    });
  }

  private handleCopyClick(btn: HTMLButtonElement, pre: HTMLElement): void {
    const code = pre.querySelector('code');
    if (!code) return;
    const text = code.textContent ?? '';
    navigator.clipboard
      .writeText(text)
      .then(() => this.flashButton(btn, 'Copiado', true))
      .catch(() => this.flashButton(btn, 'Falhou', false));
  }

  private flashButton(btn: HTMLButtonElement, label: string, success: boolean): void {
    btn.classList.toggle('copied', success);
    btn.classList.toggle('failed', !success);
    btn.textContent = label;
    setTimeout(() => {
      btn.classList.remove('copied', 'failed');
      btn.textContent = 'Copiar';
    }, 1800);
  }

  get shareUrls(): { twitter: string; linkedin: string; whatsapp: string } | null {
    if (!this.post) return null;
    const url = `${this.siteOrigin}/blog/${this.post.slug.current}`;
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(this.post.title);
    return {
      twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    };
  }

  copyPostLink(): void {
    if (!this.post) return;
    const url = `${this.siteOrigin}/blog/${this.post.slug.current}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        this.linkCopied = true;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.linkCopied = false;
          this.cdr.markForCheck();
        }, 1800);
      })
      .catch(() => {});
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
}
