import { KsGridActionComponent } from '../../../shared/components/ks-grid-action/ks-grid-action.component';
import { KsPageLoader } from '../../../shared/components/ks-table/ks-table-datasource';
import { KsTableComponent, KsColumnDirective } from '../../../shared/components/ks-table/ks-table.component';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { KsButtonComponent } from '../../../shared/components/ks-button/ks-button.component';
import { DailyFiltro, DailyListItem } from '../daily.models';
import { DailyService } from '../daily.service';

@Component({
  selector: 'app-daily-list',
  imports: [KsGridActionComponent, KsTableComponent, KsColumnDirective, KsButtonComponent],
  templateUrl: './daily-list.component.html',
  styleUrl: './daily-list.component.css',
})
export class DailyListComponent {
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

  loadPage!: KsPageLoader;

  carregar(): void {
    this.erro = '';
    const filtro = structuredClone(this.filtro);
    this.loadPage = (page, pageSize) => this.dailyService.listar({ ...filtro, page, pageSize });
    this.carregando = false;
  }

  pesquisar(): void {
    this.filtro.page = 1;
    this.carregar();
  }

  atualizar(): void {
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
