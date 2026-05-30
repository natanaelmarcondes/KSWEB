import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { SelectFieldOption } from '../../../shared/ui/select-field/select-field.component';
import { AtualizarUsuarioRequest, FilaOption, UsuarioEdicao } from '../usuarios.models';
import { UsuariosService } from '../usuarios.service';

@Component({
  selector: 'app-usuarios-cad',
  imports: [ButtonComponent, ReactiveFormsModule],
  templateUrl: './usuarios-cad.component.html',
  styleUrl: './usuarios-cad.component.css',
})
export class UsuariosCadComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usuariosService = inject(UsuariosService);

  readonly niveis: SelectFieldOption[] = [
    { value: 'USER', label: 'USER' },
    { value: 'ADMIN', label: 'ADMIN' },
  ];

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    usrNivel: ['USER', [Validators.required]],
    queueId: ['', [Validators.required]],
  });

  usuario?: UsuarioEdicao;
  filas: FilaOption[] = [];
  carregando = false;
  salvando = false;
  erro = '';
  mensagem = '';

  private readonly codigo = Number(this.route.snapshot.paramMap.get('codigo') ?? 0);

  constructor() {
    this.carregarFilas();

    if (this.editando) {
      this.carregarUsuario();
    }
  }

  get editando(): boolean {
    return this.codigo > 0;
  }

  get titulo(): string {
    return this.editando ? 'Editar usuario' : 'Novo usuario';
  }

  salvar(): void {
    this.form.markAllAsTouched();
    this.erro = '';
    this.mensagem = '';

    if (this.form.invalid) {
      this.erro = 'Preencha os campos obrigatorios.';
      return;
    }

    this.salvando = true;
    const raw = this.form.getRawValue();

    if (this.editando && this.usuario) {
      const payload: AtualizarUsuarioRequest = {
        setCodigo: this.usuario.setCodigo,
        userId: this.usuario.userId,
        nome: raw.nome.trim(),
        email: raw.email.trim(),
        usrNivel: raw.usrNivel,
        queueId: Number(raw.queueId),
      };

      this.usuariosService.atualizar(this.codigo, payload).subscribe({
        next: (usuario) => {
          this.usuario = usuario;
          this.mensagem = 'Usuario atualizado.';
          this.salvando = false;
        },
        error: (error: unknown) => this.handleError(error),
      });

      return;
    }

    this.usuariosService
      .criar({
        nome: raw.nome.trim(),
        email: raw.email.trim(),
        usrNivel: raw.usrNivel,
        queueId: Number(raw.queueId),
      })
      .subscribe({
        next: (usuario) => {
          this.salvando = false;
          void this.router.navigate(['/usuarios', usuario.usrCodigo]);
        },
        error: (error: unknown) => this.handleError(error),
      });
  }

  resetarSenha(): void {
    if (!this.editando) {
      return;
    }

    this.erro = '';
    this.mensagem = '';
    this.usuariosService.resetarSenha(this.codigo).subscribe({
      next: (response) => {
        this.mensagem = `Senha redefinida para ${response.senhaPadrao}.`;
      },
      error: () => {
        this.erro = 'Nao foi possivel resetar a senha.';
      },
    });
  }

  voltar(): void {
    void this.router.navigate(['/usuarios']);
  }

  private carregarFilas(): void {
    this.usuariosService.listarFilas().subscribe({
      next: (filas) => {
        this.filas = filas;
      },
      error: () => {
        this.erro = 'Nao foi possivel carregar as filas.';
      },
    });
  }

  private carregarUsuario(): void {
    this.carregando = true;
    this.usuariosService.obter(this.codigo).subscribe({
      next: (usuario) => {
        this.usuario = usuario;
        this.form.patchValue({
          nome: usuario.nome,
          email: usuario.email,
          usrNivel: usuario.nivel,
          queueId: String(usuario.queueId ?? ''),
        });
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Usuario nao encontrado.';
        this.carregando = false;
      },
    });
  }

  private handleError(error: unknown): void {
    const response = error as { error?: { mensagem?: string } };
    this.erro = response.error?.mensagem ?? 'Nao foi possivel salvar o usuario.';
    this.salvando = false;
  }
}
