import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardService } from './dashboard.service';
import { DashboardResumo, DashboardStatusItem } from './dashboard.models';
import { AuthService } from '../../core/auth/auth.service';
import { KsButtonComponent } from '../../shared/components/ks-button/ks-button.component';
import { KsCardComponent } from '../../shared/components/ks-card/ks-card.component';

interface StatusResumoCard {
  status: string;
  titulo: string;
  total: number;
  classe: string;
}

interface UltimaOsVisitada {
  numero: number;
  titulo: string;
  dataVisualizacao: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [KsButtonComponent, KsCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  resumo?: DashboardResumo;
  carregando = true;
  erro = '';

  readonly ultimasOsVisitadas: UltimaOsVisitada[] = [
    {
      numero: 10428,
      titulo: 'Ajuste de permissao no modulo de usuarios',
      dataVisualizacao: '29/05/2026 19:42',
    },
    {
      numero: 10422,
      titulo: 'Validacao de integracao com fila de programacao',
      dataVisualizacao: '29/05/2026 18:10',
    },
    {
      numero: 10419,
      titulo: 'Conferencia de relatorio operacional',
      dataVisualizacao: '28/05/2026 16:35',
    },
  ];

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    this.carregarResumo();
  }

  get nomeUsuario(): string {
    return this.authService.usuario()?.nome || 'Usuario';
  }

  get statusResumo(): StatusResumoCard[] {
    return this.resumo?.status.map((item) => this.toStatusCard(item)) ?? [];
  }

  carregarResumo(): void {
    this.carregando = true;
    this.erro = '';

    this.dashboardService.carregarResumo().subscribe({
      next: (resumo) => {
        this.resumo = resumo;
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Nao foi possivel carregar os indicadores.';
        this.carregando = false;
      },
    });
  }

  abrirMinhasOs(): void {
    void this.router.navigate(['/ordens-servico']);
  }

  abrirPorStatus(status: string): void {
    void this.router.navigate(['/ordens-servico'], { queryParams: { status } });
  }

  abrirOs(numero: number): void {
    void this.router.navigate(['/ordens-servico'], { queryParams: { os: numero } });
  }

  private toStatusCard(item: DashboardStatusItem): StatusResumoCard {
    return {
      status: item.status,
      titulo: item.status,
      total: item.total,
      classe: this.getStatusClasse(item.status),
    };
  }

  private getStatusClasse(status: string): string {
    const normalized = status
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (normalized.includes('closed') || normalized.includes('fech') || normalized.includes('concl')) {
      return 'status-closed';
    }

    if (normalized.includes('program')) {
      return 'status-programacao';
    }

    if (normalized.includes('descontinu')) {
      return 'status-descontinuado';
    }

    return 'status-open';
  }
}
