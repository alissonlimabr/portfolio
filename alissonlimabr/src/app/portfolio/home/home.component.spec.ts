import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { SanityService } from '../../blog/services/sanity.service';
import { SITE_DEFAULT_OG_IMAGE_PATH } from '../../shared/constants/site.constants';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let sanityService: jasmine.SpyObj<SanityService>;

  beforeEach(async () => {
    sanityService = jasmine.createSpyObj<SanityService>('SanityService', [
      'getPosts',
      'buildImageSrcSet',
      'optimizeImageUrl',
    ]);
    sanityService.getPosts.and.returnValue(
      of(
        Array.from({ length: 5 }, (_, index) => ({
          _id: `post-${index}`,
          title: index === 0 ? 'Post sem capa' : `Post ${index}`,
          slug: { current: `post-${index}` },
          excerpt: 'Resumo',
          publishedAt: '2026-07-28T00:00:00.000Z',
        })),
      ),
    );
    sanityService.buildImageSrcSet.and.returnValue(undefined);

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: SanityService, useValue: sanityService },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use the site OG image when a recent post has no cover', () => {
    expect(component.recentPosts()[0].imageUrl).toBe(
      SITE_DEFAULT_OG_IMAGE_PATH,
    );
  });

  it('should expose at most four recent posts', () => {
    expect(component.recentPosts().length).toBe(4);
    expect(component.hasScrollableRecentPosts()).toBeTrue();
  });
});
