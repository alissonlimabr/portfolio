import {
  DestroyRef,
  Directive,
  ElementRef,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  Renderer2,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appMagnetic]',
  standalone: true,
})
export class MagneticDirective implements OnInit, OnDestroy {
  @Input() magneticStrength = 0.3;

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly zone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  private animationFrame: number | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)');
    this.renderer.setStyle(this.el.nativeElement, 'will-change', 'transform');
    this.destroyRef.onDestroy(() => {
      if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
    });
  }

  ngOnDestroy(): void {
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.zone.runOutsideAngular(() => {
      const rect = this.el.nativeElement.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      this.applyTransform(x * this.magneticStrength, y * this.magneticStrength);
    });
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.zone.runOutsideAngular(() => {
      this.applyTransform(0, 0);
    });
  }

  private applyTransform(x: number, y: number): void {
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = requestAnimationFrame(() => {
      this.renderer.setStyle(this.el.nativeElement, 'transform', `translate3d(${x}px, ${y}px, 0)`);
    });
  }
}
