import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetoresListComponent } from './setores-list.component';

describe('SetoresListComponent', () => {
  let component: SetoresListComponent;
  let fixture: ComponentFixture<SetoresListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetoresListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetoresListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
