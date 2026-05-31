export interface UsuarioListItem {
  usrCodigo: number | null;
  userId: number;
  usrNome: string;
  usrEmail: string;
  usrNivel: string;
  queueId: number | null;
  setor: string | null;
}

export interface UsuarioFiltro {
  page: number;
  pageSize: number;
  termo: string;
}