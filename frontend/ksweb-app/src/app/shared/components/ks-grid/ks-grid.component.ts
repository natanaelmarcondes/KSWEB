import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ks-grid',
  standalone: true,
  imports: [],
  templateUrl: './ks-grid.component.html',
  styleUrl: './ks-grid.component.css',
  host: {
    '[style.--ks-grid-columns]': 'columns',
  },
})
export class KsGridComponent {
  @Input() columns = 'repeat(3, minmax(0, 1fr))';
}
