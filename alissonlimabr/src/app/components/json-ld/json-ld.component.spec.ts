import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JsonLdComponent } from './json-ld.component';

describe('JsonLdComponent', () => {
  let component: JsonLdComponent;
  let fixture: ComponentFixture<JsonLdComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [JsonLdComponent]
    });
    fixture = TestBed.createComponent(JsonLdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
