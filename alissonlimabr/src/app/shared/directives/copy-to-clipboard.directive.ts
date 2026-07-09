import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  Output,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appCopyToClipboard]',
  standalone: true,
})
export class CopyToClipboardDirective {
  @Input('appCopyToClipboard') text = '';
  @Output() copySuccess = new EventEmitter<void>();
  @Output() copyError = new EventEmitter<unknown>();

  private readonly platformId = inject(PLATFORM_ID);

  @HostListener('click')
  onClick(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const clipboard = navigator.clipboard;
    if (!clipboard) {
      this.copyError.emit(new Error('Clipboard API unavailable'));
      return;
    }

    clipboard
      .writeText(this.text)
      .then(() => this.copySuccess.emit())
      .catch(error => this.copyError.emit(error));
  }
}
