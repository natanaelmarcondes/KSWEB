import { KsTableComponent, KsColumnDirective } from '../../../shared/components/ks-table/ks-table.component';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { KsButtonComponent } from '../../../shared/components/ks-button/ks-button.component';
import { UsuariosService } from '../usuarios.service';

export interface UsuarioListItem {
  usrCodigo: number | null;
  userId: number;
  usrNome: string;
  usrEmail: string;
  usrNivel: string;
  queueId: number | null;
  setor: string;
}

export interface UsuarioFiltro {
  page: number;
  pageSize: number;
  termo: string;
}

@Component({
  selector: 'app-usuarios-list',
  imports: [KsTableComponent, KsColumnDirective, KsButtonComponent, FormsModule],
  templateUrl: './usuarios-list.component.html',
  styleUrl: './usuarios-list.component.css',
})
export class UsuariosListComponent {
  items: UsuarioListItem[] = [];
  usuarios: UsuarioListItem[] = [];
  usuariosFiltrados: UsuarioListItem[] = [];

  total = 0;
  carregando = true;
  erro = '';

  filtro: UsuarioFiltro = {
    page: 1,
    pageSize: 25,
    termo: '',
  };

  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly router: Router,
  ) {
    this.carregar();
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.total / this.filtro.pageSize));
  }

  get intervalo(): string {
    if (this.total === 0) {
      return '0 de 0';
    }

    const inicio = (this.filtro.page - 1) * this.filtro.pageSize + 1;
    const fim = Math.min(this.total, this.filtro.page * this.filtro.pageSize);

    return `${inicio}-${fim} de ${this.total}`;
  }

  carregar(): void {
    this.carregando = true;
    this.erro = '';

    this.usuariosService.listar().subscribe({
      next: (response) => {
        this.usuarios = response ?? [];
        this.aplicarFiltroLocal();
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Nao foi possivel carregar os usuarios.';
        this.items = [];
        this.usuarios = [];
        this.usuariosFiltrados = [];
        this.total = 0;
        this.carregando = false;
      },
    });
  }

  pesquisar(): void {
    this.filtro.page = 1;
    this.aplicarFiltroLocal();
  }

  limparFiltros(): void {
    this.filtro = {
      page: 1,
      pageSize: 25,
      termo: '',
    };

    this.aplicarFiltroLocal();
  }

  paginaAnterior(): void {
    if (this.filtro.page <= 1) {
      return;
    }

    this.filtro.page -= 1;
    this.atualizarPagina();
  }

  proximaPagina(): void {
    if (this.filtro.page >= this.totalPaginas) {
      return;
    }

    this.filtro.page += 1;
    this.atualizarPagina();
  }

  alterarPageSize(): void {
    this.filtro.page = 1;
    this.atualizarPagina();
  }

  atualizar(): void {
    this.carregar();
  }

  novo(): void {
    void this.router.navigate(['/usuarios/novo']);
  }

  editar(usuario: UsuarioListItem): void {
    if (!usuario.usrCodigo) {
      return;
    }

    void this.router.navigate(['/usuarios', usuario.usrCodigo]);
  }

  nivelClasse(nivel: string | null | undefined): string {
    const valor = this.normalizarTexto(nivel);

    if (valor === 'admin') {
      return 'admin';
    }

    return 'user';
  }

  private aplicarFiltroLocal(): void {
    const termo = this.normalizarTexto(this.filtro.termo);

    this.usuariosFiltrados = this.usuarios.filter((usuario) => {
      if (!termo) {
        return true;
      }

      const usrCodigo = String(usuario.usrCodigo ?? '');
      const userId = String(usuario.userId ?? '');
      const queueId = String(usuario.queueId ?? '');
      const usrNome = this.normalizarTexto(usuario.usrNome);
      const usrEmail = this.normalizarTexto(usuario.usrEmail);
      const usrNivel = this.normalizarTexto(usuario.usrNivel);
      const setor = this.normalizarTexto(usuario.setor);

      return (
        usrCodigo.includes(termo) ||
        userId.includes(termo) ||
        queueId.includes(termo) ||
        usrNome.includes(termo) ||
        usrEmail.includes(termo) ||
        usrNivel.includes(termo) ||
        setor.includes(termo)
      );
    });

    this.total = this.usuariosFiltrados.length;
    this.atualizarPagina();
  }

  private atualizarPagina(): void {
    if (this.filtro.page > this.totalPaginas) {
      this.filtro.page = this.totalPaginas;
    }

    if (this.filtro.page < 1) {
      this.filtro.page = 1;
    }

    const inicio = (this.filtro.page - 1) * this.filtro.pageSize;
    const fim = inicio + this.filtro.pageSize;

    this.items = this.usuariosFiltrados.slice(inicio, fim);
  }

  private normalizarTexto(valor: string | number | null | undefined): string {
    return String(valor ?? '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }
}