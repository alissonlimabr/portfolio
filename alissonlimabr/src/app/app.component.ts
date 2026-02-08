import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';

import { faBars, faCode, faXmark } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'alissonlimabr';

  faBars = faBars;
  faXmark = faXmark;
  faCode = faCode;

  opened?: boolean;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // 🔒 SSR guard absoluto
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Garante dataLayer no browser
    const win = window as any;
    win.dataLayer = win.dataLayer || [];

    // Pageview a cada navegação
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd =>
            event instanceof NavigationEnd
        )
      )
      .subscribe((event) => {
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
