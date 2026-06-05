import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { KsButtonComponent } from '../../../shared/components/ks-button/ks-button.component';
import { SetorListItem } from '../../setores/setores.models';
import { SetoresService } from '../../setores/setores.service';
import {
  OrdemServicoFormResponse,
  OrdemServicoHistoricoItem,
  OrdemServicoResolucaoResponse,
  OrdemServicoStatusOption,
  OrdemServicoUsuarioOption,
  SalvarOrdemServicoRequest,
} from '../ordens-servico.models';
import { OrdensServicoService } from '../ordens-servico.service';

interface OrdemServicoEdicaoForm {
  requesterId: number | null;
  title: string;
  description: string;
  fullDescription: string;
  ownerId: number | null;
  statusId: number | null;
}

@Component({
  selector: 'app-ordens-servico-cad',
  imports: [FormsModule, KsButtonComponent],
  templateUrl: './ordens-servico-cad.component.html',
  styleUrl: './ordens-servico-cad.component.css',
})
export class OrdensServicoCadComponent implements AfterViewInit, OnDestroy {
  @ViewChild('resolucaoEditor') resolucaoEditor?: ElementRef<HTMLDivElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ordensServicoService = inject(OrdensServicoService);
  private readonly setoresService = inject(SetoresService);

  readonly codigo = Number(this.route.snapshot.paramMap.get('codigo') ?? 0);
  ordem: OrdemServicoFormResponse | null = null;
  historico: OrdemServicoHistoricoItem[] = [];
  usuarios: OrdemServicoUsuarioOption[] = [];
  statusOptions: OrdemServicoStatusOption[] = [];
  setores: SetorListItem[] = [];
  formEdicao: OrdemServicoEdicaoForm | null = null;
  resolucaoHtml = '';
  resolucaoEdicaoHtml = '';
  abaAtiva: 'descricao' | 'resolucao' | 'historico' = 'descricao';
  carregando = true;
  editandoOrdem = false;
  salvandoOrdem = false;
  editandoResolucao = false;
  salvandoResolucao = false;
  erro = '';
  erroEdicao = '';
  erroResolucao = '';
  private quillEditor: any = null;
  private readonly quillToolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],
    [{ header: [1, 2, 3, false] }],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['blockquote', 'code-block'],
    ['link'],
    ['clean'],
  ];

  constructor() {
    this.carregar();
  }

  ngAfterViewInit(): void {
    if (this.editandoResolucao) {
      void this.inicializarEditorResolucao();
    }
  }

  ngOnDestroy(): void {
    this.quillEditor = null;
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
      status: this.ordensServicoService.getStatus().pipe(catchError(() => of([]))),
      setores: this.setoresService.listar().pipe(catchError(() => of([]))),
      resolucao: this.ordensServicoService.consultarResolucao(this.codigo).pipe(catchError(() => of(null))),
      historico: this.ordensServicoService.consultarHistorico(this.codigo).pipe(catchError(() => of([]))),
      lida: this.ordensServicoService.marcarComoLida(this.codigo).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ ordem, usuarios, status, setores, resolucao, historico }) => {
        this.usuarios = Array.isArray(usuarios) ? usuarios : [];
        this.statusOptions = Array.isArray(status) ? status : [];
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

  editarOrdem(): void {
    if (!this.ordem) {
      return;
    }

    this.erroEdicao = '';
    this.abaAtiva = 'descricao';
    this.editandoOrdem = true;
    this.formEdicao = {
      requesterId: this.ordem.requesterId,
      title: this.ordem.title ?? '',
      description: this.ordem.description ?? '',
      fullDescription: this.ordem.fullDescription ?? '',
      ownerId: this.ordem.ownerId,
      statusId: this.ordem.statusId,
    };
  }

  cancelarEdicaoOrdem(): void {
    this.erroEdicao = '';
    this.editandoOrdem = false;
    this.salvandoOrdem = false;
    this.formEdicao = null;
  }

  salvarOrdem(): void {
    if (!this.codigo || !this.ordem || !this.formEdicao || this.salvandoOrdem) {
      return;
    }

    const request: SalvarOrdemServicoRequest = {
      requesterId: Number(this.formEdicao.requesterId ?? 0),
      title: this.formEdicao.title.trim(),
      description: this.formEdicao.description,
      fullDescription: this.formEdicao.fullDescription,
      ownerId: this.formEdicao.ownerId ? Number(this.formEdicao.ownerId) : null,
      statusId: this.formEdicao.statusId ? Number(this.formEdicao.statusId) : null,
    };

    if (!request.title) {
      this.erroEdicao = 'Informe o titulo da ordem de servico.';
      return;
    }

    this.salvandoOrdem = true;
    this.erroEdicao = '';

    this.ordensServicoService.salvar(this.codigo, request).subscribe({
      next: () => {
        this.ordem = this.preencherCamposRelacionados({
          ...this.ordem!,
          ...request,
          requesterName: this.obterNomeUsuario(request.requesterId),
          ownerName: this.obterNomeUsuario(request.ownerId),
          statusName: this.obterNomeStatus(request.statusId),
        });
        this.editandoOrdem = false;
        this.salvandoOrdem = false;
        this.formEdicao = null;
      },
      error: () => {
        this.erroEdicao = 'Nao foi possivel salvar a ordem de servico.';
        this.salvandoOrdem = false;
      },
    });
  }

  adicionarResolucao(): void {
    this.erroResolucao = '';
    this.resolucaoEdicaoHtml = this.resolucaoHtml;
    this.editandoResolucao = true;
    void this.inicializarEditorResolucao();
  }

  cancelarResolucao(): void {
    this.erroResolucao = '';
    this.resolucaoEdicaoHtml = this.resolucaoHtml;
    this.editandoResolucao = false;
    this.quillEditor = null;
  }

  salvarResolucao(): void {
    if (!this.codigo || this.salvandoResolucao) {
      return;
    }

    this.salvandoResolucao = true;
    this.erroResolucao = '';
    this.resolucaoEdicaoHtml = this.obterHtmlEditorResolucao();

    this.ordensServicoService.salvarResolucao(this.codigo, {
      resolucaoHtml: this.resolucaoEdicaoHtml,
    }).subscribe({
      next: () => {
        this.resolucaoHtml = this.resolucaoEdicaoHtml;
        if (this.ordem) {
          this.ordem = {
            ...this.ordem,
            lastResolution: this.resolucaoHtml,
          };
        }
        this.editandoResolucao = false;
        this.salvandoResolucao = false;
        this.quillEditor = null;
      },
      error: () => {
        this.erroResolucao = 'Nao foi possivel salvar a resolucao.';
        this.salvandoResolucao = false;
      },
    });
  }

  private async inicializarEditorResolucao(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));

    if (!this.editandoResolucao || !this.resolucaoEditor?.nativeElement || this.quillEditor) {
      return;
    }

    const { default: Quill } = await import('quill');

    this.quillEditor = new Quill(this.resolucaoEditor.nativeElement, {
      modules: {
        toolbar: this.quillToolbarOptions,
      },
      theme: 'snow',
    });

    this.carregarHtmlNoEditorResolucao(this.resolucaoEdicaoHtml);
    this.quillEditor.on('text-change', () => {
      this.resolucaoEdicaoHtml = this.obterHtmlEditorResolucao();
    });
  }

  private carregarHtmlNoEditorResolucao(html: string): void {
    const conteudo = html || '';

    this.quillEditor.setText('', 'silent');
    this.quillEditor.clipboard.dangerouslyPasteHTML(0, conteudo, 'silent');
    this.resolucaoEdicaoHtml = this.obterHtmlEditorResolucao();
  }

  private obterHtmlEditorResolucao(): string {
    return this.quillEditor?.root?.innerHTML ?? this.resolucaoEdicaoHtml;
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

  nomeUsuarioOption(usuario: OrdemServicoUsuarioOption): string {
    return usuario.firstName ?? usuario.usrNome ?? usuario.nome ?? usuario.name ?? '-';
  }

  usuarioIdOption(usuario: OrdemServicoUsuarioOption): number | null {
    const usuarioId = usuario.userId ?? usuario.usrCodigo;

    return usuarioId === null || usuarioId === undefined ? null : Number(usuarioId);
  }

  private obterNomeStatus(statusId: number | null | undefined): string | null {
    if (!statusId) {
      return null;
    }

    return this.statusOptions.find((item) => Number(item.statusId) === Number(statusId))?.statusName ?? null;
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

