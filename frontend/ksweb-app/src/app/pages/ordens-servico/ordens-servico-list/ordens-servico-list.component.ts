import { KsGridActionComponent } from '../../../shared/components/ks-grid-action/ks-grid-action.component';
import { KsPageLoader } from '../../../shared/components/ks-table/ks-table-datasource';
import { KsTableComponent, KsColumnDirective } from '../../../shared/components/ks-table/ks-table.component';
// ...existing code...
import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { KsButtonComponent } from '../../../shared/components/ks-button/ks-button.component';
import {
  OrdemServicoFiltro,
  OrdemServicoListItem,
  OrdemServicoStatusOption,
} from '../ordens-servico.models';
import { OrdensServicoService } from '../ordens-servico.service';

@Component({
  selector: 'app-ordens-servico-list',
  imports: [KsGridActionComponent, KsTableComponent, KsColumnDirective, KsButtonComponent, FormsModule],
  templateUrl: './ordens-servico-list.component.html',
  styleUrl: './ordens-servico-list.component.css',
})

export class OrdensServicoListComponent {
  filtroUsuarioTipo: string = 'Responsável';
  usuariosApi: any[] = [];
  usuarioOptions: { label: string; value: string }[] = [];
  statusOptions: OrdemServicoStatusOption[] = [];
  statusDropdownAberto = false;
  pessoaDropdownAberto = false;
  carregando = true;
  erro = '';

  filtro: OrdemServicoFiltro = {
    page: 1,
    pageSize: 25,
    numero: '',
    texto: '',
    status: ['Open', 'Enviado para programação'],
    filtrarPor: 'responsavel',
    filtroUsuarioNome: '',
    filtroPessoa: 'qualquer',
    listarTudo: false,
    usuarioId: '',
  };

  constructor(
    private readonly ordensServicoService: OrdensServicoService,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    this.aplicarFiltroUsuarioLogado();
    this.carregarStatus();
    this.carregarUsuarios();
    this.carregar();
  }

  @HostListener('document:click', ['$event'])
  fecharStatusDropdown(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;

    if (!target?.closest('.multiselect')) {
      this.statusDropdownAberto = false;
    }

    if (!target?.closest('.autocomplete')) {
      this.pessoaDropdownAberto = false;
    }
  }

  get statusSelecionadosResumo(): string {
    const totalSelecionados = this.filtro.status?.length ?? 0;

    if (totalSelecionados === 0) {
      return 'Todos os status';
    }

    if (totalSelecionados === 1) {
      return this.filtro.status?.[0] ?? '1 status selecionado';
    }

    return `${totalSelecionados} status selecionados`;
  }

  alternarStatusDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.pessoaDropdownAberto = false;
    this.statusDropdownAberto = !this.statusDropdownAberto;
  }

  statusSelecionado(statusName: string): boolean {
    return this.filtro.status?.includes(statusName) ?? false;
  }

  alternarStatus(statusName: string): void {
    const statusAtual = this.filtro.status ?? [];

    this.filtro.status = statusAtual.includes(statusName)
      ? statusAtual.filter((status) => status !== statusName)
      : [...statusAtual, statusName];

    this.aoSelecionarStatus();
  }

  get usuariosFiltrados(): { label: string; value: string }[] {
    const termo = this.normalizarTexto(this.filtro.filtroUsuarioNome ?? '');
    const usuarios = this.usuarioOptions;

    if (!termo) {
      return usuarios;
    }

    return usuarios
      .filter((usuario) => this.normalizarTexto(usuario.label).includes(termo));
  }

  abrirPessoaDropdown(): void {
    this.statusDropdownAberto = false;
    this.pessoaDropdownAberto = true;
  }

  aoDigitarPessoa(): void {
    this.filtro.usuarioId = '';
    this.pessoaDropdownAberto = true;
  }

  selecionarPessoa(usuario: { label: string; value: string }): void {
    this.filtro.filtroUsuarioNome = usuario.label;
    this.filtro.usuarioId = usuario.value;
    this.pessoaDropdownAberto = false;
    this.pesquisar();
  }

  carregarUsuarios(): void {
    this.ordensServicoService.getUsuarios().subscribe({
      next: (usuarios: any[]) => {
        this.usuariosApi = usuarios;
        this.usuarioOptions = this.mapearUsuariosOptions(usuarios);
      },
      error: () => {
        this.usuariosApi = [];
        this.usuarioOptions = [];
      },
    });
  }

  aoSelecionarUsuarioFiltro(): void {
    this.filtro.page = 1;
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

  loadPage!: KsPageLoader;

  carregar(): void {
    this.erro = '';
    const filtro = structuredClone(this.filtro);
    this.loadPage = (page, pageSize) => this.ordensServicoService.listar({ ...filtro, page, pageSize });
    this.carregando = false;
  }

  pesquisar(): void {
    this.filtro.page = 1;
    this.carregar();
  }

  aoSelecionarStatus(): void {
    this.filtro.page = 1;
    this.carregar();
  }

  aoSelecionarFiltroPor(): void {
    this.filtro.page = 1;

    if (this.filtro.filtroUsuarioNome?.trim()) {
      this.carregar();
    }
  }

  limparFiltros(): void {
    this.statusDropdownAberto = false;
    this.pessoaDropdownAberto = false;
    this.filtro = {
      page: 1,
      pageSize: 25,
      numero: '',
      texto: '',
      status: [],
      filtrarPor: 'solicitante',
      filtroUsuarioNome: '',
      filtroPessoa: 'qualquer',
      listarTudo: false,
      usuarioId: '',
    };
    this.carregar();
  }

  novo(): void {
    void this.router.navigate(['/ordens-servico', 'novo']);
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

  private normalizarTexto(valor: string | null | undefined): string {
    return (valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private mapearUsuariosOptions(usuarios: any[] | null | undefined): { label: string; value: string }[] {
    return (usuarios ?? [])
      .map((usuario: any) => {
        const label = usuario.usrNome ?? usuario.firstName ?? usuario.nome ?? usuario.name ?? '';
        const value = usuario.userId ?? usuario.usrCodigo ?? usuario.id ?? label;

        return {
          label: String(label).trim(),
          value: String(value),
        };
      })
      .filter((usuario) => usuario.label);
  }

  private aplicarFiltroUsuarioLogado(): void {
    const usuarioLogado = this.authService.usuario();

    this.filtro.filtrarPor = 'responsavel';
    this.filtro.filtroUsuarioNome = usuarioLogado?.nome ?? '';
    this.filtro.usuarioId = usuarioLogado?.userId ? String(usuarioLogado.userId) : '';
  }

  private carregarFiltros(): void {
    this.ordensServicoService.obterFiltros().subscribe({
      next: (response) => {
        this.statusOptions = response.status;
        this.usuarioOptions = this.mapearUsuariosOptions(response.usuarios);
      },
      error: () => {
        this.statusOptions = [];
        this.usuarioOptions = [];
      },
    });
  }
}

