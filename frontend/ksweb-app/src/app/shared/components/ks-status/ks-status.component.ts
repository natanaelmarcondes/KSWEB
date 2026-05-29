import { Component, Input } from '@angular/core';
import { KsBadgeComponent } from '../ks-badge/ks-badge.component';

@Component({
  selector: 'app-ks-status',
  standalone: true,
  imports: [KsBadgeComponent],
  templateUrl: './ks-status.component.html',
})
export class KsStatusComponent {
  @Input() ativo = false;

  get tipo(): 'green' | 'red' {
    return this.ativo ? 'green' : 'red';
  }

  get texto(): string {
    return this.ativo ? 'Sim' : 'Nao';
  }
}
