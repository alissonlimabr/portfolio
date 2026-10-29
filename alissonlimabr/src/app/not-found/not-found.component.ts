import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, inject, ChangeDetectionStrategy } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { SITE_BRAND, SITE_ORIGIN } from '../shared/constants/site.constants';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './not-found.component.scss',
})
export class NotFoundComponent implements OnInit, OnDestroy {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly document = inject(DOCUMENT);
  // Caminho pedido pelo visitante. Vazio no build: o HTML pré-renderizado é o mesmo para
  // qualquer URL, então a requisição só é exibida no navegador, sem trocar texto na tela.
  readonly path = isPlatformBrowser(inject(PLATFORM_ID)) ? inject(Router).url.split(/[?#]/)[0] : '';
  private readonly siteOrigin = SITE_ORIGIN;
  private readonly siteBrand = SITE_BRAND;
  private readonly defaultOgImageUrl = `${this.siteOrigin}/assets/img/og-image.webp`;

  ngOnInit(): void {
    this.applySeo();
  }

  ngOnDestroy(): void {
    this.metaService.removeTag("name='robots'");
  }

  private applySeo(): void {
    const title = `Página não encontrada | ${this.siteBrand}`;
    const description =
      'A página solicitada não existe ou foi movida. Explore o portfólio ou volte para o blog.';
    const url = `${this.siteOrigin}/404`;

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
    this.metaService.updateTag({
      property: 'og:image:height',
      content: '630',
    });
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
    this.setCanonicalPath('/404');
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
