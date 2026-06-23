import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { CodeBlockEnhancerDirective } from './code-block-enhancer.directive';

@Component({
  standalone: true,
  imports: [CodeBlockEnhancerDirective],
  template: `
    <div
      class="content"
      [innerHTML]="html"
      [appCodeBlockEnhancer]="html"
    ></div>
  `,
})
class CodeBlockEnhancerHostComponent {
  html = '<pre><code class="language-typescript">const value = 1;</code></pre>';
}

describe('CodeBlockEnhancerDirective', () => {
  let fixture: ComponentFixture<CodeBlockEnhancerHostComponent>;
  let writeText: jasmine.Spy;
  let originalClipboard: PropertyDescriptor | undefined;

  beforeEach(async () => {
    originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    writeText = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    await TestBed.configureTestingModule({
      imports: [CodeBlockEnhancerHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CodeBlockEnhancerHostComponent);
  });

  afterEach(() => {
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', originalClipboard);
    } else {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
  });

  it('adds a single copy button to each rendered code block', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    tick();

    const buttons = fixture.nativeElement.querySelectorAll('.code-copy-btn');

    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent).toBe('Copiar');
  }));

  it('copies code and preserves the current feedback labels and duration', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    const button = fixture.nativeElement.querySelector('.code-copy-btn') as HTMLButtonElement;

    button.click();
    flushMicrotasks();

    expect(writeText).toHaveBeenCalledOnceWith('const value = 1;');
    expect(button.textContent).toBe('Copiado');
    expect(button.classList.contains('copied')).toBeTrue();

    tick(1800);

    expect(button.textContent).toBe('Copiar');
    expect(button.classList.contains('copied')).toBeFalse();
  }));

  it('does not duplicate buttons when the content input is checked again', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    fixture.componentInstance.html =
      '<pre><code class="language-typescript">const value = 2;</code></pre>';
    fixture.detectChanges();
    tick();

    expect(fixture.nativeElement.querySelectorAll('.code-copy-btn').length).toBe(1);
  }));
});
