import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticlesAnimationComponent } from './ParticlesAnimationComponent';

describe('ParticlesAnimationComponent', () => {
  let component: ParticlesAnimationComponent;
  let fixture: ComponentFixture<ParticlesAnimationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ParticlesAnimationComponent],
    });
    fixture = TestBed.createComponent(ParticlesAnimationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
