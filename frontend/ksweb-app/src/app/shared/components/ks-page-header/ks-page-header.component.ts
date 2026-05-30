import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ks-page-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ks-page-header.component.html',
  styleUrl: './ks-page-header.component.css',
})
export class KsPageHeaderComponent {
  @Input() titulo = '';
  @Input() subtitulo = '';
}
