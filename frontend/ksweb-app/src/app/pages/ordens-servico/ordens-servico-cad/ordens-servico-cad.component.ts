import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { KsButtonComponent } from '../../../shared/components/ks-button/ks-button.component';
import {
  OrdemServicoFormResponse,
  OrdemServicoHistoricoItem,
  OrdemServicoResolucaoResponse,
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
  historico: OrdemServicoHistoricoItem[] = [];
  resolucaoHtml = '';
  abaAtiva: 'descricao' | 'resolucao' | 'historico' = 'descricao';
  carregando = true;
  erro = '';

  constructor() {
    this.carregar();
  }

  get descricaoHtml(): string {
    return this.htmlOuVazio(this.ordem?.fullDescription || this.ordem?.description);
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
      resolucao: this.ordensServicoService.consultarResolucao(this.codigo).pipe(catchError(() => of(null))),
      historico: this.ordensServicoService.consultarHistorico(this.codigo).pipe(catchError(() => of([]))),
      lida: this.ordensServicoService.marcarComoLida(this.codigo).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ ordem, resolucao, historico }) => {
        this.ordem = ordem;
        this.resolucaoHtml = this.obterHtmlResolucao(resolucao) || ordem.lastResolution || '';
        this.historico = Array.isArray(historico) ? historico : [];
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

  htmlOuVazio(valor: string | null | undefined): string {
    if (!valor?.trim()) {
      return '';
    }

    return valor;
  }

  private obterHtmlResolucao(response: OrdemServicoResolucaoResponse | null): string {
    return this.htmlOuVazio(response?.resolucao);
  }

  voltar(): void {
    void this.router.navigate(['/ordens-servico']);
  }
}

