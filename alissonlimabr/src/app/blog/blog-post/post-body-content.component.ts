import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import {
  ContentHeading,
  ContentHeadingsDirective,
} from '../../shared/directives/content-headings.directive';
import { CodeBlockEnhancerDirective } from '../../shared/directives/code-block-enhancer.directive';

@Component({
  selector: 'app-post-body-content',
  standalone: true,
  imports: [CodeBlockEnhancerDirective, ContentHeadingsDirective],
  template: `
    <div
      class="post-body-html"
      [innerHTML]="html"
      [appCodeBlockEnhancer]="html"
      [appContentHeadings]="html"
      (contentHeadingsChange)="contentHeadingsChange.emit($event)"
    ></div>
  `,
  styles: `
    :host {
      display: block;
    }

    .post-body-html {
      display: contents;
    }
  `,
})
export class PostBodyContentComponent {
  @Input({ required: true }) html: SafeHtml | string | null | undefined;
  @Output() readonly contentHeadingsChange = new EventEmitter<
    ContentHeading[]
  >();
}
