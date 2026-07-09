import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JsonLdComponent } from './json-ld.component';

describe('JsonLdComponent', () => {
  let component: JsonLdComponent;
  let fixture: ComponentFixture<JsonLdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonLdComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(JsonLdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
