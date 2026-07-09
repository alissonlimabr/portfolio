import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('marks the blog link as active while the blog section is visible', () => {
    component.onActivePortfolioSectionChange('blog');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const blogLink = Array.from(
      root.querySelectorAll<HTMLAnchorElement>('.nav-links a')
    ).find(link => link.textContent?.trim() === 'Blog');

    expect(blogLink?.classList.contains('link--section-active')).toBeTrue();
  });
});
