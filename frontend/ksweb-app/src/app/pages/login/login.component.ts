import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { CheckboxComponent } from '../../shared/ui/checkbox/checkbox.component';
import { TextFieldComponent } from '../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, ButtonComponent, CheckboxComponent, TextFieldComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly carregando = signal(false);
  readonly erro = signal('');

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required]],
    manterConectado: [true],
  });

  entrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.carregando.set(true);
    this.erro.set('');

    const payload = this.form.getRawValue();

    this.authService.login({ ...payload, email: payload.email.trim() }).subscribe({
      next: () => void this.router.navigate(['/dashboard']),
      error: (error: unknown) => {
        this.erro.set(this.getLoginErrorMessage(error));
        this.carregando.set(false);
      },
    });
  }

  private getLoginErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status !== 401) {
      return 'Nao foi possivel conectar a API de autenticacao.';
    }

    return 'Email ou senha invalido.';
  }
}
