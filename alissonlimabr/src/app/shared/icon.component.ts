import {
  Component,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  input,
  signal,
  effect,
  inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

const cache = new Map<string, string>();

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

  constructor() {
    effect(() => {
      const name = this.name();
      const folder = this.folder();
      const cacheKey = `${folder}/${name}`;
      if (cache.has(cacheKey)) {
        this.svg.set(this.sanitizer.bypassSecurityTrustHtml(cache.get(cacheKey)!));
        return;
      }
      this.http.get(`/assets/${folder}/${name}.svg`, { responseType: 'text' }).subscribe(raw => {
        cache.set(cacheKey, raw);
        this.svg.set(this.sanitizer.bypassSecurityTrustHtml(raw));
      });
    });
  }
}
