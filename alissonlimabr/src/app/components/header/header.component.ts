import { isPlatformBrowser } from '@angular/common';
import { Component, EventEmitter, HostListener, Inject, Input, OnChanges, OnInit, Output, PLATFORM_ID, SimpleChanges } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbar } from '@angular/material/toolbar';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faCode, faXmark } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: true,
  imports: [
    FontAwesomeModule,
    MatToolbar,
    RouterLink,
    RouterLinkActive,
  ],
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnChanges {
  @Output() openSidenav = new EventEmitter();
  @Input() isBlogRoute = false;

  faCode = faCode;
  faBars = faBars;
  faXmark = faXmark;
  opened?: boolean;
  activePortfolioHash = '';
  private readonly portfolioSectionIds = ['perfil', 'sobre', 'habilidades', 'trabalhos', 'projetos', 'contato'];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    this.syncActivePortfolioLink();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isBlogRoute']) {
      this.syncActivePortfolioLink();
    }
  }

  @HostListener('window:hashchange')
  onHashChange(): void {
    this.syncActivePortfolioLink();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.updateActivePortfolioSectionByScroll();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateActivePortfolioSectionByScroll();
  }

  isPortfolioLinkActive(fragment: string): boolean {
    const hash = this.activePortfolioHash || '#perfil';
    return hash === `#${fragment}`;
  }

  closeSideNav() {
    this.opened = false;
  }

  private syncActivePortfolioLink(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.isBlogRoute) {
      return;
    }

    if (window.location.hash) {
      this.activePortfolioHash = window.location.hash;
      return;
    }

    this.updateActivePortfolioSectionByScroll();
  }

  private updateActivePortfolioSectionByScroll(): void {
    if (!isPlatformBrowser(this.platformId) || this.isBlogRoute) {
      return;
    }

    const sections = this.portfolioSectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);

    if (!sections.length) {
      return;
    }

    const scrollPosition = window.scrollY + 160;
    let activeId = sections[0].id;

    for (const section of sections) {
      if (section.offsetTop <= scrollPosition) {
        activeId = section.id;
      }
    }

    this.activePortfolioHash = `#${activeId}`;
  }
}
