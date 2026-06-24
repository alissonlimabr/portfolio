import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TocComponent } from './toc.component';

describe('TocComponent', () => {
  const storageKey = 'blog-toc-open';
  let component: TocComponent;
  let fixture: ComponentFixture<TocComponent>;

  beforeEach(async () => {
    localStorage.removeItem(storageKey);

    await TestBed.configureTestingModule({
      imports: [TocComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TocComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', [
      { id: 'introducao', text: 'Introdução', level: 2 },
      { id: 'detalhes', text: 'Detalhes', level: 3 },
    ]);
    fixture.componentRef.setInput('activeId', 'detalhes');
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem(storageKey);
  });

  it('identifies the current section for assistive technologies', () => {
    const root = fixture.nativeElement as HTMLElement;
    const links = root.querySelectorAll<HTMLAnchorElement>('.toc-item a');

    expect(links[0].getAttribute('aria-current')).toBeNull();
    expect(links[1].getAttribute('aria-current')).toBe('location');
  });

  it('starts expanded and persists explicit toggle changes', () => {
    const toggle = fixture.nativeElement.querySelector(
      '.toc-toggle',
    ) as HTMLButtonElement;

    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(localStorage.getItem(storageKey)).toBe('false');
  });

  it('restores the last explicitly selected state', () => {
    fixture.destroy();
    localStorage.setItem(storageKey, 'false');

    fixture = TestBed.createComponent(TocComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', [
      { id: 'introducao', text: 'Introdução', level: 2 },
      { id: 'detalhes', text: 'Detalhes', level: 3 },
    ]);
    fixture.detectChanges();

    expect(component.isOpen()).toBeFalse();
  });

  it('keeps the compact navigation open after selecting a topic', () => {
    component.toggle();
    component.toggle();
    expect(localStorage.getItem(storageKey)).toBe('true');

    component.onItemClick('introducao', new MouseEvent('click'));

    expect(component.isOpen()).toBeTrue();
    expect(localStorage.getItem(storageKey)).toBe('true');
  });
});
