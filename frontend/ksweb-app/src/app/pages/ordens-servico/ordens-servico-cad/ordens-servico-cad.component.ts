import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { KsButtonComponent } from '../../../shared/components/ks-button/ks-button.component';
import {
  OrdemServicoFormResponse,
  OrdemServicoHistoricoItem,
  OrdemServicoResolucaoItem,
} from '../ordens-servico.models';
import { OrdensServicoService } from '../ordens-servico.service';

@Component({
  selector: 'app-ordens-servico-cad',
  imports: [KsButtonComponent],
  templateUrl: './ordens-servico-cad.component.html',
  styleUrl: './ordens-servico-cad.component.css',
})
export class OrdensServicoCadComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ordensServicoService = inject(OrdensServicoService);

  readonly codigo = Number(this.route.snapshot.paramMap.get('codigo') ?? 0);
  ordem: OrdemServicoFormResponse | null = null;
  resolucoes: OrdemServicoResolucaoItem[] = [];
  abaAtiva: 'descricao' | 'resolucao' | 'historico' = 'descricao';
  carregando = true;
  erro = '';

  constructor() {
    this.carregar();
  }

  get historico(): OrdemServicoHistoricoItem[] {
    return this.ordem?.historico ?? [];
  }

  get descricao(): string {
    return this.ordem?.fullDescription || this.ordem?.description || '-';
  }

  carregar(): void {
    if (!this.codigo) {
      this.erro = 'Codigo da ordem de servico invalido.';
      this.carregando = false;
      return;
    }

    this.carregando = true;
    this.erro = '';

    forkJoin({
      ordem: this.ordensServicoService.consultar(this.codigo),
      resolucoes: this.ordensServicoService.consultarResolucoes(this.codigo),
    }).subscribe({
      next: ({ ordem, resolucoes }) => {
        this.ordem = ordem;
        this.resolucoes = resolucoes ?? [];
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Nao foi possivel carregar a ordem de servico.';
        this.carregando = false;
      },
    });
  }

  selecionarAba(aba: 'descricao' | 'resolucao' | 'historico'): void {
    this.abaAtiva = aba;
  }

  formatarData(valor: number | null | undefined): string {
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

  valor(valor: string | number | null | undefined): string {
    if (valor === null || valor === undefined || valor === '') {
      return '-';
    }

    return String(valor);
  }

  voltar(): void {
    void this.router.navigate(['/ordens-servico']);
  }
}

