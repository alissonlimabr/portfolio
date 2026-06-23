import { Component, EventEmitter, Input, Output, ViewEncapsulation, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbar } from '@angular/material/toolbar';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faCode, faXmark } from '@fortawesome/free-solid-svg-icons';
import { ReadingPreferencesService } from '../../blog/services/reading-preferences.service';
import { IconComponent } from '../../shared/icon.component';
import { ActiveSectionDirective } from '../../shared/directives/active-section.directive';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: true,
  imports: [
    FontAwesomeModule,
    MatToolbar,
    RouterLink,
    RouterLinkActive,
    IconComponent,
    ActiveSectionDirective,
  ],
  styleUrls: ['./header.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent {
  @Output() openSidenav = new EventEmitter();
  @Input() isBlogRoute = false;

  faCode = faCode;
  faBars = faBars;
  faXmark = faXmark;
  opened?: boolean;
  activePortfolioHash = '';
  readonly portfolioSectionIds = ['perfil', 'sobre', 'habilidades', 'trabalhos', 'projetos', 'blog', 'contato'];
  readonly prefs = inject(ReadingPreferencesService);

  get currentTheme() {
    return this.prefs.theme();
  }

  toggleTheme(): void {
    const next: 'dark' | 'light' = this.prefs.theme() === 'dark' ? 'light' : 'dark';
    this.prefs.setTheme(next);
  }

  isPortfolioLinkActive(fragment: string): boolean {
    const hash = this.activePortfolioHash || '#perfil';
    return hash === `#${fragment}`;
  }

  onActivePortfolioSectionChange(sectionId: string): void {
    this.activePortfolioHash = `#${sectionId}`;
  }

  closeSideNav() {
    this.opened = false;
  }
}
