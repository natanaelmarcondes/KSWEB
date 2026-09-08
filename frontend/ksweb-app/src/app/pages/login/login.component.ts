import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { KsButtonComponent } from '../../shared/components/ks-button/ks-button.component';
import { KsInputComponent } from '../../shared/components/ks-input/ks-input.component';

const LAST_LOGIN_EMAIL_KEY = 'ksweb_last_login_email';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, KsButtonComponent, KsInputComponent],
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
    email: [this.readLastLoginEmail(), [Validators.required, Validators.email]],
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
      next: () => {
        this.saveLastLoginEmail(payload.email.trim());
        void this.router.navigate(['/dashboard']);
      },
      error: (error: unknown) => {
        this.erro.set(this.getLoginErrorMessage(error));
        this.carregando.set(false);
      },
    });
  }

  private readLastLoginEmail(): string {
    try {
      return localStorage.getItem(LAST_LOGIN_EMAIL_KEY) ?? '';
    } catch {
      return '';
    }
  }

  private saveLastLoginEmail(email: string): void {
    try {
      localStorage.setItem(LAST_LOGIN_EMAIL_KEY, email);
    } catch {
      // O login continua mesmo quando o navegador bloqueia o armazenamento.
    }
  }

  private getLoginErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status !== 401) {
      return 'Nao foi possivel conectar a API de autenticacao.';
    }

    return 'Email ou senha invalido.';
  }
}
