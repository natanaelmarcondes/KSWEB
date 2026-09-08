import { KsTableComponent, KsColumnDirective } from '../../../shared/components/ks-table/ks-table.component';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { KsButtonComponent } from '../../../shared/components/ks-button/ks-button.component';
import { StatusFiltro, StatusListItem } from '../status.models';
import { StatusService } from '../status.service';

@Component({
  selector: 'app-status-list',
  imports: [KsTableComponent, KsColumnDirective, KsButtonComponent, FormsModule],
  templateUrl: './status-list.component.html',
  styleUrl: './status-list.component.css',
})
export class StatusListComponent {
  items: StatusListItem[] = [];
  status: StatusListItem[] = [];
  statusFiltrados: StatusListItem[] = [];

  total = 0;
  carregando = true;
  erro = '';
  excluindoId: number | null = null;

  filtro: StatusFiltro = {
    page: 1,
    pageSize: 25,
    termo: '',
  };

  constructor(
    private readonly statusService: StatusService,
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

    this.statusService.listar().subscribe({
      next: (response) => {
        this.status = response ?? [];
        this.aplicarFiltroLocal();
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Nao foi possivel carregar os status.';
        this.items = [];
        this.status = [];
        this.statusFiltrados = [];
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
    void this.router.navigate(['/status/novo']);
  }

  editar(item: StatusListItem): void {
    void this.router.navigate(['/status', item.statusId], {
      state: { status: item },
    });
  }

  excluir(item: StatusListItem): void {
    const confirmar = window.confirm(`Excluir o status ${item.statusName}?`);

    if (!confirmar) {
      return;
    }

    this.excluindoId = item.statusId;
    this.erro = '';

    this.statusService.excluir(item.statusId).subscribe({
      next: () => {
        this.excluindoId = null;
        this.carregar();
      },
      error: () => {
        this.erro = 'Nao foi possivel excluir o status.';
        this.excluindoId = null;
      },
    });
  }

  booleanClasse(valor: boolean): string {
    return valor ? 'sim' : 'nao';
  }

  booleanTexto(valor: boolean): string {
    return valor ? 'Sim' : 'Nao';
  }

  private aplicarFiltroLocal(): void {
    const termo = this.normalizarTexto(this.filtro.termo);

    this.statusFiltrados = this.status.filter((item) => {
      if (!termo) {
        return true;
      }

      const statusId = String(item.statusId ?? '');
      const statusName = this.normalizarTexto(item.statusName);
      const statusDescription = this.normalizarTexto(item.statusDescription);
      const internalName = this.normalizarTexto(item.internalName);
      const isPending = item.isPending ? 'sim true pendente' : 'nao false';
      const statusStopClock = item.statusStopClock ? 'sim true para relogio' : 'nao false';
      const isDeleted = item.isDeleted ? 'sim true excluido' : 'nao false ativo';

      return (
        statusId.includes(termo) ||
        statusName.includes(termo) ||
        statusDescription.includes(termo) ||
        internalName.includes(termo) ||
        isPending.includes(termo) ||
        statusStopClock.includes(termo) ||
        isDeleted.includes(termo)
      );
    });

    this.total = this.statusFiltrados.length;
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

    this.items = this.statusFiltrados.slice(inicio, fim);
  }

  private normalizarTexto(valor: string | number | boolean | null | undefined): string {
    return String(valor ?? '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }
}
