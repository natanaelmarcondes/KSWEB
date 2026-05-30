import { Component, Input } from '@angular/core';

export type AppIconName =
  | 'alert'
  | 'check-circle'
  | 'circle'
  | 'clipboard'
  | 'clock'
  | 'folder-open'
  | 'hourglass'
  | 'logout'
  | 'refresh';

@Component({
  selector: 'app-icon',
  imports: [],
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.css',
})
export class IconComponent {
  @Input({ required: true }) name!: AppIconName;
}
