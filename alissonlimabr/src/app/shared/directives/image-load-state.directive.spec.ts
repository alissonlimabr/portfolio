import { Component } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
} from '@angular/core/testing';
import { ImageLoadStateDirective } from './image-load-state.directive';

@Component({
  standalone: true,
  imports: [ImageLoadStateDirective],
  template: `
    <div class="image-load-shell" appImageLoadState>
      <img
        src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
        alt="Capa de teste"
      />
    </div>
  `,
})
class ImageLoadStateHostComponent {}

describe('ImageLoadStateDirective', () => {
  let fixture: ComponentFixture<ImageLoadStateHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageLoadStateHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageLoadStateHostComponent);
  });

  it('marks the shell as loaded when the image emits load', () => {
    fixture.detectChanges();
    const shell = fixture.nativeElement.querySelector('.image-load-shell');
    const image = shell.querySelector('img') as HTMLImageElement;

    image.dispatchEvent(new Event('load'));
    fixture.detectChanges();

    expect(shell.classList.contains('image-load-shell--loaded')).toBeTrue();
    expect(shell.classList.contains('image-load-shell--error')).toBeFalse();
  });

  it('marks the shell as failed and stops the loading state on error', () => {
    fixture.detectChanges();
    const shell = fixture.nativeElement.querySelector('.image-load-shell');
    const image = shell.querySelector('img') as HTMLImageElement;

    image.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(shell.classList.contains('image-load-shell--loaded')).toBeFalse();
    expect(shell.classList.contains('image-load-shell--error')).toBeTrue();
  });

  it('recognizes an image that loaded before its listeners were registered', fakeAsync(() => {
    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    Object.defineProperty(image, 'complete', { configurable: true, value: true });
    Object.defineProperty(image, 'naturalWidth', { configurable: true, value: 600 });

    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    const shell = fixture.nativeElement.querySelector('.image-load-shell');
    expect(shell.classList.contains('image-load-shell--loaded')).toBeTrue();
  }));
});
