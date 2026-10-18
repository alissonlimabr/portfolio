import {
  Component,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  DestroyRef,
  ElementRef,
  input,
  signal,
  effect,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';

const cache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<span class="app-icon-inner" [innerHTML]="svg()"></span>`,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    app-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    app-icon .app-icon-inner {
      display: contents;
    }
    app-icon svg {
      width: 100%;
      height: 100%;
    }
  `],
  host: {
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    'aria-hidden': 'true',
  },
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly folder = input('icons');
  readonly size = input<number | null>(null);

  readonly svg = signal<SafeHtml>('');

  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: IntersectionObserver;
  private currentKey = '';

  constructor() {
    inject(DestroyRef).onDestroy(() => this.observer?.disconnect());

    effect(() => {
      if (!this.isBrowser) {
        return;
      }
      const key = `${this.folder()}/${this.name()}`;
      this.currentKey = key;
      this.observer?.disconnect();

      const cached = cache.get(key);
      if (cached !== undefined) {
        this.render(cached);
        return;
      }
      this.whenNearViewport(() => this.load(key));
    });
  }

  private whenNearViewport(run: () => void): void {
    if (typeof IntersectionObserver === 'undefined') {
      run();
      return;
    }
    this.observer = new IntersectionObserver(
      (entries, observer) => {
        if (entries.some(entry => entry.isIntersecting)) {
          observer.disconnect();
          run();
        }
      },
      { rootMargin: '300px' },
    );
    this.observer.observe(this.host.nativeElement);
  }

  private load(key: string): void {
    const cached = cache.get(key);
    if (cached !== undefined) {
      this.render(cached);
      return;
    }
    let request = pending.get(key);
    if (!request) {
      request = firstValueFrom(this.http.get(`/assets/${key}.svg`, { responseType: 'text' }))
        .then(raw => {
          cache.set(key, raw);
          return raw;
        })
        .finally(() => pending.delete(key));
      pending.set(key, request);
    }
    request.then(raw => {
      if (key === this.currentKey) {
        this.render(raw);
      }
    }).catch(() => undefined);
  }

  private render(raw: string): void {
    this.svg.set(this.sanitizer.bypassSecurityTrustHtml(raw));
  }
}
