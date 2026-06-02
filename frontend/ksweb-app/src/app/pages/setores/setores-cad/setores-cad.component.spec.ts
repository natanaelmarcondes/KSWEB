import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { SetoresCadComponent } from './setores-cad.component';

describe('SetoresCadComponent', () => {
  let component: SetoresCadComponent;
  let fixture: ComponentFixture<SetoresCadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetoresCadComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
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
