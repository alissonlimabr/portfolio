import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbar } from '@angular/material/toolbar';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faCode } from '@fortawesome/free-solid-svg-icons';
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
  @Output() openSidenav = new EventEmitter<void>();
  @Input() isBlogRoute = false;
  @Input() isBlogPostRoute = false;

  readonly faCode = faCode;
  readonly faBars = faBars;
  readonly portfolioSectionIds = [
    'perfil',
    'sobre',
    'habilidades',
    'trabalhos',
    'projetos',
    'blog',
    'contato',
  ];
  readonly prefs = inject(ReadingPreferencesService);
  readonly currentTheme = computed(() => this.prefs.theme());
  private readonly activePortfolioHash = signal('#perfil');

  toggleTheme(): void {
    const next: 'dark' | 'light' =
      this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.prefs.setTheme(next);
  }

  isPortfolioLinkActive(fragment: string): boolean {
    return this.activePortfolioHash() === `#${fragment}`;
  }

  onActivePortfolioSectionChange(sectionId: string): void {
    this.activePortfolioHash.set(`#${sectionId}`);
  }
}
