import {
  Directive,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appCounter]',
  standalone: true,
})
export class CounterDirective implements OnInit, OnDestroy {
  @Input('appCounter') target = 0;
  @Input() counterDuration = 1500;
  @Input() counterPrefix = '';
  @Input() counterSuffix = '';

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly zone = inject(NgZone);

  private hasAnimated = false;
  private observer: IntersectionObserver | null = null;
  private rafId: number | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.el.nativeElement.textContent = `${this.counterPrefix}${this.target}${this.counterSuffix}`;
      return;
    }
    this.el.nativeElement.textContent = `${this.counterPrefix}0${this.counterSuffix}`;
    this.zone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            if (entry.isIntersecting && !this.hasAnimated) {
              this.hasAnimated = true;
              this.animate();
              this.disconnectObserver();
            }
          }
        },
        { threshold: 0.4 }
      );
      this.observer.observe(this.el.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.disconnectObserver();
    this.cancelAnimation();
  }

  private disconnectObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  private cancelAnimation(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private animate(): void {
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / this.counterDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * this.target);
      this.el.nativeElement.textContent = `${this.counterPrefix}${current}${this.counterSuffix}`;
      if (progress < 1) this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }
}
