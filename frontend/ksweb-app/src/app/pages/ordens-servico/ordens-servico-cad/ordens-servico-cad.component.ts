import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, firstValueFrom, forkJoin, of } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
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
  queueId: number | null;
}

@Component({
  selector: 'app-ordens-servico-cad',
  imports: [FormsModule, KsButtonComponent],
  templateUrl: './ordens-servico-cad.component.html',
  styleUrl: './ordens-servico-cad.component.css',
})
export class OrdensServicoCadComponent implements AfterViewInit, OnDestroy {
  @ViewChild('descricaoEditor') descricaoEditor?: ElementRef<HTMLDivElement>;
  @ViewChild('resolucaoEditor') resolucaoEditor?: ElementRef<HTMLDivElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ordensServicoService = inject(OrdensServicoService);
  private readonly setoresService = inject(SetoresService);
  private readonly authService = inject(AuthService);

  readonly codigo = Number(this.route.snapshot.paramMap.get('codigo') ?? 0);
  readonly novaOrdem = this.route.snapshot.routeConfig?.path === 'ordens-servico/novo';
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
  uploadsImagemDescricao = 0;
  uploadsImagemResolucao = 0;
  erro = '';
  erroEdicao = '';
  erroResolucao = '';
  clienteBusca = '';
  responsavelBusca = '';
  clienteDropdownAberto = false;
  responsavelDropdownAberto = false;
  private quillEditor: any = null;
  private descricaoQuillEditor: any = null;
  private descricaoPasteHandler: ((event: ClipboardEvent) => void) | null = null;
  private descricaoPasteTarget: HTMLElement | null = null;
  private resolucaoPasteHandler: ((event: ClipboardEvent) => void) | null = null;
  private resolucaoPasteTarget: HTMLElement | null = null;
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
    if (this.editandoOrdem && this.abaAtiva === 'descricao') {
      void this.inicializarEditorDescricao();
    }

    if (this.editandoResolucao) {
      void this.inicializarEditorResolucao();
    }
  }

  ngOnDestroy(): void {
    this.removerInterceptadorPasteDescricao();
    this.removerInterceptadorPasteResolucao();
    this.descricaoQuillEditor = null;
    this.quillEditor = null;
  }

  get enviandoImagemDescricao(): boolean {
    return this.uploadsImagemDescricao > 0;
  }

  get enviandoImagemResolucao(): boolean {
    return this.uploadsImagemResolucao > 0;
  }

  @HostListener('document:click', ['$event'])
  fecharAutocomplete(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;

    if (!target?.closest('.user-picker')) {
      this.clienteDropdownAberto = false;
      this.responsavelDropdownAberto = false;
    }
  }

  get descricaoHtml(): string {
    return this.normalizarHtmlImagensAnexas(this.htmlOuVazio(this.ordem?.fullDescription || this.ordem?.description));
  }

  carregar(): void {
    if (this.novaOrdem) {
      this.carregarNovaOrdem();
      return;
    }

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
        this.resolucaoHtml = this.normalizarHtmlImagensAnexas(this.obterHtmlResolucao(resolucao) || ordem.lastResolution || '');
        this.historico = Array.isArray(historico) ? historico : [];
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Nao foi possivel carregar a ordem de servico.';
        this.carregando = false;
      },
    });
  }

  carregarNovaOrdem(): void {
    this.carregando = true;
    this.erro = '';
    this.erroEdicao = '';
    this.editandoOrdem = true;
    this.abaAtiva = 'descricao';

    forkJoin({
      usuarios: this.ordensServicoService.getUsuarios().pipe(catchError(() => of([]))),
      status: this.ordensServicoService.getStatus().pipe(catchError(() => of([]))),
      setores: this.setoresService.listar().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ usuarios, status, setores }) => {
        const usuarioLogado = this.authService.usuario();
        const usuarioLogadoId = usuarioLogado?.userId ?? usuarioLogado?.usrCodigo ?? null;

        this.usuarios = Array.isArray(usuarios) ? usuarios : [];
        this.statusOptions = Array.isArray(status) ? status : [];
        this.setores = Array.isArray(setores) ? setores : [];
        this.formEdicao = {
          requesterId: usuarioLogadoId,
          title: '',
          description: '',
          fullDescription: '',
          ownerId: null,
          statusId: this.statusOptions[0]?.statusId ?? null,
          queueId: this.obterUsuario(usuarioLogadoId)?.queueId ?? null,
        };
        this.formEdicao.ownerId = this.usuarioPertenceAoSetor(usuarioLogadoId, this.formEdicao.queueId) ? usuarioLogadoId : null;
        this.clienteBusca = this.obterNomeUsuario(this.formEdicao.requesterId) ?? '';
        this.responsavelBusca = this.obterNomeUsuario(this.formEdicao.ownerId) ?? '';
        this.carregando = false;
        void this.inicializarEditorDescricao();
      },
      error: () => {
        this.erro = 'Nao foi possivel carregar os dados para nova ordem de servico.';
        this.carregando = false;
      },
    });
  }

  selecionarAba(aba: 'descricao' | 'resolucao' | 'historico'): void {
    this.abaAtiva = aba;

    if (aba === 'descricao' && this.editandoOrdem) {
      void this.inicializarEditorDescricao();
    }
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
      queueId: this.ordem.queueId,
    };
    this.clienteBusca = this.obterNomeUsuario(this.formEdicao.requesterId) ?? '';
    this.responsavelBusca = this.obterNomeUsuario(this.formEdicao.ownerId) ?? '';
    void this.inicializarEditorDescricao();
  }

  cancelarEdicaoOrdem(): void {
    if (this.novaOrdem) {
      this.voltar();
      return;
    }

    this.erroEdicao = '';
    this.editandoOrdem = false;
    this.salvandoOrdem = false;
    this.formEdicao = null;
    this.removerInterceptadorPasteDescricao();
    this.descricaoQuillEditor = null;
    this.clienteBusca = '';
    this.responsavelBusca = '';
  }

  salvarOrdem(): void {
    if ((!this.novaOrdem && (!this.codigo || !this.ordem)) || !this.formEdicao || this.salvandoOrdem) {
      return;
    }

    if (this.enviandoImagemDescricao) {
      this.erroEdicao = 'Aguarde o envio da imagem antes de salvar a ordem de servico.';
      return;
    }

    this.removerImagensBase64EditorDescricao();
    this.formEdicao.fullDescription = this.normalizarHtmlImagensAnexas(this.obterHtmlEditorDescricao());

    if (this.contemImagemBase64(this.formEdicao.fullDescription)) {
      this.erroEdicao = 'A descricao contem imagem em base64. Cole a imagem novamente para enviar pela API.';
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

    if (!request.requesterId) {
      this.erroEdicao = 'Informe o cliente da ordem de servico.';
      return;
    }

    this.salvandoOrdem = true;
    this.erroEdicao = '';

    if (this.novaOrdem) {
      this.ordensServicoService.criar({
        ...request,
        ownerId: request.ownerId ?? 0,
        statusId: request.statusId ?? 0,
      }).subscribe({
        next: (response) => {
          const novaId = response && typeof response === 'object'
            ? response.workorderId ?? response.numeroOs ?? response.id
            : null;

          this.salvandoOrdem = false;
          void this.router.navigate(novaId ? ['/ordens-servico', novaId] : ['/ordens-servico']);
        },
        error: () => {
          this.erroEdicao = 'Nao foi possivel criar a ordem de servico.';
          this.salvandoOrdem = false;
        },
      });
      return;
    }

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
        this.removerInterceptadorPasteDescricao();
        this.descricaoQuillEditor = null;
        this.formEdicao = null;
      },
      error: () => {
        this.erroEdicao = 'Nao foi possivel salvar a ordem de servico.';
        this.salvandoOrdem = false;
      },
    });
  }

  aoSelecionarSetor(): void {
    if (!this.formEdicao) {
      return;
    }

    if (!this.usuarioPertenceAoSetor(this.formEdicao.ownerId, this.formEdicao.queueId)) {
      this.formEdicao.ownerId = null;
      this.responsavelBusca = '';
    }
  }

  abrirClienteDropdown(): void {
    if (this.salvandoOrdem) {
      return;
    }

    this.responsavelDropdownAberto = false;
    this.clienteDropdownAberto = true;
  }

  abrirResponsavelDropdown(): void {
    if (this.salvandoOrdem) {
      return;
    }

    this.clienteDropdownAberto = false;
    this.responsavelDropdownAberto = true;
  }

  aoDigitarCliente(): void {
    if (!this.formEdicao) {
      return;
    }

    this.formEdicao.requesterId = null;
    this.clienteDropdownAberto = true;
  }

  aoDigitarResponsavel(): void {
    if (!this.formEdicao) {
      return;
    }

    this.formEdicao.ownerId = null;
    this.responsavelDropdownAberto = true;
  }

  selecionarCliente(usuario: OrdemServicoUsuarioOption): void {
    if (!this.formEdicao) {
      return;
    }

    this.formEdicao.requesterId = this.usuarioIdOption(usuario);
    this.clienteBusca = this.nomeUsuarioOption(usuario);
    this.clienteDropdownAberto = false;
  }

  selecionarResponsavel(usuario: OrdemServicoUsuarioOption): void {
    if (!this.formEdicao) {
      return;
    }

    this.formEdicao.ownerId = this.usuarioIdOption(usuario);
    this.responsavelBusca = this.nomeUsuarioOption(usuario);
    this.responsavelDropdownAberto = false;
  }

  private async inicializarEditorDescricao(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));

    if (!this.editandoOrdem || this.abaAtiva !== 'descricao' || !this.formEdicao || !this.descricaoEditor?.nativeElement || this.descricaoQuillEditor) {
      return;
    }

    const { default: Quill } = await import('quill');

    this.descricaoQuillEditor = new Quill(this.descricaoEditor.nativeElement, {
      modules: {
        toolbar: this.quillToolbarOptions,
      },
      theme: 'snow',
    });

    this.carregarHtmlNoEditorDescricao(this.formEdicao.fullDescription);
    this.configurarInterceptadorPasteDescricao();
    this.descricaoQuillEditor.on('text-change', () => {
      if (this.formEdicao) {
        this.formEdicao.fullDescription = this.obterHtmlEditorDescricao();
      }
    });
  }

  private configurarInterceptadorPasteDescricao(): void {
    this.removerInterceptadorPasteDescricao();

    this.descricaoPasteHandler = (event: ClipboardEvent) => {
      void this.aoColarNoEditorDescricao(event);
    };
    const target = this.descricaoEditor?.nativeElement ?? this.descricaoQuillEditor?.root ?? null;

    if (!target) {
      return;
    }

    this.descricaoPasteTarget = target;
    target.addEventListener('paste', this.descricaoPasteHandler, true);
  }

  private removerInterceptadorPasteDescricao(): void {
    if (!this.descricaoPasteTarget || !this.descricaoPasteHandler) {
      this.descricaoPasteHandler = null;
      this.descricaoPasteTarget = null;
      return;
    }

    this.descricaoPasteTarget.removeEventListener('paste', this.descricaoPasteHandler, true);
    this.descricaoPasteHandler = null;
    this.descricaoPasteTarget = null;
  }

  private async aoColarNoEditorDescricao(event: ClipboardEvent): Promise<void> {
    const imagens = this.obterImagensDoClipboard(event.clipboardData);

    if (!imagens.length) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.erroEdicao = '';

    if (!this.codigo) {
      this.erroEdicao = 'Salve a ordem de servico antes de colar imagens na descricao.';
      return;
    }

    const range = this.descricaoQuillEditor.getSelection(true);
    let indiceInsercao = range?.index ?? this.descricaoQuillEditor.getLength();

    const texto = event.clipboardData?.getData('text/plain')?.trim();
    if (texto) {
      this.descricaoQuillEditor.insertText(indiceInsercao, texto, 'user');
      indiceInsercao += texto.length;
    }

    for (const imagem of imagens) {
      this.uploadsImagemDescricao += 1;

      try {
        const response = await firstValueFrom(this.ordensServicoService.enviarImagemDescricao(this.codigo, imagem));
        const url = this.obterUrlImagemUpload(response);

        if (!url) {
          throw new Error('Resposta da API sem URL da imagem.');
        }

        this.descricaoQuillEditor.insertEmbed(indiceInsercao, 'image', url, 'user');
        indiceInsercao += 1;
        this.descricaoQuillEditor.setSelection(indiceInsercao, 0, 'silent');
        this.removerImagensBase64EditorDescricao();
        if (this.formEdicao) {
          this.formEdicao.fullDescription = this.obterHtmlEditorDescricao();
        }
      } catch {
        this.erroEdicao = 'Nao foi possivel enviar a imagem colada.';
      } finally {
        this.uploadsImagemDescricao = Math.max(0, this.uploadsImagemDescricao - 1);
      }
    }
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
    this.removerInterceptadorPasteResolucao();
    this.editandoResolucao = false;
    this.quillEditor = null;
  }

  salvarResolucao(): void {
    if (!this.codigo || this.salvandoResolucao) {
      return;
    }

    if (this.enviandoImagemResolucao) {
      this.erroResolucao = 'Aguarde o envio da imagem antes de salvar a resolucao.';
      return;
    }

    this.salvandoResolucao = true;
    this.erroResolucao = '';
    this.removerImagensBase64EditorResolucao();
    this.resolucaoEdicaoHtml = this.normalizarHtmlImagensAnexas(this.obterHtmlEditorResolucao());

    if (this.contemImagemBase64(this.resolucaoEdicaoHtml)) {
      this.erroResolucao = 'A resolucao contem imagem em base64. Cole a imagem novamente para enviar pela API.';
      this.salvandoResolucao = false;
      return;
    }

    this.ordensServicoService.salvarResolucao(this.codigo, {
      resolucaoHtml: this.resolucaoEdicaoHtml,
    }).subscribe({
      next: () => {
        this.resolucaoHtml = this.normalizarHtmlImagensAnexas(this.resolucaoEdicaoHtml);
        if (this.ordem) {
          this.ordem = {
            ...this.ordem,
            lastResolution: this.resolucaoHtml,
          };
        }
        this.salvandoResolucao = false;
        this.removerInterceptadorPasteResolucao();
        this.editandoResolucao = false;
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
    this.configurarInterceptadorPasteResolucao();
    this.quillEditor.on('text-change', () => {
      this.resolucaoEdicaoHtml = this.obterHtmlEditorResolucao();
    });
  }

  private configurarInterceptadorPasteResolucao(): void {
    this.removerInterceptadorPasteResolucao();

    this.resolucaoPasteHandler = (event: ClipboardEvent) => {
      void this.aoColarNoEditorResolucao(event);
    };
    const target = this.resolucaoEditor?.nativeElement ?? this.quillEditor?.root ?? null;

    if (!target) {
      return;
    }

    this.resolucaoPasteTarget = target;
    target.addEventListener('paste', this.resolucaoPasteHandler, true);
  }

  private removerInterceptadorPasteResolucao(): void {
    if (!this.resolucaoPasteTarget || !this.resolucaoPasteHandler) {
      this.resolucaoPasteHandler = null;
      this.resolucaoPasteTarget = null;
      return;
    }

    this.resolucaoPasteTarget.removeEventListener('paste', this.resolucaoPasteHandler, true);
    this.resolucaoPasteHandler = null;
    this.resolucaoPasteTarget = null;
  }

  private async aoColarNoEditorResolucao(event: ClipboardEvent): Promise<void> {
    const imagens = this.obterImagensDoClipboard(event.clipboardData);

    if (!imagens.length) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.erroResolucao = '';

    const range = this.quillEditor.getSelection(true);
    let indiceInsercao = range?.index ?? this.quillEditor.getLength();

    const texto = event.clipboardData?.getData('text/plain')?.trim();
    if (texto) {
      this.quillEditor.insertText(indiceInsercao, texto, 'user');
      indiceInsercao += texto.length;
    }

    for (const imagem of imagens) {
      this.uploadsImagemResolucao += 1;

      try {
        const response = await firstValueFrom(this.ordensServicoService.enviarImagemResolucao(this.codigo, imagem));
        const url = this.obterUrlImagemUpload(response);

        if (!url) {
          throw new Error('Resposta da API sem URL da imagem.');
        }

        this.quillEditor.insertEmbed(indiceInsercao, 'image', url, 'user');
        indiceInsercao += 1;
        this.quillEditor.setSelection(indiceInsercao, 0, 'silent');
        this.removerImagensBase64EditorResolucao();
        this.resolucaoEdicaoHtml = this.obterHtmlEditorResolucao();
      } catch {
        this.erroResolucao = 'Nao foi possivel enviar a imagem colada.';
      } finally {
        this.uploadsImagemResolucao = Math.max(0, this.uploadsImagemResolucao - 1);
      }
    }
  }

  private obterImagensDoClipboard(clipboardData: DataTransfer | null): File[] {
    if (!clipboardData) {
      return [];
    }

    const arquivos = Array.from(clipboardData.items)
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((arquivo): arquivo is File => !!arquivo);

    if (arquivos.length) {
      return arquivos;
    }

    return this.obterImagensBase64DoHtml(clipboardData.getData('text/html'));
  }

  private obterImagensBase64DoHtml(html: string): File[] {
    if (!html?.includes('data:image/')) {
      return [];
    }

    const template = document.createElement('template');
    template.innerHTML = html;

    return Array.from(template.content.querySelectorAll<HTMLImageElement>('img[src^="data:image/"]'))
      .map((imagem, index) => this.converterDataUrlParaArquivo(imagem.src, `resolution-image-${index + 1}`))
      .filter((arquivo): arquivo is File => !!arquivo);
  }

  private converterDataUrlParaArquivo(dataUrl: string, nomeBase: string): File | null {
    const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

    if (!match?.[1] || !match[2]) {
      return null;
    }

    try {
      const bytes = atob(match[2]);
      const buffer = new Uint8Array(bytes.length);

      for (let index = 0; index < bytes.length; index += 1) {
        buffer[index] = bytes.charCodeAt(index);
      }

      const extensao = match[1].split('/')[1] || 'png';
      return new File([buffer], `${nomeBase}.${extensao}`, { type: match[1] });
    } catch {
      return null;
    }
  }

  private obterUrlImagemUpload(response: unknown): string | null {
    if (typeof response === 'string') {
      return response.trim() || null;
    }

    if (!response || typeof response !== 'object') {
      return null;
    }

    const dados = response as Record<string, unknown>;
    const url = dados['url'] ?? dados['imageUrl'] ?? dados['src'] ?? dados['path'] ?? dados['fileUrl'];

    return typeof url === 'string' && url.trim() ? url.trim() : null;
  }

  private contemImagemBase64(html: string): boolean {
    return /<img\b[^>]*\bsrc=["']data:image\//i.test(html);
  }

  private removerImagensBase64EditorResolucao(): void {
    const editorRoot = this.quillEditor?.root as HTMLElement | null | undefined;

    editorRoot
      ?.querySelectorAll('img[src^="data:image/"]')
      .forEach((imagem) => imagem.remove());
  }

  private removerImagensBase64EditorDescricao(): void {
    const editorRoot = this.descricaoQuillEditor?.root as HTMLElement | null | undefined;

    editorRoot
      ?.querySelectorAll('img[src^="data:image/"]')
      .forEach((imagem) => imagem.remove());
  }

  private carregarHtmlNoEditorDescricao(html: string): void {
    const conteudo = html || '';

    this.descricaoQuillEditor.setText('', 'silent');
    this.descricaoQuillEditor.clipboard.dangerouslyPasteHTML(0, conteudo, 'silent');
    if (this.formEdicao) {
      this.formEdicao.fullDescription = this.obterHtmlEditorDescricao();
    }
  }

  private obterHtmlEditorDescricao(): string {
    return this.descricaoQuillEditor?.root?.innerHTML ?? this.formEdicao?.fullDescription ?? '';
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

  private normalizarHtmlImagensAnexas(html: string): string {
    if (!html?.trim() || !html.includes('inlineimages')) {
      return html;
    }

    const template = document.createElement('template');
    template.innerHTML = html;

    template.content.querySelectorAll<HTMLImageElement>('img[src*="inlineimages"]').forEach((imagem) => {
      const src = imagem.getAttribute('src') ?? '';
      const novoSrc = this.normalizarSrcImagemAnexa(src);

      if (novoSrc) {
        imagem.setAttribute('src', novoSrc);
        imagem.setAttribute('loading', 'lazy');
      }
    });

    return template.innerHTML;
  }

  private normalizarSrcImagemAnexa(src: string): string {
    const numeroOs = this.ordem?.workorderId || this.codigo;

    if (!numeroOs || !src?.trim()) {
      return src;
    }

    const caminho = src.trim().replace(/\\/g, '/');
    const match = caminho.match(/\/?inlineimages\/WorkOrder\/[^/"')\s]+\/(.+)$/i);

    if (!match?.[1]) {
      return caminho.startsWith('/inlineimages/') ? caminho : `/${caminho.replace(/^\/+/, '')}`;
    }

    return `/inlineimages/WorkOrder/${numeroOs}/${match[1]}`;
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

  get usuariosResponsavelOptions(): OrdemServicoUsuarioOption[] {
    if (!this.novaOrdem || !this.formEdicao?.queueId) {
      return this.usuarios;
    }

    return this.usuarios.filter((usuario) => Number(usuario.queueId) === Number(this.formEdicao?.queueId));
  }

  get clientesFiltrados(): OrdemServicoUsuarioOption[] {
    return this.filtrarUsuarios(this.usuarios, this.clienteBusca);
  }

  get responsaveisFiltrados(): OrdemServicoUsuarioOption[] {
    return this.filtrarUsuarios(this.usuariosResponsavelOptions, this.responsavelBusca);
  }

  usuarioIdOption(usuario: OrdemServicoUsuarioOption): number | null {
    const usuarioId = usuario.userId ?? usuario.usrCodigo;

    return usuarioId === null || usuarioId === undefined ? null : Number(usuarioId);
  }

  private usuarioPertenceAoSetor(userId: number | null | undefined, queueId: number | null | undefined): boolean {
    if (!userId) {
      return false;
    }

    if (!queueId) {
      return true;
    }

    return Number(this.obterUsuario(userId)?.queueId) === Number(queueId);
  }

  private filtrarUsuarios(usuarios: OrdemServicoUsuarioOption[], termo: string): OrdemServicoUsuarioOption[] {
    const termoNormalizado = this.normalizarTexto(termo);

    if (!termoNormalizado) {
      return usuarios;
    }

    return usuarios.filter((usuario) => this.normalizarTexto(this.nomeUsuarioOption(usuario)).includes(termoNormalizado));
  }

  private normalizarTexto(valor: string | null | undefined): string {
    return (valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private obterNomeStatus(statusId: number | null | undefined): string | null {
    if (!statusId) {
      return null;
    }

    return this.statusOptions.find((item) => Number(item.statusId) === Number(statusId))?.statusName ?? null;
  }

  obterNomeSetor(queueId: number | null | undefined): string | null {
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

