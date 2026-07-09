import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { CopyToClipboardDirective } from './copy-to-clipboard.directive';

@Component({
  standalone: true,
  imports: [CopyToClipboardDirective],
  template: `
    <button
      type="button"
      [appCopyToClipboard]="text"
      (copySuccess)="copySucceeded = true"
      (copyError)="copyFailed = true"
    >
      Copiar
    </button>
  `,
})
class CopyToClipboardHostComponent {
  text = 'https://alissonlimadev.com/blog/post';
  copySucceeded = false;
  copyFailed = false;
}

describe('CopyToClipboardDirective', () => {
  let fixture: ComponentFixture<CopyToClipboardHostComponent>;
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
      imports: [CopyToClipboardHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CopyToClipboardHostComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', originalClipboard);
    } else {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
  });

  it('copies the configured text and emits success when clicked', fakeAsync(() => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.click();
    flushMicrotasks();

    expect(writeText).toHaveBeenCalledOnceWith('https://alissonlimadev.com/blog/post');
    expect(fixture.componentInstance.copySucceeded).toBeTrue();
    expect(fixture.componentInstance.copyFailed).toBeFalse();
  }));

  it('emits an error when the clipboard write fails', fakeAsync(() => {
    writeText.and.returnValue(Promise.reject(new Error('clipboard unavailable')));
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.click();
    flushMicrotasks();

    expect(fixture.componentInstance.copySucceeded).toBeFalse();
    expect(fixture.componentInstance.copyFailed).toBeTrue();
  }));
});
