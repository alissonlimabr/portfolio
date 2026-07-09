import {
  Directive,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  Renderer2,
  RendererStyleFlags2,
  inject,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appScrollProgress]',
  standalone: true,
})
export class ScrollProgressDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly zone = inject(NgZone);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  private removeScrollListener?: () => void;
  private animationFrame: number | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const window = this.document.defaultView;
    if (!window) {
      return;
    }

    this.zone.runOutsideAngular(() => {
      const onScroll = () => {
        if (this.animationFrame !== null) {
          return;
        }

        this.animationFrame = window.requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const documentHeight = this.document.documentElement.scrollHeight - window.innerHeight;
          const progress = documentHeight > 0
            ? Math.min(100, (scrollTop / documentHeight) * 100)
            : 0;

          this.renderer.setStyle(
            this.el.nativeElement,
            '--progress',
            `${progress}%`,
            RendererStyleFlags2.DashCase
          );
          this.animationFrame = null;
        });
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      this.removeScrollListener = () => window.removeEventListener('scroll', onScroll);
    });
  }

  ngOnDestroy(): void {
    this.removeScrollListener?.();

    const window = this.document.defaultView;
    if (window && this.animationFrame !== null) {
      window.cancelAnimationFrame(this.animationFrame);
    }
  }
}
