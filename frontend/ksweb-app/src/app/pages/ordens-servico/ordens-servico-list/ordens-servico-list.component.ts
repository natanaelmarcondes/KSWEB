// ...existing code...
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { KsButtonComponent } from '../../../shared/components/ks-button/ks-button.component';
import {
  OrdemServicoFiltro,
  OrdemServicoListItem,
  OrdemServicoStatusOption,
  OrdemServicoUsuarioOption,
} from '../ordens-servico.models';
import { OrdensServicoService } from '../ordens-servico.service';

@Component({
  selector: 'app-ordens-servico-list',
  imports: [KsButtonComponent, FormsModule],
  templateUrl: './ordens-servico-list.component.html',
  styleUrl: './ordens-servico-list.component.css',
})
export class OrdensServicoListComponent {
    filtroUsuarioTipo: string = 'Solicitante';
    usuariosApi: any[] = [];

    carregarUsuarios(): void {
      this.ordensServicoService.getUsuarios().subscribe({
        next: (usuarios) => {
          this.usuariosApi = usuarios;
        },
        error: () => {
          this.usuariosApi = [];
        },
      });
    }

    aoSelecionarUsuarioFiltro(): void {
      this.filtro.page = 1;
      this.carregar();
    }
  items: OrdemServicoListItem[] = [];
  statusOptions: OrdemServicoStatusOption[] = [];
  usuarioOptions: OrdemServicoUsuarioOption[] = [];
  total = 0;
  carregando = true;
  erro = '';

  filtro: OrdemServicoFiltro = {
    page: 1,
    pageSize: 25,
    numero: '',
    texto: '',
    statusId: '',
    filtroUsuarioNome: '',
    filtroPessoa: 'qualquer',
    listarTudo: false,
    usuarioId: '',
  };

  constructor(
    private readonly ordensServicoService: OrdensServicoService,
    private readonly router: Router,
  ) {
    this.carregarStatus();
    this.carregarUsuarios();
    this.carregar();
  }

  carregarStatus(): void {
    this.ordensServicoService.getStatus().subscribe({
      next: (status) => {
        this.statusOptions = status;
      },
      error: () => {
        this.statusOptions = [];
      },
    });
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

    this.ordensServicoService.listar(this.filtro).subscribe({
      next: (response) => {
        this.items = response.items;
        this.total = response.total;
        this.filtro.page = response.page;
        this.filtro.pageSize = response.pageSize;
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Nao foi possivel carregar as ordens de servico.';
        this.carregando = false;
      },
    });
  }

  pesquisar(): void {
    this.filtro.page = 1;
    this.carregar();
  }

  aoSelecionarStatus(): void {
    this.filtro.page = 1;
    this.carregar();
  }

  limparFiltros(): void {
    this.filtro = {
      page: 1,
      pageSize: 25,
      numero: '',
      texto: '',
      statusId: '',
      filtroUsuarioNome: '',
      filtroPessoa: 'qualquer',
      listarTudo: false,
      usuarioId: '',
    };
    this.carregar();
  }

  paginaAnterior(): void {
    if (this.filtro.page <= 1) {
      return;
    }

    this.filtro.page -= 1;
    this.carregar();
  }

  proximaPagina(): void {
    if (this.filtro.page >= this.totalPaginas) {
      return;
    }

    this.filtro.page += 1;
    this.carregar();
  }

  alterarPageSize(): void {
    this.filtro.page = 1;
    this.carregar();
  }

  abrir(ordem: OrdemServicoListItem): void {
    void this.router.navigate(['/ordens-servico', ordem.numeroOs]);
  }

  formatarData(valor: number): string {
    if (!valor) {
      return '-';
    }

    const date = new Date(valor);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  statusClasse(status: string | null): string {
    const normalized = (status ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (normalized.includes('closed') || normalized.includes('fech') || normalized.includes('resolved')) {
      return 'closed';
    }

    if (normalized.includes('program')) {
      return 'programacao';
    }

    if (normalized.includes('descontinu')) {
      return 'descontinuado';
    }

    return 'open';
  }

  private carregarFiltros(): void {
    this.ordensServicoService.obterFiltros().subscribe({
      next: (response) => {
        this.statusOptions = response.status;
        this.usuarioOptions = response.usuarios;
      },
      error: () => {
        this.statusOptions = [];
        this.usuarioOptions = [];
      },
    });
  }
}

