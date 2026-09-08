import { KsGridActionComponent } from '../../shared/components/ks-grid-action/ks-grid-action.component';
import { KsTableComponent, KsColumnDirective } from '../../shared/components/ks-table/ks-table.component';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { KsButtonComponent } from '../../shared/components/ks-button/ks-button.component';

interface UltimaOsVisitada {
  numero: number;
  titulo: string;
  dataVisualizacao: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [KsGridActionComponent, KsButtonComponent, KsTableComponent, KsColumnDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
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
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  get nomeUsuario(): string {
    return this.authService.usuario()?.nome || 'Usuario';
  }

  abrirMinhasOs(): void {
    void this.router.navigate(['/ordens-servico']);
  }

  abrirOs(numero: number): void {
    void this.router.navigate(['/ordens-servico'], { queryParams: { os: numero } });
  }

}
