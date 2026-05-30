import { Component, EventEmitter, Input, Output } from '@angular/core';

import { AppIconName, IconComponent } from '../icon/icon.component';

type ButtonType = 'button' | 'submit' | 'reset';
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'normal' | 'small';

@Component({
  selector: 'app-button',
  imports: [IconComponent],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
})
export class ButtonComponent {
  @Input() type: ButtonType = 'button';
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'normal';
  @Input() disabled = false;
  @Input() icon?: AppIconName;

  @Output() pressed = new EventEmitter<void>();
}
