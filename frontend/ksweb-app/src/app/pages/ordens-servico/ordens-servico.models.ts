export interface OrdemServicoListItem {
  numeroOs: number;
  titulo: string;
  criadoEmMs: number;
  criadoEm: string;
  solicitanteId: number;
  solicitante: string;
  criadoPorId: number;
  criadoPor: string;
  responsavelId: number;
  responsavel: string;
  setorId: number;
  setor: string;
  statusId: number;
  statusNome: string;
  atrasada: boolean;
  lida: boolean;
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
  filtrarPor?: 'solicitante' | 'criadoPor' | 'responsavel';
  filtroUsuarioNome?: string;
  filtroPessoa?: string;
  listarTudo?: boolean;
  usuarioId?: string;
}

export interface OrdemServicoGrupoOption {
  grpId: number;
  grpNome: string;
}

export interface OrdemServicoUsuarioGrupoOption {
  usrCodigo: number;
  usrNome: string;
}

export interface OrdemServicoCombosResponse {
  clientes: OrdemServicoUsuarioOption[];
  status: OrdemServicoStatusOption[];
  grupos: OrdemServicoGrupoOption[];
}

export interface OrdemServicoHistoricoItem {
  historyId: number;
  workorderId: number;
  operationOwnerId: number | null;
  operationTime: number | null;
  description: string | null;
  operation: string | null;
}

export interface OrdemServicoResolucaoItem {
  historyDiffId: number;
  historyId: number;
  columnName: string;
  prevValue: string | null;
  currentValue: string | null;
  operationTime: number | null;
}

export interface OrdemServicoFormResponse {
  workorderId: number | null;
  requesterId: number | null;
  requesterName: string | null;
  createdById: number | null;
  createdByName: string | null;
  createdTime: number | null;
  title: string;
  description: string;
  fullDescription: string;
  ownerId: number | null;
  ownerName: string | null;
  statusId: number | null;
  statusName: string | null;
  queueId: number | null;
  queueName: string | null;
  lastResolution: string | null;
  historico: OrdemServicoHistoricoItem[];
  resolucoes: OrdemServicoResolucaoItem[];
}

export interface SalvarOrdemServicoRequest {
  requesterId: number;
  title: string;
  description: string;
  fullDescription: string;
  ownerId: number | null;
  statusId: number | null;
}

export interface SalvarResolucaoRequest {
  html: string;
  texto: string;
}

export interface AlterarStatusAtribuirRequest {
  statusId: number | null;
  queueId: number | null;
  ownerId: number | null;
}
