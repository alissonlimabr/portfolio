import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  PLATFORM_ID,
  Renderer2,
  inject,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

export interface ContentHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

@Directive({
  selector: '[appContentHeadings]',
  standalone: true,
})
export class ContentHeadingsDirective implements OnDestroy {
  @Input('appContentHeadings')
  set content(_: unknown) {
    this.scheduleExtraction();
  }

  @Output() contentHeadingsChange = new EventEmitter<ContentHeading[]>();

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  private extractionTimer: number | null = null;

  ngOnDestroy(): void {
    const window = this.document.defaultView;
    if (window && this.extractionTimer !== null) {
      window.clearTimeout(this.extractionTimer);
    }
  }

  private scheduleExtraction(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const window = this.document.defaultView;
    if (!window) {
      return;
    }

    if (this.extractionTimer !== null) {
      window.clearTimeout(this.extractionTimer);
    }

    this.extractionTimer = window.setTimeout(() => {
      this.extractionTimer = null;
      this.extractHeadings();
    });
  }

  private extractHeadings(): void {
    const container: HTMLElement = this.el.nativeElement;
    const headings = Array.from(
      container.querySelectorAll<HTMLHeadingElement>('h2, h3')
    );

    if (headings.length < 2) {
      this.contentHeadingsChange.emit([]);
      return;
    }

    const items = headings.map<ContentHeading>((heading, index) => {
      const text = heading.textContent?.trim() ?? '';
      const id = `toc-${index}-${text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-$/, '')
        .slice(0, 50)}`;

      this.renderer.setAttribute(heading, 'id', id);
      return {
        id,
        text,
        level: Number.parseInt(heading.tagName[1], 10) as 2 | 3,
      };
    });

    this.contentHeadingsChange.emit(items);
  }
}
