import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  PLATFORM_ID,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

const TOC_OPEN_STORAGE_KEY = 'blog-toc-open';

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

@Component({
  selector: 'app-toc',
  standalone: true,
  templateUrl: './toc.component.html',
  styleUrl: './toc.component.scss',
})
export class TocComponent {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly items = input.required<TocItem[]>();
  readonly activeId = input('');
  readonly scrollTo = output<string>();

  readonly isOpen = signal(this.loadOpenState());

  toggle(): void {
    this.isOpen.update((current) => {
      const next = !current;
      this.persistOpenState(next);
      return next;
    });
  }

  onItemClick(id: string, event: Event): void {
    event.preventDefault();
    this.scrollTo.emit(id);
  }

  private loadOpenState(): boolean {
    if (!this.isBrowser) {
      return true;
    }

    try {
      return localStorage.getItem(TOC_OPEN_STORAGE_KEY) !== 'false';
    } catch {
      return true;
    }
  }

  private persistOpenState(isOpen: boolean): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(TOC_OPEN_STORAGE_KEY, String(isOpen));
    } catch {
      // Storage pode estar indisponível em modo privado ou por política do navegador.
    }
  }
}
