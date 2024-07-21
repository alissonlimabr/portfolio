import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { faBars, faCode, faXmark } from '@fortawesome/free-solid-svg-icons';
import { GoogleTagManagerService } from 'angular-google-tag-manager';

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
    private gtmService: GoogleTagManagerService,
    private router: Router
  ) {
    gtmService.addGtmToDom();
  }

  ngOnInit(): void {
    this.router.events.forEach((item) => {
      if (item instanceof NavigationEnd) {
        const gtmTag = {
          event: 'page',
          pageName: item.url,
        };

        this.gtmService.pushTag(gtmTag);
      }
    });
  }

  closeSideNav() {
    this.opened = false;
  }
}
