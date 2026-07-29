import {
  AfterViewInit,
  Directive,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  Renderer2,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appImageLoadState]',
  standalone: true,
  host: {
    '[class.image-load-shell--loaded]': 'loaded()',
    '[class.image-load-shell--error]': 'failed()',
  },
})
export class ImageLoadStateDirective implements AfterViewInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly removeListeners: Array<() => void> = [];
  private destroyed = false;

  protected readonly loaded = signal(false);
  protected readonly failed = signal(false);

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }

    const image = this.host.nativeElement.querySelector('img');
    if (!image) {
      return;
    }

    this.removeListeners.push(
      this.renderer.listen(image, 'load', () => this.markLoaded()),
      this.renderer.listen(image, 'error', () => this.markFailed()),
    );

    // A imagem pode terminar de carregar antes de a hidratação registrar o
    // listener. A checagem no próximo microtask cobre cache quente e prerender.
    queueMicrotask(() => {
      if (this.destroyed || !image.complete) {
        return;
      }

      if (image.naturalWidth > 0) {
        this.markLoaded();
      } else {
        this.markFailed();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.removeListeners.forEach((removeListener) => removeListener());
    this.removeListeners.length = 0;
  }

  private markLoaded(): void {
    this.failed.set(false);
    this.loaded.set(true);
  }

  private markFailed(): void {
    this.loaded.set(false);
    this.failed.set(true);
  }
}
