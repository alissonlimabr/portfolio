import {
  DestroyRef,
  Injectable,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT } from '@angular/common';

export type FontSize = 'sm' | 'md' | 'lg';
export type TextWidth = 'narrow' | 'normal' | 'wide';
export type ReadingTheme = 'dark' | 'light';

interface ReadingPreferences {
  fontSize: FontSize;
  textWidth: TextWidth;
  theme: ReadingTheme;
}

const STORAGE_KEY = 'blog-reading-prefs';
const DEFAULT_PREFS: ReadingPreferences = {
  fontSize: 'md',
  textWidth: 'normal',
  theme: 'dark',
};

@Injectable({ providedIn: 'root' })
export class ReadingPreferencesService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly prefs = signal<ReadingPreferences>(this.load());
  private readonly isCompactViewport = signal(this.isMobileOrMobilePlus());
  private themeTransitionTimer: number | null = null;

  readonly fontSize = computed(() =>
    this.isCompactViewport() ? 'sm' : this.prefs().fontSize,
  );
  readonly textWidth = computed(() => this.prefs().textWidth);
  readonly theme = computed(() => this.prefs().theme);

  constructor() {
    if (this.isBrowser) {
      const view = this.document.defaultView;
      view?.addEventListener('resize', this.updateViewportFontSize, {
        passive: true,
      });
      this.destroyRef.onDestroy(() =>
        view?.removeEventListener('resize', this.updateViewportFontSize),
      );
    }

    effect(() => {
      const current = this.prefs();
      if (this.isBrowser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      }
      this.applyBodyClasses({ ...current, fontSize: this.fontSize() });
    });
  }

  setFontSize(size: FontSize): void {
    this.prefs.update((p) => ({ ...p, fontSize: size }));
  }

  setTextWidth(width: TextWidth): void {
    this.prefs.update((p) => ({ ...p, textWidth: width }));
  }

  setTheme(theme: ReadingTheme): void {
    if (theme === this.prefs().theme) {
      return;
    }

    this.startThemeTransition();
    this.prefs.update((p) => ({ ...p, theme }));
  }

  private startThemeTransition(): void {
    if (!this.isBrowser) {
      return;
    }

    const view = this.document.defaultView;
    if (!view) {
      return;
    }

    this.document.body.classList.add('blog-theme-switching');
    if (this.themeTransitionTimer !== null) {
      view.clearTimeout(this.themeTransitionTimer);
    }
    this.themeTransitionTimer = view.setTimeout(() => {
      this.document.body.classList.remove('blog-theme-switching');
      this.themeTransitionTimer = null;
    }, 240);
  }

  private load(): ReadingPreferences {
    if (!this.isBrowser) return DEFAULT_PREFS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ReadingPreferences>;
        return {
          fontSize: this.isFontSize(parsed.fontSize)
            ? parsed.fontSize
            : DEFAULT_PREFS.fontSize,
          textWidth: this.isTextWidth(parsed.textWidth)
            ? parsed.textWidth
            : DEFAULT_PREFS.textWidth,
          theme: this.isReadingTheme(parsed.theme)
            ? parsed.theme
            : DEFAULT_PREFS.theme,
        };
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_PREFS;
  }

  private readonly updateViewportFontSize = (): void => {
    this.isCompactViewport.set(this.isMobileOrMobilePlus());
  };

  private isMobileOrMobilePlus(): boolean {
    return this.isBrowser && (this.document.defaultView?.innerWidth ?? 0) <= 660;
  }

  private isFontSize(value: unknown): value is FontSize {
    return value === 'sm' || value === 'md' || value === 'lg';
  }

  private isTextWidth(value: unknown): value is TextWidth {
    return value === 'narrow' || value === 'normal' || value === 'wide';
  }

  private isReadingTheme(value: unknown): value is ReadingTheme {
    return value === 'dark' || value === 'light';
  }

  applyBodyClasses(prefs: ReadingPreferences = this.prefs()): void {
    const body = this.document.body;
    body.classList.remove('blog-font-sm', 'blog-font-md', 'blog-font-lg');
    body.classList.remove(
      'blog-width-narrow',
      'blog-width-normal',
      'blog-width-wide',
    );
    body.classList.remove('blog-theme-dark', 'blog-theme-light');
    body.classList.add(`blog-font-${prefs.fontSize}`);
    body.classList.add(`blog-width-${prefs.textWidth}`);
    body.classList.add(`blog-theme-${prefs.theme}`);
  }

  removeBlogClasses(): void {
    this.document.body.classList.remove(
      'blog-font-sm',
      'blog-font-md',
      'blog-font-lg',
      'blog-width-narrow',
      'blog-width-normal',
      'blog-width-wide',
      'blog-theme-dark',
      'blog-theme-light',
      'blog-theme-switching',
    );
  }
}
