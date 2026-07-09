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
import { DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { SanityService } from '../services/sanity.service';
import { Category } from '../models/post.model';

@Component({
  selector: 'app-blog-categories',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './blog-categories.component.html',
  styleUrl: './blog-categories.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogCategoriesComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly sanity = inject(SanityService);
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly siteOrigin = 'https://www.alissonlimadev.com';
  private readonly defaultOgImageUrl = `${this.siteOrigin}/assets/img/og-image.webp`;

  categories: Category[] = [];
  loading = true;
  error = false;

  ngOnInit(): void {
    this.applySeo(
      'Categorias | Blog | Alisson Lima Dev',
      'Categorias do blog com conteúdos sobre desenvolvimento web, APIs e integrações.',
      '/blog/categorias',
    );

    this.sanity
      .getCategoriesWithCount()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        // Clarity faz monkey-patch no XHR e quebra o Zone do Angular —
        // por isso forçamos a callback a rodar dentro da zone.
        next: (cats) => {
          this.zone.run(() => {
            this.categories = cats ?? [];
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

  private applySeo(title: string, description: string, path: string): void {
    const url = `${this.siteOrigin}${path}`;
    this.titleService.setTitle(title);
    this.metaService.updateTag({ name: 'description', content: description });
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
}
