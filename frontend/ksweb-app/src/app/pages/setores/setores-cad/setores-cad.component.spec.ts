import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetoresCadComponent } from './setores-cad.component';

describe('SetoresCadComponent', () => {
  let component: SetoresCadComponent;
  let fixture: ComponentFixture<SetoresCadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetoresCadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetoresCadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
