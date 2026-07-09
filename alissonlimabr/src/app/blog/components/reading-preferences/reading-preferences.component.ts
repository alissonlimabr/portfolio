import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, HostListener, PLATFORM_ID, inject, signal } from '@angular/core';
import { IconComponent } from '../../../shared/icon.component';
import { ReadingPreferencesService } from '../../services/reading-preferences.service';

@Component({
  selector: 'app-reading-preferences',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './reading-preferences.component.html',
  styleUrl: './reading-preferences.component.scss',
})
export class ReadingPreferencesComponent {
  readonly prefs = inject(ReadingPreferencesService);
  readonly open = signal(false);

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly el = inject(ElementRef);
  readonly collapsed = signal(this.loadCollapsed());

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.open.update(value => !value);
  }

  toggleCollapsed(): void {
    this.collapsed.update(value => {
      const next = !value;
      if (this.isBrowser) {
        try {
          localStorage.setItem('blog-rp-collapsed', String(next));
        } catch {
          // Storage pode estar indisponível em modo privado ou por política do navegador.
        }
      }
      return next;
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (this.open() && !this.el.nativeElement.contains(event.target)) {
      this.open.set(false);
    }
  }

  private loadCollapsed(): boolean {
    if (!this.isBrowser) return false;
    try {
      return localStorage.getItem('blog-rp-collapsed') === 'true';
    } catch {
      return false;
    }
  }
}
