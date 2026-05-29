import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdensServicoCadComponent } from './ordens-servico-cad.component';

describe('OrdensServicoCadComponent', () => {
  let component: OrdensServicoCadComponent;
  let fixture: ComponentFixture<OrdensServicoCadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdensServicoCadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdensServicoCadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
