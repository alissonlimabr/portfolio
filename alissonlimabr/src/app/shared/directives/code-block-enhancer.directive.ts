import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  Renderer2,
  inject,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

type PrismInstance = typeof import('prismjs');
type PrismModule = PrismInstance & { default?: PrismInstance };

const PRISM_COMPONENT_LOADERS = [
  () => import('prismjs/components/prism-markup'),
  () => import('prismjs/components/prism-css'),
  () => import('prismjs/components/prism-clike'),
  () => import('prismjs/components/prism-javascript'),
  () => import('prismjs/components/prism-typescript'),
  () => import('prismjs/components/prism-json'),
  () => import('prismjs/components/prism-bash'),
  () => import('prismjs/components/prism-yaml'),
  () => import('prismjs/components/prism-scss'),
  () => import('prismjs/components/prism-java'),
  () => import('prismjs/components/prism-python'),
  () => import('prismjs/components/prism-sql'),
] as const;

let prismLoaderPromise: Promise<PrismInstance> | null = null;

async function loadPrism(): Promise<PrismInstance> {
  if (!prismLoaderPromise) {
    prismLoaderPromise = (async () => {
      const prismModule = (await import('prismjs')) as PrismModule;
      for (const loadComponent of PRISM_COMPONENT_LOADERS) {
        await loadComponent();
      }
      return prismModule.default ?? prismModule;
    })().catch((error) => {
      prismLoaderPromise = null;
      throw error;
    });
  }

  return prismLoaderPromise;
}

@Directive({
  selector: '[appCodeBlockEnhancer]',
  standalone: true,
})
export class CodeBlockEnhancerDirective implements OnInit, OnDestroy {
  @Input('appCodeBlockEnhancer')
  set content(_: unknown) {
    this.scheduleEnhancement();
  }

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  private removeClickListener?: () => void;
  private enhancementTimer: number | null = null;
  private readonly feedbackTimers = new Map<HTMLButtonElement, number>();
  private destroyed = false;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.removeClickListener = this.renderer.listen(
      this.el.nativeElement,
      'click',
      (event: Event) => this.handleClick(event)
    );
    this.scheduleEnhancement();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.removeClickListener?.();

    const window = this.document.defaultView;
    if (!window) {
      return;
    }

    if (this.enhancementTimer !== null) {
      window.clearTimeout(this.enhancementTimer);
    }
    this.feedbackTimers.forEach(timer => window.clearTimeout(timer));
    this.feedbackTimers.clear();
  }

  private scheduleEnhancement(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const window = this.document.defaultView;
    if (!window) {
      return;
    }

    if (!this.el.nativeElement.querySelector('pre:not([data-code-enhanced])')) {
      return;
    }

    if (this.enhancementTimer !== null) {
      window.clearTimeout(this.enhancementTimer);
    }

    this.enhancementTimer = window.setTimeout(() => {
      this.enhancementTimer = null;
      void this.enhanceCodeBlocks();
    });
  }

  private async enhanceCodeBlocks(): Promise<void> {
    try {
      const container: HTMLElement = this.el.nativeElement;
      const preBlocks = Array.from(
        container.querySelectorAll<HTMLPreElement>('pre')
      ).filter((pre) => !pre.hasAttribute('data-code-enhanced'));
      if (!preBlocks.length) {
        return;
      }

      const Prism = await loadPrism();
      if (this.destroyed) {
        return;
      }

      preBlocks.forEach((pre) => {
        const code = pre.querySelector<HTMLElement>('code');
        if (code) {
          Prism.highlightElement(code);
        }

        this.ensureCopyButton(pre);
        this.renderer.setAttribute(pre, 'data-code-enhanced', 'true');
      });
    } catch {
      // Falha de highlight não deve impedir a leitura ou o copy button.
    }
  }

  private ensureCopyButton(pre: HTMLPreElement): void {
    const buttonOwner = pre.closest('.code-block') ?? pre;
    if (buttonOwner.querySelector('.code-copy-btn')) {
      return;
    }

    const button = this.renderer.createElement('button') as HTMLButtonElement;
    this.renderer.setAttribute(button, 'type', 'button');
    this.renderer.setAttribute(button, 'class', 'code-copy-btn');
    this.renderer.setAttribute(button, 'aria-label', 'Copiar código');
    this.renderer.setProperty(button, 'textContent', 'Copiar');
    const headerActions = buttonOwner.querySelector('.code-block-actions');
    if (headerActions) {
      this.renderer.appendChild(headerActions, button);
      return;
    }

    this.renderer.appendChild(pre, button);
  }

  private handleClick(event: Event): void {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const button = target.closest<HTMLButtonElement>('.code-copy-btn');
    if (!button || !this.el.nativeElement.contains(button)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const code =
      button.closest('.code-block')?.querySelector('pre code') ??
      button.closest('pre')?.querySelector('code');
    if (!code) {
      return;
    }

    const clipboard = this.document.defaultView?.navigator.clipboard;
    if (!clipboard) {
      this.flashButton(button, 'Falhou', false);
      return;
    }

    clipboard
      .writeText(code.textContent ?? '')
      .then(() => {
        if (!this.destroyed) {
          this.flashButton(button, 'Copiado', true);
        }
      })
      .catch(() => {
        if (!this.destroyed) {
          this.flashButton(button, 'Falhou', false);
        }
      });
  }

  private flashButton(
    button: HTMLButtonElement,
    label: string,
    success: boolean
  ): void {
    const window = this.document.defaultView;
    if (!window) {
      return;
    }

    const existingTimer = this.feedbackTimers.get(button);
    if (existingTimer !== undefined) {
      window.clearTimeout(existingTimer);
    }

    this.renderer.removeClass(button, success ? 'failed' : 'copied');
    this.renderer.addClass(button, success ? 'copied' : 'failed');
    this.renderer.setProperty(button, 'textContent', label);

    const timer = window.setTimeout(() => {
      this.renderer.removeClass(button, 'copied');
      this.renderer.removeClass(button, 'failed');
      this.renderer.setProperty(button, 'textContent', 'Copiar');
      this.feedbackTimers.delete(button);
    }, 1800);

    this.feedbackTimers.set(button, timer);
  }
}
