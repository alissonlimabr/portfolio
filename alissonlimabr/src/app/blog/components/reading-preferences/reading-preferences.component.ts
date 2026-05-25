import { Component, ElementRef, HostListener, PLATFORM_ID, signal, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ReadingPreferencesService } from '../../services/reading-preferences.service';
import { IconComponent } from '../../../shared/icon.component';

@Component({
  selector: 'app-reading-preferences',
  standalone: true,
  imports: [IconComponent],
  template: `
    <!-- Desktop: panel fixed on right side, collapsible -->
    <aside class="rp-desktop" [class.rp-desktop--collapsed]="collapsed()" aria-label="Preferências de leitura">
      <button type="button" class="rp-desktop-header" (click)="toggleCollapsed()"
        [attr.aria-expanded]="!collapsed()" aria-controls="rp-desktop-body">
        <app-icon name="sliders" [size]="13" />
        <span>Leitura</span>
        <app-icon name="chevron-down" [size]="12" class="rp-chevron" />
      </button>

      <div class="rp-desktop-body" id="rp-desktop-body">
        <div class="rp-desktop-body-inner">
          <div class="rp-group">
            <span class="rp-label">Fonte</span>
            <div class="rp-btns">
              <button type="button" class="rp-btn" [class.active]="prefs.fontSize() === 'sm'"
                (click)="prefs.setFontSize('sm')" aria-label="Fonte pequena">A-</button>
              <button type="button" class="rp-btn" [class.active]="prefs.fontSize() === 'md'"
                (click)="prefs.setFontSize('md')" aria-label="Fonte média">A</button>
              <button type="button" class="rp-btn" [class.active]="prefs.fontSize() === 'lg'"
                (click)="prefs.setFontSize('lg')" aria-label="Fonte grande">A+</button>
            </div>
          </div>

          <div class="rp-group">
            <span class="rp-label">Largura</span>
            <div class="rp-btns">
              <button type="button" class="rp-btn" [class.active]="prefs.textWidth() === 'narrow'"
                (click)="prefs.setTextWidth('narrow')" aria-label="Texto estreito">
                <app-icon name="text-narrow" [size]="13" />
              </button>
              <button type="button" class="rp-btn" [class.active]="prefs.textWidth() === 'normal'"
                (click)="prefs.setTextWidth('normal')" aria-label="Largura normal">
                <app-icon name="text-normal" [size]="13" />
              </button>
              <button type="button" class="rp-btn" [class.active]="prefs.textWidth() === 'wide'"
                (click)="prefs.setTextWidth('wide')" aria-label="Texto largo">
                <app-icon name="text-wide" [size]="13" />
              </button>
            </div>
          </div>

          <div class="rp-group">
            <span class="rp-label">Tema</span>
            <div class="rp-btns">
              <button type="button" class="rp-btn" [class.active]="prefs.theme() === 'dark'"
                (click)="prefs.setTheme('dark')" aria-label="Tema escuro">
                <app-icon name="moon" [size]="13" />
              </button>
              <button type="button" class="rp-btn" [class.active]="prefs.theme() === 'light'"
                (click)="prefs.setTheme('light')" aria-label="Tema claro">
                <app-icon name="sun" [size]="13" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Mobile/tablet: FAB + collapsible panel -->
    <div class="rp-mobile" [class.rp-mobile--open]="open()">
      <div class="rp-mobile-panel" role="dialog" aria-label="Preferências de leitura">

        <div class="rp-group">
          <span class="rp-label">Fonte</span>
          <div class="rp-btns">
            <button type="button" class="rp-btn" [class.active]="prefs.fontSize() === 'sm'"
              (click)="prefs.setFontSize('sm')" aria-label="Fonte pequena">A-</button>
            <button type="button" class="rp-btn" [class.active]="prefs.fontSize() === 'md'"
              (click)="prefs.setFontSize('md')" aria-label="Fonte média">A</button>
            <button type="button" class="rp-btn" [class.active]="prefs.fontSize() === 'lg'"
              (click)="prefs.setFontSize('lg')" aria-label="Fonte grande">A+</button>
          </div>
        </div>

        <div class="rp-group">
          <span class="rp-label">Largura</span>
          <div class="rp-btns">
            <button type="button" class="rp-btn" [class.active]="prefs.textWidth() === 'narrow'"
              (click)="prefs.setTextWidth('narrow')" aria-label="Estreito">
              <app-icon name="text-narrow" [size]="13" />
            </button>
            <button type="button" class="rp-btn" [class.active]="prefs.textWidth() === 'normal'"
              (click)="prefs.setTextWidth('normal')" aria-label="Normal">
              <app-icon name="text-normal" [size]="13" />
            </button>
            <button type="button" class="rp-btn" [class.active]="prefs.textWidth() === 'wide'"
              (click)="prefs.setTextWidth('wide')" aria-label="Largo">
              <app-icon name="text-wide" [size]="13" />
            </button>
          </div>
        </div>

        <div class="rp-group">
          <span class="rp-label">Tema</span>
          <div class="rp-btns">
            <button type="button" class="rp-btn" [class.active]="prefs.theme() === 'dark'"
              (click)="prefs.setTheme('dark')" aria-label="Tema escuro">
              <app-icon name="moon" [size]="13" />
            </button>
            <button type="button" class="rp-btn" [class.active]="prefs.theme() === 'light'"
              (click)="prefs.setTheme('light')" aria-label="Tema claro">
              <app-icon name="sun" [size]="13" />
            </button>
          </div>
        </div>

      </div>

      <button class="rp-fab" type="button" (click)="toggle($event)"
        [attr.aria-expanded]="open()" aria-label="Preferências de leitura">
        <app-icon name="sliders" [size]="16" />
      </button>
    </div>
  `,
  styles: [`
    /* ─────────────────────────────────────────────────────────
       Shared button styles
    ───────────────────────────────────────────────────────── */
    .rp-group {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .rp-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--blog-text-muted, #8B859B);
    }

    .rp-btns {
      display: flex;
      gap: 4px;
    }

    .rp-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 30px;
      height: 30px;
      padding: 0 6px;
      background: transparent;
      border: 1px solid rgba(168, 85, 247, 0.18);
      border-radius: 6px;
      color: var(--blog-text-muted, #8B859B);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: border-color 0.15s, color 0.15s, background 0.15s;

      &:hover {
        border-color: rgba(168, 85, 247, 0.45);
        color: var(--blog-accent, #A855F7);
      }

      &.active {
        background: rgba(168, 85, 247, 0.14);
        border-color: var(--blog-accent, #A855F7);
        color: var(--blog-accent, #A855F7);
      }
    }

    /* ─────────────────────────────────────────────────────────
       Desktop panel — always expanded, fixed right side
    ───────────────────────────────────────────────────────── */
    .rp-desktop {
      display: none;

      @media (min-width: 1025px) {
        display: flex;
        flex-direction: column;
        gap: 14px;
        position: fixed;
        right: 28px;
        top: 50%;
        transform: translateY(-50%);
        z-index: 200;
        width: 148px;
        padding: 14px 16px;
        background: var(--blog-surface, #14101F);
        border: 1px solid var(--blog-border, #1E1A2A);
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(14px);
        overflow: hidden;
        transition: width 0.25s ease, gap 0.22s ease, padding-inline 0.22s ease;
      }
    }

    .rp-desktop--collapsed {
      @media (min-width: 1025px) {
        width: 82px;
        gap: 0;
        padding-inline: 10px;
      }
    }

    .rp-desktop-header {
      display: flex;
      align-items: center;
      gap: 7px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--blog-border, #1E1A2A);
      color: var(--blog-text-muted, #8B859B);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      white-space: nowrap;
      background: none;
      border-top: none;
      border-left: none;
      border-right: none;
      border-radius: 0;
      padding-top: 0;
      padding-left: 0;
      padding-right: 0;
      cursor: pointer;
      width: 100%;
      transition: color 0.15s;

      &:hover { color: var(--blog-accent, #A855F7); }

      .rp-chevron {
        margin-left: auto;
        flex-shrink: 0;
        transition: transform 0.25s ease, opacity 0.2s ease;
      }
    }

    .rp-desktop--collapsed .rp-desktop-header {
      padding-bottom: 0;
      border-bottom-color: transparent;

      .rp-chevron {
        transform: rotate(-90deg);
        opacity: 0;
      }
    }

    .rp-desktop-body {
      display: grid;
      grid-template-rows: 1fr;
      overflow: hidden;
      transition: grid-template-rows 0.25s ease, opacity 0.2s ease;
      opacity: 1;
    }

    .rp-desktop--collapsed .rp-desktop-body {
      grid-template-rows: 0fr;
      opacity: 0;
    }

    .rp-desktop-body-inner {
      min-height: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    /* ─────────────────────────────────────────────────────────
       Mobile/tablet — FAB + collapsible panel
    ───────────────────────────────────────────────────────── */
    .rp-mobile {
      display: none;

      @media (max-width: 1024px) {
        display: flex;
        flex-direction: column-reverse;
        align-items: flex-end;
        gap: 8px;
        position: fixed;
        right: 16px;
        bottom: 20px;
        z-index: 200;
      }
    }

    .rp-mobile-panel {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 14px;
      padding: 14px 16px;
      background: var(--blog-surface, #14101F);
      border: 1px solid var(--blog-border, #1E1A2A);
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(14px);

      opacity: 0;
      pointer-events: none;
      transform: translateY(8px);
      transition: opacity 0.18s ease, transform 0.18s ease;
    }

    .rp-mobile--open .rp-mobile-panel {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }

    .rp-fab {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      border-radius: 50%;
      background: var(--blog-surface, #14101F);
      border: 1px solid rgba(168, 85, 247, 0.3);
      color: var(--blog-accent, #A855F7);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
      box-shadow: 0 2px 14px rgba(0, 0, 0, 0.45);

      &:hover {
        background: rgba(168, 85, 247, 0.12);
        border-color: var(--blog-accent, #A855F7);
        box-shadow: 0 0 16px rgba(168, 85, 247, 0.3);
      }
    }

    .rp-mobile--open .rp-fab {
      background: rgba(168, 85, 247, 0.15);
      border-color: var(--blog-accent, #A855F7);
    }
  `],
})
export class ReadingPreferencesComponent {
  readonly prefs     = inject(ReadingPreferencesService);
  readonly open      = signal(false);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly collapsed = signal(
    this.isBrowser && localStorage.getItem('blog-rp-collapsed') === 'true'
  );

  private readonly el = inject(ElementRef);

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.open.update(v => !v);
  }

  toggleCollapsed(): void {
    this.collapsed.update(v => {
      const next = !v;
      if (this.isBrowser) {
        localStorage.setItem('blog-rp-collapsed', String(next));
      }
      return next;
    });
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (this.open() && !this.el.nativeElement.contains(event.target)) {
      this.open.set(false);
    }
  }
}
