import { Component, input, output, signal } from '@angular/core';

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

@Component({
  selector: 'app-toc',
  standalone: true,
  templateUrl: './toc.component.html',
  styleUrl: './toc.component.scss',
})
export class TocComponent {
  readonly items = input.required<TocItem[]>();
  readonly activeId = input('');
  readonly scrollTo = output<string>();

  readonly isOpen = signal(false);

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  onItemClick(id: string, event: Event): void {
    event.preventDefault();
    this.scrollTo.emit(id);
    this.isOpen.set(false);
  }
}
