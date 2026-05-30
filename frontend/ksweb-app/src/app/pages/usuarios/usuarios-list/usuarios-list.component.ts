import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { UsuarioResumo } from '../usuarios.models';
import { UsuariosService } from '../usuarios.service';

@Component({
  selector: 'app-usuarios-list',
  imports: [ButtonComponent, FormsModule],
  templateUrl: './usuarios-list.component.html',
  styleUrl: './usuarios-list.component.css',
})
export class UsuariosListComponent {
  usuarios: UsuarioResumo[] = [];
  termo = '';
  page = 1;
  pageSize = 25;
  carregando = true;
  erro = '';

  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly router: Router,
  ) {
    this.carregar();
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.usuarios.length / this.pageSize));
  }

  get intervalo(): string {
    if (this.usuarios.length === 0) {
      return '0 de 0';
    }

    const inicio = (this.page - 1) * this.pageSize + 1;
    const fim = Math.min(this.usuarios.length, this.page * this.pageSize);
    return `${inicio}-${fim} de ${this.usuarios.length}`;
  }

  get usuariosPaginados(): UsuarioResumo[] {
    const inicio = (this.page - 1) * this.pageSize;
    return this.usuarios.slice(inicio, inicio + this.pageSize);
  }

  carregar(): void {
    this.carregando = true;
    this.erro = '';

    this.usuariosService.listar(this.termo).subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.page = Math.min(this.page, this.totalPaginas);
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Nao foi possivel carregar os usuarios.';
        this.carregando = false;
      },
    });
  }

  pesquisar(): void {
    this.page = 1;
    this.carregar();
  }

  paginaAnterior(): void {
    if (this.page <= 1) {
      return;
    }

    this.page -= 1;
  }

  proximaPagina(): void {
    if (this.page >= this.totalPaginas) {
      return;
    }

    this.page += 1;
  }

  alterarPageSize(): void {
    this.page = 1;
  }

  novo(): void {
    void this.router.navigate(['/usuarios/novo']);
  }

  editar(usuario: UsuarioResumo): void {
    void this.router.navigate(['/usuarios', usuario.usrCodigo]);
  }
}
