import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdensServicoListComponent } from './ordens-servico-list.component';

describe('OrdensServicoListComponent', () => {
  let component: OrdensServicoListComponent;
  let fixture: ComponentFixture<OrdensServicoListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdensServicoListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdensServicoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
