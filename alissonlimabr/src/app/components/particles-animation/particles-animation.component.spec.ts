import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ParticlesAnimationComponent } from './ParticlesAnimationComponent';

describe('ParticlesAnimationComponent', () => {
  let component: ParticlesAnimationComponent;
  let fixture: ComponentFixture<ParticlesAnimationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParticlesAnimationComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(ParticlesAnimationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
