import {
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

const MOUSE_TRANSITION = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
const PRESS_TRANSITION = 'transform 0.12s ease-out';
const RELEASE_TRANSITION = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';

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

  private animationFrame: number | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.renderer.setStyle(this.el.nativeElement, 'will-change', 'transform');
  }

  ngOnDestroy(): void {
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
  }

  // Efeito magnético apenas com mouse
  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    this.zone.runOutsideAngular(() => {
      const rect = this.el.nativeElement.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      this.applyTransform(
        `translate3d(${x * this.magneticStrength}px, ${y * this.magneticStrength}px, 0)`,
        MOUSE_TRANSITION,
      );
    });
  }

  // No toque, o elemento afunda ao pressionar e volta ao soltar
  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse') return;
    this.zone.runOutsideAngular(() => this.applyTransform('scale(0.94)', PRESS_TRANSITION));
  }

  @HostListener('pointerup', ['$event'])
  @HostListener('pointercancel', ['$event'])
  onPointerRelease(event: PointerEvent): void {
    if (event.pointerType === 'mouse') return;
    this.zone.runOutsideAngular(() => this.applyTransform('none', RELEASE_TRANSITION));
  }

  @HostListener('pointerleave', ['$event'])
  onPointerLeave(event: PointerEvent): void {
    const transition = event.pointerType === 'mouse' ? MOUSE_TRANSITION : RELEASE_TRANSITION;
    this.zone.runOutsideAngular(() => this.applyTransform('none', transition));
  }

  private applyTransform(transform: string, transition: string): void {
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = requestAnimationFrame(() => {
      this.renderer.setStyle(this.el.nativeElement, 'transition', transition);
      this.renderer.setStyle(this.el.nativeElement, 'transform', transform);
    });
  }
}
