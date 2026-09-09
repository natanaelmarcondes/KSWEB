import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { KsConfirmService } from './ks-confirm.service';

@Component({
  selector: 'app-ks-confirm',
  standalone: true,
  template: `
    <dialog #dialog aria-labelledby="confirm-title" aria-describedby="confirm-message"
      (cancel)="$event.preventDefault(); confirmacao.responder(false)">
      <header><h2 id="confirm-title">Confirmar exclus?o</h2></header>
      <p id="confirm-message">{{ confirmacao.mensagem() }}</p>
      <footer>
        <button type="button" class="secondary" autofocus (click)="confirmacao.responder(false)">Cancelar</button>
        <button type="button" class="danger" (click)="confirmacao.responder(true)">Excluir</button>
      </footer>
    </dialog>
  `,
  styles: `
    dialog { width: min(420px, calc(100vw - 32px)); padding: 0; border: 1px solid #d4e1ed; border-radius: 8px; color: #263b50; background: white; box-shadow: 0 16px 48px #16365040; }
    dialog::backdrop { background: #16365066; }
    header { padding: 18px 20px; border-bottom: 1px solid #e2ebf5; }
    h2 { margin: 0; font-size: 18px; }
    p { margin: 0; padding: 20px; line-height: 1.5; overflow-wrap: anywhere; }
    footer { display: flex; justify-content: flex-end; gap: 8px; padding: 0 20px 18px; }
  `,
})
export class KsConfirmComponent {
  readonly confirmacao = inject(KsConfirmService);
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const mensagem = this.confirmacao.mensagem();
      const dialog = this.dialog()?.nativeElement;
      if (!dialog) return;
      if (mensagem !== null && !dialog.open) dialog.showModal();
      if (mensagem === null && dialog.open) dialog.close();
    });
  }
}
