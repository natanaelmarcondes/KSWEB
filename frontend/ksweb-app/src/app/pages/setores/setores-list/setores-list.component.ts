import { inject } from '@angular/core';
import { KsConfirmService } from '../../../shared/components/ks-confirm/ks-confirm.service';
import { KsGridActionComponent } from '../../../shared/components/ks-grid-action/ks-grid-action.component';
import { KsTableComponent, KsColumnDirective } from '../../../shared/components/ks-table/ks-table.component';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { KsButtonComponent } from '../../../shared/components/ks-button/ks-button.component';
import { SetorListItem } from '../setores.models';
import { SetoresService } from '../setores.service';

export interface SetorFiltro {
  termo: string;
}

@Component({
  selector: 'app-setores-list',
  imports: [KsGridActionComponent, KsTableComponent, KsColumnDirective, KsButtonComponent, FormsModule],
  templateUrl: './setores-list.component.html',
  styleUrl: './setores-list.component.css',
})
export class SetoresListComponent {
  private readonly confirmacao = inject(KsConfirmService);
  items: SetorListItem[] = [];
  setores: SetorListItem[] = [];
  setoresFiltrados: SetorListItem[] = [];

  total = 0;
  carregando = true;
  erro = '';
  excluindoId: number | null = null;

  filtro: SetorFiltro = {
    termo: '',
  };

  constructor(
    private readonly setoresService: SetoresService,
    private readonly router: Router,
  ) {
    this.carregar();
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
    this.aplicarFiltroLocal();
  }

  limparFiltros(): void {
    this.filtro = {
      termo: '',
    };

    this.aplicarFiltroLocal();
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

  async excluir(setor: SetorListItem): Promise<void> {
    const confirmar = await this.confirmacao.confirmar(`Excluir o setor ${setor.queueName}?`);

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
    this.items = this.setoresFiltrados;
  }

  private normalizarTexto(valor: string | number | null | undefined): string {
    return String(valor ?? '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }
}
