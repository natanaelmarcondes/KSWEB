import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-ks-grid-action',
  template: `
    <button type="button" [class]="tipo" [disabled]="disabled || carregando"
      [attr.aria-label]="rotulo" [title]="rotulo" [attr.aria-busy]="carregando"
      (click)="executar($event)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        @switch (tipo) {
          @case ('excluir') {
            <path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6" />
          }
          @case ('editar') {
            <path d="M16 3a2.83 2.83 0 0 1 4 4L7 20l-5 1 1-5Z" />
            <path d="m14 5 4 4M3 16l4 4" />
          }
          @case ('visualizar') {
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
          }
        }
      </svg>
    </button>
  `,
  styles: `
    :host { display: inline-flex; vertical-align: middle; }
    button { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px;
      min-height: 30px; padding: 0; border: 0; border-radius: 3px; background: transparent; cursor: pointer; }
    .excluir { color: #ed4545; }
    .editar { color: #d97625; }
    .visualizar { color: #1679bb; }
    button:hover:not(:disabled) { background: #e4effa; }
    button:focus-visible { outline: 2px solid currentColor; outline-offset: -2px; }
    button:disabled { opacity: .4; cursor: default; }
    svg { flex-shrink: 0; }
  `,
})
export class KsGridActionComponent {
  @Input() tipo: 'excluir' | 'editar' | 'visualizar' = 'editar';
  @Input() disabled = false;
  @Input() carregando = false;
  @Output() acao = new EventEmitter<void>();

  get rotulo(): string {
    if (this.carregando) return 'Excluindo...';
    return { excluir: 'Excluir', editar: 'Editar', visualizar: 'Visualizar' }[this.tipo];
  }

  executar(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.disabled && !this.carregando) this.acao.emit();
  }
}
