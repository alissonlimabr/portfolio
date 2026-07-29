import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SwipeDirective } from './swipe.directive';

@Component({
  standalone: true,
  imports: [SwipeDirective],
  template: `
    <div appSwipe>
      <article></article>
      <article></article>
    </div>
  `,
})
class SwipeHostComponent {}

describe('SwipeDirective', () => {
  let fixture: ComponentFixture<SwipeHostComponent>;
  let rail: HTMLElement;
  let scrollPosition: number;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwipeHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SwipeHostComponent);
    fixture.detectChanges();
    rail = fixture.nativeElement.querySelector('[appSwipe]');
    scrollPosition = 0;

    Object.defineProperties(rail, {
      clientWidth: { configurable: true, value: 300 },
      scrollWidth: { configurable: true, value: 900 },
      scrollLeft: {
        configurable: true,
        get: () => scrollPosition,
        set: (value: number) => {
          scrollPosition = value;
        },
      },
    });
  });

  it('smoothly converts the mouse wheel into horizontal scrolling', () => {
    let animationFrame: FrameRequestCallback | undefined;
    const requestAnimationFrame = spyOn(
      window,
      'requestAnimationFrame',
    ).and.callFake((callback: FrameRequestCallback) => {
      animationFrame = callback;
      return 1;
    });
    const event = new WheelEvent('wheel', {
      cancelable: true,
      deltaY: 120,
    });

    rail.dispatchEvent(event);

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(scrollPosition).toBe(0);
    expect(event.defaultPrevented).toBeTrue();

    animationFrame?.(0);

    expect(scrollPosition).toBeGreaterThan(0);
    expect(scrollPosition).toBeLessThan(120);
  });

  it('releases vertical scrolling when the rail reaches its edge', () => {
    scrollPosition = 600;
    const event = new WheelEvent('wheel', {
      cancelable: true,
      deltaY: 120,
    });

    rail.dispatchEvent(event);

    expect(scrollPosition).toBe(600);
    expect(event.defaultPrevented).toBeFalse();
  });

  it('is keyboard focusable', () => {
    expect(rail.getAttribute('tabindex')).toBe('0');
  });

  it('does not block a card click when the pointer did not drag', () => {
    const directive =
      fixture.debugElement.children[0].injector.get(SwipeDirective);
    const setPointerCapture = spyOn(rail, 'setPointerCapture');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    directive.onPointerDown(
      new PointerEvent('pointerdown', {
        button: 0,
        clientX: 120,
        clientY: 40,
        pointerId: 1,
        pointerType: 'mouse',
      }),
    );
    directive.onPointerMove(
      new PointerEvent('pointermove', {
        clientX: 126,
        clientY: 42,
        pointerId: 1,
        pointerType: 'mouse',
      }),
    );
    directive.onPointerEnd(
      new PointerEvent('pointerup', {
        clientX: 126,
        clientY: 42,
        pointerId: 1,
        pointerType: 'mouse',
      }),
    );
    directive.onClick(click);

    expect(click.defaultPrevented).toBeFalse();
    expect(setPointerCapture).not.toHaveBeenCalled();
  });
});
