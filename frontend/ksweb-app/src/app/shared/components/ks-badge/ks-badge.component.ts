import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ks-badge',
  standalone: true,
  imports: [],
  templateUrl: './ks-badge.component.html',
  styleUrl: './ks-badge.component.css',
})
export class KsBadgeComponent {
  @Input() tipo: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple' = 'gray';
}
