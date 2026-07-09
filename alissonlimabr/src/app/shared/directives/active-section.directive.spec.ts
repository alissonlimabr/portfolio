import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActiveSectionDirective } from './active-section.directive';

@Component({
  standalone: true,
  imports: [ActiveSectionDirective],
  template: `
    <div
      [appActiveSection]="sectionIds"
      [activeSectionOffset]="offset"
      [activeSectionUseHash]="useHash"
      (activeSectionChange)="activeSection = $event"
    ></div>
  `,
})
class ActiveSectionHostComponent {
  sectionIds = ['first', 'second', 'third'];
  offset = 100;
  useHash = false;
  activeSection = '';
}

describe('ActiveSectionDirective', () => {
  let fixture: ComponentFixture<ActiveSectionHostComponent>;
  let sections: HTMLElement[];

  beforeEach(async () => {
    sections = [
      createSection('first', 0),
      createSection('second', 500),
      createSection('third', 1000),
    ];
    sections.forEach(section => document.body.appendChild(section));

    await TestBed.configureTestingModule({
      imports: [ActiveSectionHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActiveSectionHostComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    sections.forEach(section => section.remove());
    history.replaceState(null, '', `${location.pathname}${location.search}`);
  });

  it('emits the last section above the configured offset on scroll', async () => {
    setSectionTop(sections[0], -600);
    setSectionTop(sections[1], -100);
    setSectionTop(sections[2], 400);

    window.dispatchEvent(new Event('scroll'));
    await nextAnimationFrame();

    expect(fixture.componentInstance.activeSection).toBe('second');
  });

  it('re-evaluates the active section on resize', async () => {
    setSectionTop(sections[0], -1200);
    setSectionTop(sections[1], -600);
    setSectionTop(sections[2], 80);

    window.dispatchEvent(new Event('resize'));
    await nextAnimationFrame();

    expect(fixture.componentInstance.activeSection).toBe('third');
  });

  it('uses a valid location hash when hash tracking is enabled', async () => {
    fixture.componentInstance.useHash = true;
    fixture.detectChanges();
    history.replaceState(null, '', '#third');

    window.dispatchEvent(new Event('hashchange'));
    await nextAnimationFrame();

    expect(fixture.componentInstance.activeSection).toBe('third');
  });

  it('emits again when the observed section collection is refreshed', async () => {
    setSectionTop(sections[0], 50);
    setSectionTop(sections[1], 500);
    setSectionTop(sections[2], 1000);
    window.dispatchEvent(new Event('scroll'));
    await nextAnimationFrame();
    expect(fixture.componentInstance.activeSection).toBe('first');

    fixture.componentInstance.activeSection = '';
    fixture.componentInstance.sectionIds = ['first', 'second', 'third'];
    fixture.detectChanges();
    await nextAnimationFrame();

    expect(fixture.componentInstance.activeSection).toBe('first');
  });
});

function nextAnimationFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

function createSection(id: string, top: number): HTMLElement {
  const section = document.createElement('section');
  section.id = id;
  setSectionTop(section, top);
  return section;
}

function setSectionTop(section: HTMLElement, top: number): void {
  Object.defineProperty(section, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      x: 0,
      y: top,
      top,
      right: 0,
      bottom: top,
      left: 0,
      width: 0,
      height: 0,
      toJSON: () => ({}),
    }),
  });
}
