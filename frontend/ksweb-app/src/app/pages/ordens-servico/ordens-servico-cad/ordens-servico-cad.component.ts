import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { KsButtonComponent } from '../../../shared/components/ks-button/ks-button.component';
import { SetorListItem } from '../../setores/setores.models';
import { SetoresService } from '../../setores/setores.service';
import {
  OrdemServicoFormResponse,
  OrdemServicoHistoricoItem,
  OrdemServicoResolucaoResponse,
  OrdemServicoUsuarioOption,
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
  private readonly setoresService = inject(SetoresService);

  readonly codigo = Number(this.route.snapshot.paramMap.get('codigo') ?? 0);
  ordem: OrdemServicoFormResponse | null = null;
  historico: OrdemServicoHistoricoItem[] = [];
  usuarios: OrdemServicoUsuarioOption[] = [];
  setores: SetorListItem[] = [];
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
      usuarios: this.ordensServicoService.getUsuarios().pipe(catchError(() => of([]))),
      setores: this.setoresService.listar().pipe(catchError(() => of([]))),
      resolucao: this.ordensServicoService.consultarResolucao(this.codigo).pipe(catchError(() => of(null))),
      historico: this.ordensServicoService.consultarHistorico(this.codigo).pipe(catchError(() => of([]))),
      lida: this.ordensServicoService.marcarComoLida(this.codigo).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ ordem, usuarios, setores, resolucao, historico }) => {
        this.usuarios = Array.isArray(usuarios) ? usuarios : [];
        this.setores = Array.isArray(setores) ? setores : [];
        this.ordem = this.preencherCamposRelacionados(ordem);
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

  private preencherCamposRelacionados(ordem: OrdemServicoFormResponse): OrdemServicoFormResponse {
    return {
      ...ordem,
      requesterName: ordem.requesterName || this.obterNomeUsuario(ordem.requesterId),
      createdByName: ordem.createdByName || this.obterNomeUsuario(ordem.createdById),
      ownerName: ordem.ownerName || this.obterNomeUsuario(ordem.ownerId),
      queueName: ordem.queueName || this.obterSetorResponsavel(ordem.ownerId) || this.obterNomeSetor(ordem.queueId),
    };
  }

  private obterNomeUsuario(userId: number | null | undefined): string | null {
    if (!userId) {
      return null;
    }

    const usuario = this.obterUsuario(userId);

    return usuario?.firstName ?? usuario?.usrNome ?? usuario?.nome ?? usuario?.name ?? null;
  }

  private obterSetorResponsavel(ownerId: number | null | undefined): string | null {
    const responsavel = this.obterUsuario(ownerId);

    return responsavel?.setor ?? this.obterNomeSetor(responsavel?.queueId) ?? null;
  }

  private obterUsuario(userId: number | null | undefined): OrdemServicoUsuarioOption | null {
    if (!userId) {
      return null;
    }

    return this.usuarios.find((item) => {
      const usuarioId = item.userId ?? item.usrCodigo;
      return Number(usuarioId) === Number(userId);
    }) ?? null;
  }

  private obterNomeSetor(queueId: number | null | undefined): string | null {
    if (!queueId) {
      return null;
    }

    const setor = this.setores.find((item) => Number(item.queueId) === Number(queueId));

    return setor?.queueName ?? null;
  }

  voltar(): void {
    void this.router.navigate(['/ordens-servico']);
  }
}

