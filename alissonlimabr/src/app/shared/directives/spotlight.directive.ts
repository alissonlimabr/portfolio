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

@Directive({
  selector: '[appSpotlight]',
  standalone: true,
})
export class SpotlightDirective implements OnInit, OnDestroy {
  @Input() spotlightActiveClass = 'is-spotlight-active';

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly zone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.renderer.setStyle(this.el.nativeElement, '--spotlight-x', '50%');
    this.renderer.setStyle(this.el.nativeElement, '--spotlight-y', '50%');
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(this.el.nativeElement, this.spotlightActiveClass);
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const rect = this.el.nativeElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    this.renderer.setStyle(this.el.nativeElement, '--spotlight-x', `${x}%`);
    this.renderer.setStyle(this.el.nativeElement, '--spotlight-y', `${y}%`);
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.zone.runOutsideAngular(() => {
      this.renderer.addClass(this.el.nativeElement, this.spotlightActiveClass);
    });
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.zone.runOutsideAngular(() => {
      this.renderer.removeClass(this.el.nativeElement, this.spotlightActiveClass);
      this.renderer.setStyle(this.el.nativeElement, '--spotlight-x', '50%');
      this.renderer.setStyle(this.el.nativeElement, '--spotlight-y', '50%');
    });
  }
}
