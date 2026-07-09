import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrollProgressDirective } from './scroll-progress.directive';

@Component({
  standalone: true,
  imports: [ScrollProgressDirective],
  template: '<div class="progress" appScrollProgress></div>',
})
class ScrollProgressHostComponent {}

describe('ScrollProgressDirective', () => {
  let fixture: ComponentFixture<ScrollProgressHostComponent>;
  let scrollYDescriptor: PropertyDescriptor | undefined;
  let innerHeightDescriptor: PropertyDescriptor | undefined;
  let scrollHeightDescriptor: PropertyDescriptor | undefined;

  beforeEach(async () => {
    scrollYDescriptor = Object.getOwnPropertyDescriptor(window, 'scrollY');
    innerHeightDescriptor = Object.getOwnPropertyDescriptor(window, 'innerHeight');
    scrollHeightDescriptor = Object.getOwnPropertyDescriptor(document.documentElement, 'scrollHeight');

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 500 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 3000,
    });

    await TestBed.configureTestingModule({
      imports: [ScrollProgressHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScrollProgressHostComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    restoreProperty(window, 'scrollY', scrollYDescriptor);
    restoreProperty(window, 'innerHeight', innerHeightDescriptor);
    restoreProperty(document.documentElement, 'scrollHeight', scrollHeightDescriptor);
  });

  it('updates the progress CSS property when the window scrolls', async () => {
    const progress = fixture.nativeElement.querySelector('.progress') as HTMLElement;

    window.dispatchEvent(new Event('scroll'));
    await nextAnimationFrame();

    expect(progress.style.getPropertyValue('--progress')).toBe('25%');
  });
});

function nextAnimationFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

function restoreProperty(
  target: object,
  property: PropertyKey,
  descriptor: PropertyDescriptor | undefined
): void {
  if (descriptor) {
    Object.defineProperty(target, property, descriptor);
  } else {
    delete (target as Record<PropertyKey, unknown>)[property];
  }
}
