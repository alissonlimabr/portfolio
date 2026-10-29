import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CodeBlockEnhancerDirective } from './code-block-enhancer.directive';

@Component({
  standalone: true,
  imports: [CodeBlockEnhancerDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
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

  it('adds a single copy button to each rendered code block', async () => {
    await renderEnhanced();

    const buttons = fixture.nativeElement.querySelectorAll('.code-copy-btn');

    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent).toBe('Copiar');
  });

  it('copies code and preserves the current feedback labels and duration', async () => {
    await renderEnhanced();
    const button = fixture.nativeElement.querySelector('.code-copy-btn') as HTMLButtonElement;

    jasmine.clock().install();
    try {
      button.click();
      await flushMicrotasks();

      expect(writeText).toHaveBeenCalledOnceWith('const value = 1;');
      expect(button.textContent).toBe('Copiado');
      expect(button.classList.contains('copied')).toBeTrue();

      jasmine.clock().tick(1800);

      expect(button.textContent).toBe('Copiar');
      expect(button.classList.contains('copied')).toBeFalse();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('does not duplicate buttons when the content input is checked again', async () => {
    await renderEnhanced();
    fixture.componentInstance.html =
      '<pre><code class="language-typescript">const value = 2;</code></pre>';
    await renderEnhanced();

    expect(fixture.nativeElement.querySelectorAll('.code-copy-btn').length).toBe(1);
  });

  async function renderEnhanced(): Promise<void> {
    fixture.detectChanges();
    const container: HTMLElement = fixture.nativeElement;
    const deadline = Date.now() + 3000;
    while (container.querySelector('pre:not([data-code-enhanced])') && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  async function flushMicrotasks(): Promise<void> {
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
    }
  }
});
