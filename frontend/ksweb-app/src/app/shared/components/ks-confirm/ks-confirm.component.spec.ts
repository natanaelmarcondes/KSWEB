import { TestBed } from '@angular/core/testing';
import { NavigationStart, Router, provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { KsConfirmComponent } from './ks-confirm.component';
import { KsConfirmService } from './ks-confirm.service';

describe('KsConfirmComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [KsConfirmComponent], providers: [provideRouter([])] }));

  it('opens a modal and only confirms when Excluir is clicked', async () => {
    const fixture = TestBed.createComponent(KsConfirmComponent);
    fixture.detectChanges();
    const service = TestBed.inject(KsConfirmService);
    const result = service.confirmar('Excluir o setor Suporte?');
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    expect(dialog.open).toBeTrue();
    expect(dialog.textContent).toContain('Excluir o setor Suporte?');
    (dialog.querySelector('.danger') as HTMLButtonElement).click();
    expect(await result).toBeTrue();
    fixture.detectChanges();
    expect(dialog.open).toBeFalse();
  });

  it('cancels with the button or Escape and rejects duplicate requests', async () => {
    const fixture = TestBed.createComponent(KsConfirmComponent);
    fixture.detectChanges();
    const service = TestBed.inject(KsConfirmService);
    const first = service.confirmar('Excluir item?');
    fixture.detectChanges();
    expect(await service.confirmar('Outro item?')).toBeFalse();
    (fixture.nativeElement.querySelector('.secondary') as HTMLButtonElement).click();
    expect(await first).toBeFalse();
    fixture.detectChanges();
    const second = service.confirmar('Excluir outro item?');
    fixture.detectChanges();
    fixture.nativeElement.querySelector('dialog').dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(await second).toBeFalse();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog').open).toBeFalse();
  });

  it('cancels a pending confirmation when navigating away', async () => {
    const events = new Subject<NavigationStart>();
    TestBed.overrideProvider(Router, { useValue: { events } });
    const service = TestBed.inject(KsConfirmService);
    const result = service.confirmar('Excluir item?');
    events.next(new NavigationStart(1, '/dashboard'));
    expect(await result).toBeFalse();
    expect(service.mensagem()).toBeNull();
  });
});
