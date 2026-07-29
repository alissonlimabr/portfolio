import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'alissonlimabr'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('alissonlimabr');
  });

  it('keeps the footer at the bottom when the page is shorter than the viewport', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const content = fixture.nativeElement.querySelector(
      'mat-sidenav-content',
    ) as HTMLElement;
    const main = content.querySelector('main') as HTMLElement;
    const contentStyles = getComputedStyle(content);
    const mainStyles = getComputedStyle(main);

    expect(contentStyles.display).toBe('flex');
    expect(contentStyles.flexDirection).toBe('column');
    expect(mainStyles.flexGrow).toBe('1');
  });
});
