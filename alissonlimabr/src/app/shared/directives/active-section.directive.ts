import {
  Directive,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  inject,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appActiveSection]',
  standalone: true,
})
export class ActiveSectionDirective implements OnInit, OnChanges, OnDestroy {
  @Input('appActiveSection') sectionIds: readonly string[] = [];
  @Input() activeSectionOffset = 0;
  @Input() activeSectionUseHash = false;
  @Input() activeSectionFallbackToFirst = false;
  @Input() activeSectionDisabled = false;
  @Output() activeSectionChange = new EventEmitter<string>();

  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  private removeListeners: Array<() => void> = [];
  private animationFrame: number | null = null;
  private pendingPreferHash = false;
  private initialized = false;
  private lastActiveSection = '';

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const window = this.document.defaultView;
    if (!window) {
      return;
    }

    this.initialized = true;
    this.zone.runOutsideAngular(() => {
      const onScroll = () => this.scheduleEvaluation(false);
      const onResize = () => this.scheduleEvaluation(false);
      const onHashChange = () => this.scheduleEvaluation(true);

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize);
      window.addEventListener('hashchange', onHashChange);

      this.removeListeners = [
        () => window.removeEventListener('scroll', onScroll),
        () => window.removeEventListener('resize', onResize),
        () => window.removeEventListener('hashchange', onHashChange),
      ];
    });
    this.scheduleEvaluation(true);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) {
      return;
    }

    if (changes['sectionIds']) {
      this.lastActiveSection = '';
    }

    if (
      changes['sectionIds'] ||
      changes['activeSectionOffset'] ||
      changes['activeSectionUseHash'] ||
      changes['activeSectionFallbackToFirst'] ||
      changes['activeSectionDisabled']
    ) {
      this.scheduleEvaluation(true);
    }
  }

  ngOnDestroy(): void {
    this.removeListeners.forEach(removeListener => removeListener());
    this.removeListeners = [];

    const window = this.document.defaultView;
    if (window && this.animationFrame !== null) {
      window.cancelAnimationFrame(this.animationFrame);
    }
  }

  private scheduleEvaluation(preferHash: boolean): void {
    if (this.activeSectionDisabled) {
      return;
    }

    const window = this.document.defaultView;
    if (!window) {
      return;
    }

    this.pendingPreferHash ||= preferHash;
    if (this.animationFrame !== null) {
      return;
    }

    this.animationFrame = window.requestAnimationFrame(() => {
      this.animationFrame = null;
      const shouldPreferHash = this.pendingPreferHash;
      this.pendingPreferHash = false;
      this.evaluateActiveSection(shouldPreferHash);
    });
  }

  private evaluateActiveSection(preferHash: boolean): void {
    if (!this.sectionIds.length || this.activeSectionDisabled) {
      return;
    }

    const window = this.document.defaultView;
    if (!window) {
      return;
    }

    if (preferHash && this.activeSectionUseHash) {
      const hashId = window.location.hash.replace(/^#/, '');
      if (hashId && this.sectionIds.includes(hashId)) {
        this.emitIfChanged(hashId);
        return;
      }
    }

    const sections = this.sectionIds
      .map(id => this.document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);

    if (!sections.length) {
      return;
    }

    let activeId = this.activeSectionFallbackToFirst ? sections[0].id : '';
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= this.activeSectionOffset) {
        activeId = section.id;
      }
    }

    this.emitIfChanged(activeId);
  }

  private emitIfChanged(activeId: string): void {
    if (activeId === this.lastActiveSection) {
      return;
    }

    this.lastActiveSection = activeId;
    this.zone.run(() => this.activeSectionChange.emit(activeId));
  }
}
