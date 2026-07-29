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

  it('converts the mouse wheel into horizontal scrolling', () => {
    const event = new WheelEvent('wheel', {
      cancelable: true,
      deltaY: 120,
    });

    rail.dispatchEvent(event);

    expect(scrollPosition).toBe(120);
    expect(event.defaultPrevented).toBeTrue();
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
});
