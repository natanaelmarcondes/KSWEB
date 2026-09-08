import { KsTableComponent, KsColumnDirective } from '../../../shared/components/ks-table/ks-table.component';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { KsButtonComponent } from '../../../shared/components/ks-button/ks-button.component';
import { SetorListItem } from '../setores.models';
import { SetoresService } from '../setores.service';

export interface SetorFiltro {
  page: number;
  pageSize: number;
  termo: string;
}

@Component({
  selector: 'app-setores-list',
  imports: [KsTableComponent, KsColumnDirective, KsButtonComponent, FormsModule],
  templateUrl: './setores-list.component.html',
  styleUrl: './setores-list.component.css',
})
export class SetoresListComponent {
  items: SetorListItem[] = [];
  setores: SetorListItem[] = [];
  setoresFiltrados: SetorListItem[] = [];

  total = 0;
  carregando = true;
  erro = '';
  excluindoId: number | null = null;

  filtro: SetorFiltro = {
    page: 1,
    pageSize: 25,
    termo: '',
  };

  constructor(
    private readonly setoresService: SetoresService,
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

    this.setoresService.listar().subscribe({
      next: (response) => {
        this.setores = response ?? [];
        this.aplicarFiltroLocal();
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Nao foi possivel carregar os setores.';
        this.items = [];
        this.setores = [];
        this.setoresFiltrados = [];
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
    void this.router.navigate(['/setores/novo']);
  }

  editar(setor: SetorListItem): void {
    void this.router.navigate(['/setores', setor.queueId], {
      state: { setor },
    });
  }

  excluir(setor: SetorListItem): void {
    const confirmar = window.confirm(`Excluir o setor ${setor.queueName}?`);

    if (!confirmar) {
      return;
    }

    this.excluindoId = setor.queueId;
    this.erro = '';

    this.setoresService.excluir(setor.queueId).subscribe({
      next: () => {
        this.excluindoId = null;
        this.carregar();
      },
      error: () => {
        this.erro = 'Nao foi possivel excluir o setor.';
        this.excluindoId = null;
      },
    });
  }

  private aplicarFiltroLocal(): void {
    const termo = this.normalizarTexto(this.filtro.termo);

    this.setoresFiltrados = this.setores.filter((setor) => {
      if (!termo) {
        return true;
      }

      const queueId = String(setor.queueId);
      const queueName = this.normalizarTexto(setor.queueName);

      return queueId.includes(termo) || queueName.includes(termo);
    });

    this.total = this.setoresFiltrados.length;
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

    this.items = this.setoresFiltrados.slice(inicio, fim);
  }

  private normalizarTexto(valor: string | number | null | undefined): string {
    return String(valor ?? '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }
}
