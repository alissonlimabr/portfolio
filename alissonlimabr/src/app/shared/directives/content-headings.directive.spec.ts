import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  ContentHeading,
  ContentHeadingsDirective,
} from './content-headings.directive';

@Component({
  standalone: true,
  imports: [ContentHeadingsDirective],
  template: `
    <div
      [innerHTML]="html"
      [appContentHeadings]="html"
      (contentHeadingsChange)="headings = $event"
    ></div>
  `,
})
class ContentHeadingsHostComponent {
  html = '<h2>Primeiro tópico</h2><h3>Detalhes técnicos</h3>';
  headings: ContentHeading[] = [];
}

describe('ContentHeadingsDirective', () => {
  let fixture: ComponentFixture<ContentHeadingsHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentHeadingsHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ContentHeadingsHostComponent);
  });

  it('extracts h2 and h3 elements and assigns the existing generated IDs', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(fixture.componentInstance.headings).toEqual([
      { id: 'toc-0-primeiro-topico', text: 'Primeiro tópico', level: 2 },
      { id: 'toc-1-detalhes-tecnicos', text: 'Detalhes técnicos', level: 3 },
    ]);

    const renderedHeadings = fixture.nativeElement.querySelectorAll('h2, h3');
    expect(renderedHeadings[0].id).toBe('toc-0-primeiro-topico');
    expect(renderedHeadings[1].id).toBe('toc-1-detalhes-tecnicos');
  }));

  it('emits an empty list when the content has fewer than two headings', fakeAsync(() => {
    fixture.componentInstance.html = '<h2>Único tópico</h2>';

    fixture.detectChanges();
    tick();

    expect(fixture.componentInstance.headings).toEqual([]);
  }));
});
