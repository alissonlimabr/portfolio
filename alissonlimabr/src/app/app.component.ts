import {
  Component,
  computed,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
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
  ],
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

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
}
