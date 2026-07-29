import {
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
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

  private readonly el = inject(ElementRef);
  private readonly hasStorage = typeof localStorage !== 'undefined';
  readonly collapsed = signal(this.loadCollapsed());

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.open.update((value) => !value);
  }

  toggleCollapsed(event: MouseEvent): void {
    event.stopPropagation();
    this.collapsed.update((value) => {
      const next = !value;
      this.persistCollapsed(next);
      return next;
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open.set(false);
    this.collapsed.set(true);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.open.set(false);
      this.collapsed.set(true);
    }
  }

  private loadCollapsed(): boolean {
    if (!this.hasStorage) return true;
    try {
      return localStorage.getItem('blog-rp-collapsed') !== 'false';
    } catch {
      return false;
    }
  }

  private persistCollapsed(value: boolean): void {
    if (!this.hasStorage) return;
    try {
      localStorage.setItem('blog-rp-collapsed', String(value));
    } catch {
      // Storage pode estar indisponível em modo privado ou por política do navegador.
    }
  }
}
