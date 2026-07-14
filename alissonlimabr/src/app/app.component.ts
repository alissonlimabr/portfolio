import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DOCUMENT, ViewportScroller, isPlatformBrowser } from '@angular/common';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  Scroll,
} from '@angular/router';
import { fromEvent } from 'rxjs';
import { filter, startWith } from 'rxjs/operators';
import { ReadingPreferencesService } from './blog/services/reading-preferences.service';

import {
  faBars,
  faChevronUp,
  faCode,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import {
  MatSidenav,
  MatSidenavContainer,
  MatSidenavContent,
} from '@angular/material/sidenav';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { JsonLdComponent } from './components/json-ld/json-ld.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { IconComponent } from './shared/icon.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [
    MatSidenavContainer,
    MatSidenav,
    MatSidenavContent,
    FontAwesomeModule,
    JsonLdComponent,
    HeaderComponent,
    FooterComponent,
    IconComponent,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly viewportScroller = inject(ViewportScroller);
  private lastNavigationPath = '';
  private lastScrollHandledPath = '';
  readonly primaryContent =
    viewChild<ElementRef<HTMLElement>>('primaryContent');

  title = 'alissonlimabr';

  faBars = faBars;
  faXmark = faXmark;
  faCode = faCode;
  faChevronUp = faChevronUp;

  opened?: boolean;
  isBlogRoute = false;
  isBlogPostRoute = false;
  isPortfolioHomeRoute = false;
  readonly showScrollTopButton = signal(false);

  private readonly readingPrefs = inject(ReadingPreferencesService);
  readonly currentTheme = computed(() => this.readingPrefs.theme());

  ngOnInit(): void {
    this.updateRouteContext(this.router.url);
    this.lastNavigationPath = this.normalizePath(this.router.url);
    this.lastScrollHandledPath = this.lastNavigationPath;

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const win = window as any;
    win.dataLayer = win.dataLayer || [];

    fromEvent(window, 'scroll')
      .pipe(startWith(null), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateScrollTopButtonVisibility();
      });

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        const nextPath = this.normalizePath(event.urlAfterRedirects);
        const shouldFocusMain =
          nextPath !== this.lastNavigationPath &&
          !this.extractFragment(event.urlAfterRedirects);

        this.updateRouteContext(event.urlAfterRedirects);
        this.updateScrollTopButtonVisibility();

        if (this.isBlogRoute) {
          this.readingPrefs.applyBodyClasses();
        } else {
          this.readingPrefs.removeBlogClasses();
        }

        win.dataLayer.push({
          event: 'page',
          pageName: event.urlAfterRedirects,
        });

        if (shouldFocusMain) {
          this.focusPrimaryContent();
        }

        this.lastNavigationPath = nextPath;
      });

    this.router.events
      .pipe(
        filter((event): event is Scroll => event instanceof Scroll),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        const currentPath = this.getScrollTargetPath(event);

        if (event.position) {
          this.viewportScroller.scrollToPosition(event.position);
          this.lastScrollHandledPath = currentPath;
          return;
        }

        if (event.anchor) {
          this.scrollToAnchor(event.anchor);
          this.lastScrollHandledPath = currentPath;
          return;
        }

        if (currentPath !== this.lastScrollHandledPath) {
          this.viewportScroller.scrollToPosition([0, 0]);
        }

        this.lastScrollHandledPath = currentPath;
      });
  }

  closeSideNav(): void {
    this.opened = false;
  }

  scrollToTop(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleTheme(): void {
    const next: 'dark' | 'light' =
      this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.readingPrefs.setTheme(next);
  }

  private updateRouteContext(url: string): void {
    this.isBlogRoute = url.startsWith('/blog');
    this.isBlogPostRoute = this.isBlogPostUrl(url);
    this.isPortfolioHomeRoute = this.isPortfolioHomeUrl(url);
  }

  private updateScrollTopButtonVisibility(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.showScrollTopButton.set(
      window.scrollY > 560 && this.isPortfolioHomeRoute,
    );
  }

  private isBlogPostUrl(url: string): boolean {
    const normalizedUrl = url.split('?')[0].split('#')[0];

    if (!normalizedUrl.startsWith('/blog/')) {
      return false;
    }

    return !(
      normalizedUrl === '/blog/categorias' ||
      normalizedUrl.startsWith('/blog/categoria/')
    );
  }

  private isPortfolioHomeUrl(url: string): boolean {
    return url.split('?')[0].split('#')[0] === '/';
  }

  private scrollToAnchor(anchor: string, retries = 2): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const view = this.document.defaultView;
    if (!view) {
      return;
    }

    const element = this.document.getElementById(anchor);
    if (!element) {
      if (retries > 0) {
        view.requestAnimationFrame(() =>
          this.scrollToAnchor(anchor, retries - 1),
        );
      }
      return;
    }

    const top =
      element.getBoundingClientRect().top +
      view.scrollY -
      this.getAnchorScrollOffset();

    view.scrollTo({ top, behavior: 'smooth' });
  }

  private focusPrimaryContent(): void {
    const content = this.primaryContent()?.nativeElement;
    if (!content) {
      return;
    }

    const view = this.document.defaultView;
    if (!view) {
      return;
    }

    view.requestAnimationFrame(() => {
      content.focus({ preventScroll: true });
    });
  }

  private getAnchorScrollOffset(): number {
    const view = this.document.defaultView;
    if (!view) {
      return 50;
    }

    const rawValue = view
      .getComputedStyle(this.document.documentElement)
      .getPropertyValue('--app-scroll-offset')
      .trim();
    const parsedValue = Number.parseFloat(rawValue);

    return Number.isFinite(parsedValue) ? parsedValue : 50;
  }

  private getScrollTargetPath(event: Scroll): string {
    const targetUrl =
      'urlAfterRedirects' in event.routerEvent
        ? event.routerEvent.urlAfterRedirects
        : event.routerEvent.url;

    return this.normalizePath(targetUrl);
  }

  private extractFragment(url: string): string {
    const [, fragment = ''] = url.split('#');
    return fragment;
  }

  private normalizePath(url: string): string {
    return url.split('?')[0].split('#')[0] || '/';
  }
}
