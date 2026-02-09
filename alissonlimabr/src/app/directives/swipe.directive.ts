import {
  Directive,
  EventEmitter,
  HostListener,
  Output,
  Inject,
  PLATFORM_ID
} from '@angular/core';

@Directive({
  selector: '[appSwipe]',
  standalone: true,
})
export class SwipeDirective {
  @Output() swipeLeft = new EventEmitter<void>();
  @Output() swipeRight = new EventEmitter<void>();

  private startX = 0;
  private startY = 0;
  private threshold = 70;

  @HostListener('touchstart', ['$event'])
  onTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    this.startX = t.clientX;
    this.startY = t.clientY;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(e: TouchEvent) {
    const t = e.changedTouches[0];
    this.handleSwipe(t.clientX, t.clientY);
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(e: MouseEvent) {
    this.startX = e.clientX;
    this.startY = e.clientY;
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(e: MouseEvent) {
    this.handleSwipe(e.clientX, e.clientY);
  }

  @HostListener('keydown.arrowleft')
  onArrowLeft() {
    this.swipeRight.emit();
  }

  @HostListener('keydown.arrowright')
  onArrowRight() {
    this.swipeLeft.emit();
  }

  private handleSwipe(x: number, y: number) {
    // Bloqueia swipe se houver seleção de texto
    const selection = window.getSelection?.();
    if (selection && selection.toString().length > 0) {
      return;
    }

    const dx = x - this.startX;
    const dy = y - this.startY;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > this.threshold) {
      dx > 0 ? this.swipeRight.emit() : this.swipeLeft.emit();
    }
  }
}
