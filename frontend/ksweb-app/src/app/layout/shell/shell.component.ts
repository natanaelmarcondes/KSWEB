import { Component, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { ButtonComponent } from '../../shared/ui/button/button.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  readonly usuario = computed(() => this.authService.usuario());

  constructor(private readonly authService: AuthService) {}

  sair(): void {
    this.authService.logout();
  }
}
