import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { KsButtonComponent } from '../ks-button/ks-button.component';

@Component({
  selector: 'app-ks-modal',
  standalone: true,
  imports: [CommonModule, KsButtonComponent],
  templateUrl: './ks-modal.component.html',
  styleUrl: './ks-modal.component.css',
})
export class KsModalComponent {
  @Input() aberto = false;
  @Input() titulo = '';
  @Output() fechado = new EventEmitter<void>();
}
