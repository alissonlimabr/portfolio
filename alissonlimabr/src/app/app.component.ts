import { Component, DestroyRef, Inject, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';

import { faBars, faCode, faXmark } from '@fortawesome/free-solid-svg-icons';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { JsonLdComponent } from './components/json-ld/json-ld.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';

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
    RouterOutlet,
    RouterLink,
  ],
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  title = 'alissonlimabr';

  faBars = faBars;
  faXmark = faXmark;
  faCode = faCode;

  opened?: boolean;
  isBlogRoute = false;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.isBlogRoute = this.router.url.startsWith('/blog');

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const win = window as any;
    win.dataLayer = win.dataLayer || [];

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd =>
            event instanceof NavigationEnd
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => {
        this.isBlogRoute = event.urlAfterRedirects.startsWith('/blog');
        win.dataLayer.push({
          event: 'page',
          pageName: event.urlAfterRedirects,
        });
      });
  }

  closeSideNav(): void {
    this.opened = false;
  }
}
