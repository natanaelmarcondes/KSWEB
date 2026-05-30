import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-ks-button',
  standalone: true,
  imports: [],
  templateUrl: './ks-button.component.html',
  styleUrl: './ks-button.component.css',
})
export class KsButtonComponent {
  @Input() tipo: 'primary' | 'secondary' | 'danger' | 'success' = 'primary';
  @Input() tamanho: 'normal' | 'small' = 'normal';
  @Input() disabled = false;

  @Output() acao = new EventEmitter<void>();

  onClick(): void {
    if (this.disabled) {
      return;
    }

    this.acao.emit();
  }
}
