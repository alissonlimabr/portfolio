import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  OnDestroy,
  Output,
  PLATFORM_ID,
  Renderer2,
  inject,
} from '@angular/core';

@Directive({
  selector: '[appSwipe]',
  standalone: true,
})
export class SwipeDirective implements AfterViewInit, OnDestroy {
  @Output() readonly swipeLeft = new EventEmitter<void>();
  @Output() readonly swipeRight = new EventEmitter<void>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private pointerId: number | null = null;
  private pointerStartX = 0;
  private pointerStartScrollLeft = 0;
  private pointerDeltaX = 0;
  private dragged = false;
  private suppressNextClick = false;
  private removeWheelListener?: () => void;

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }

    if (!this.element.hasAttribute('tabindex')) {
      this.renderer.setAttribute(this.element, 'tabindex', '0');
    }

    const wheelListener = (event: WheelEvent) => this.onWheel(event);
    this.element.addEventListener('wheel', wheelListener, { passive: false });
    this.removeWheelListener = () =>
      this.element.removeEventListener('wheel', wheelListener);
  }

  ngOnDestroy(): void {
    this.removeWheelListener?.();
  }

  onWheel(event: WheelEvent): void {
    if (!this.isBrowser || !this.hasHorizontalOverflow()) {
      return;
    }

    const rawDelta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;
    const deltaMultiplier =
      event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? this.element.clientWidth
          : 1;
    const delta = rawDelta * deltaMultiplier;
    if (Math.abs(delta) < 1 || !this.canScroll(delta)) {
      return;
    }

    event.preventDefault();
    this.element.scrollLeft = this.clampScrollLeft(
      this.element.scrollLeft + delta,
    );
  }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    if (
      !this.isBrowser ||
      event.pointerType === 'touch' ||
      event.button !== 0 ||
      !this.hasHorizontalOverflow()
    ) {
      return;
    }

    this.pointerId = event.pointerId;
    this.pointerStartX = event.clientX;
    this.pointerStartScrollLeft = this.element.scrollLeft;
    this.pointerDeltaX = 0;
    this.dragged = false;
    this.element.setPointerCapture?.(event.pointerId);
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (this.pointerId !== event.pointerId) {
      return;
    }

    this.pointerDeltaX = event.clientX - this.pointerStartX;
    if (Math.abs(this.pointerDeltaX) < 5) {
      return;
    }

    event.preventDefault();
    this.dragged = true;
    this.renderer.addClass(this.element, 'is-dragging');
    this.element.scrollLeft = this.clampScrollLeft(
      this.pointerStartScrollLeft - this.pointerDeltaX,
    );
  }

  @HostListener('pointerup', ['$event'])
  @HostListener('pointercancel', ['$event'])
  onPointerEnd(event: PointerEvent): void {
    if (this.pointerId !== event.pointerId) {
      return;
    }

    if (this.dragged && event.type === 'pointerup') {
      this.suppressNextClick = true;
      this.pointerDeltaX < 0
        ? this.swipeLeft.emit()
        : this.swipeRight.emit();
      this.element.ownerDocument.defaultView?.setTimeout(() => {
        this.suppressNextClick = false;
      });
    }

    if (this.element.hasPointerCapture?.(event.pointerId)) {
      this.element.releasePointerCapture(event.pointerId);
    }
    this.pointerId = null;
    this.renderer.removeClass(this.element, 'is-dragging');
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (!this.suppressNextClick) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    this.suppressNextClick = false;
  }

  @HostListener('keydown.arrowleft', ['$event'])
  onArrowLeft(event: Event): void {
    this.scrollByCard(-1, event);
    this.swipeRight.emit();
  }

  @HostListener('keydown.arrowright', ['$event'])
  onArrowRight(event: Event): void {
    this.scrollByCard(1, event);
    this.swipeLeft.emit();
  }

  private scrollByCard(direction: -1 | 1, event: Event): void {
    const firstCard = this.element.firstElementChild as HTMLElement | null;
    const cardWidth = firstCard?.offsetWidth ?? this.element.clientWidth;
    const styles = this.element.ownerDocument.defaultView?.getComputedStyle(
      this.element,
    );
    const gap = Number.parseFloat(styles?.columnGap || styles?.gap || '0');
    const delta = direction * (cardWidth + gap);

    if (!this.hasHorizontalOverflow() || !this.canScroll(delta)) {
      return;
    }

    event.preventDefault();
    const reduceMotion = this.element.ownerDocument.defaultView?.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    this.element.scrollBy({
      left: delta,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }

  private hasHorizontalOverflow(): boolean {
    return this.maxScrollLeft > 1;
  }

  private canScroll(delta: number): boolean {
    return delta > 0
      ? this.element.scrollLeft < this.maxScrollLeft - 1
      : this.element.scrollLeft > 1;
  }

  private clampScrollLeft(value: number): number {
    return Math.min(Math.max(value, 0), this.maxScrollLeft);
  }

  private get maxScrollLeft(): number {
    return Math.max(this.element.scrollWidth - this.element.clientWidth, 0);
  }

  private get element(): HTMLElement {
    return this.host.nativeElement;
  }
}
