import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { KsButtonComponent } from '../../../shared/components/ks-button/ks-button.component';
import { DailyFiltro, DailyListItem } from '../daily.models';
import { DailyService } from '../daily.service';

@Component({
  selector: 'app-daily-list',
  imports: [FormsModule, KsButtonComponent],
  templateUrl: './daily-list.component.html',
  styleUrl: './daily-list.component.css',
})
export class DailyListComponent {
  items: DailyListItem[] = [];
  total = 0;
  totalPaginasApi = 1;
  carregando = true;
  erro = '';
  criando = false;
  excluindoId: number | null = null;

  filtro: DailyFiltro = {
    page: 1,
    pageSize: 25,
  };

  constructor(
    private readonly dailyService: DailyService,
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {
    this.carregar();
  }

  get totalPaginas(): number {
    return Math.max(1, this.totalPaginasApi || Math.ceil(this.total / this.filtro.pageSize));
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

    this.dailyService.listar(this.filtro).subscribe({
      next: (response) => {
        this.items = response.items ?? [];
        this.total = response.total ?? 0;
        this.filtro.page = response.page ?? this.filtro.page;
        this.filtro.pageSize = response.pageSize ?? this.filtro.pageSize;
        this.totalPaginasApi = response.totalPaginas ?? this.totalPaginas;
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Nao foi possivel carregar as dailies.';
        this.items = [];
        this.total = 0;
        this.totalPaginasApi = 1;
        this.carregando = false;
      },
    });
  }

  pesquisar(): void {
    this.filtro.page = 1;
    this.carregar();
  }

  atualizar(): void {
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

  novo(): void {
    const dailyUsuario = this.authService.usuario()?.nome || 'Natanael';

    this.criando = true;
    this.erro = '';

    this.dailyService.criarNova({ dailyUsuario }).subscribe({
      next: (response) => {
        this.criando = false;

        if (!response.sucesso || !response.dailyId) {
          this.erro = response.mensagem || 'Nao foi possivel criar a daily.';
          return;
        }

        void this.router.navigate(['/daily', response.dailyId, 'registros']);
      },
      error: () => {
        this.erro = 'Nao foi possivel criar a daily.';
        this.criando = false;
      },
    });
  }

  editar(item: DailyListItem): void {
    void this.router.navigate(['/daily', item.dailyId, 'registros']);
  }

  excluir(item: DailyListItem, event?: Event): void {
    event?.stopPropagation();

    const confirmar = window.confirm(`Excluir a Daily Nº ${item.dailyNumero}?`);

    if (!confirmar) {
      return;
    }

    this.excluindoId = item.dailyId;
    this.erro = '';

    this.dailyService.excluir(item.dailyId).subscribe({
      next: () => {
        this.excluindoId = null;
        this.carregar();
      },
      error: () => {
        this.erro = 'Nao foi possivel excluir a daily.';
        this.excluindoId = null;
      },
    });
  }

  formatarData(valor: string | null | undefined): string {
    if (!valor) {
      return '-';
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return '-';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(data);
  }
}
