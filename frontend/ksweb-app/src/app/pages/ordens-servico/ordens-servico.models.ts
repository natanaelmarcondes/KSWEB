export interface OrdemServicoListItem {
  osCodigo: number;
  osData: number;
  osTitulo: string;
  cliente: string;
  usuarioAbertura: string;
  status: string | null;
  isRead: boolean | null;
  usuarioResponsavel: string;
}

export interface OrdemServicoListResponse {
  items: OrdemServicoListItem[];
  total: number;
  page: number;
  pageSize: number;
  usuarioLogadoNome: string | null;
}

export interface OrdemServicoStatusOption {
  statusId: number;
  statusName: string;
}

export interface OrdemServicoUsuarioOption {
  userId: number;
  firstName: string;
}

export interface OrdemServicoFiltrosResponse {
  status: OrdemServicoStatusOption[];
  usuarios: OrdemServicoUsuarioOption[];
}

export interface OrdemServicoFiltro {
  page: number;
  pageSize: number;
  numero?: string;
  texto?: string;
  statusId?: string;
  filtroUsuarioNome?: string;
  filtroPessoa?: string;
  listarTudo?: boolean;
  usuarioId?: string;
}
