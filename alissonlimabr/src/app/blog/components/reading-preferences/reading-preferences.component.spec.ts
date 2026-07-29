import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReadingPreferencesComponent } from './reading-preferences.component';

describe('ReadingPreferencesComponent', () => {
  const collapsedStorageKey = 'blog-rp-collapsed';
  let fixture: ComponentFixture<ReadingPreferencesComponent>;

  beforeEach(async () => {
    localStorage.removeItem(collapsedStorageKey);

    await TestBed.configureTestingModule({
      imports: [ReadingPreferencesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReadingPreferencesComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem(collapsedStorageKey);
  });

  it('starts compact on desktop', () => {
    const trigger = fixture.nativeElement.querySelector(
      '.rp-desktop-header',
    ) as HTMLButtonElement;

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.textContent).toContain('Preferências de leitura');
    expect(trigger.textContent).toContain('Fonte, largura e tema');
  });

  it('expands the inline options and persists the explicit choice', () => {
    const trigger = fixture.nativeElement.querySelector(
      '.rp-desktop-header',
    ) as HTMLButtonElement;

    trigger.click();
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(localStorage.getItem(collapsedStorageKey)).toBe('false');
  });

  it('collapses the inline options after an outside click', () => {
    const trigger = fixture.nativeElement.querySelector(
      '.rp-desktop-header',
    ) as HTMLButtonElement;

    trigger.click();
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
});
