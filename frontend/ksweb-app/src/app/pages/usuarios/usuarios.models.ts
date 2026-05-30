export interface UsuarioResumo {
  usrCodigo: number;
  userId: number;
  nome: string;
  email: string;
  nivel: string;
  queueId: number | null;
  setor: string | null;
}

export interface UsuarioEdicao extends UsuarioResumo {
  setCodigo: number;
}

export interface FilaOption {
  queueId: number;
  queueName: string;
}

export interface CriarUsuarioRequest {
  nome: string;
  email: string;
  usrNivel: string;
  queueId: number;
}

export interface AtualizarUsuarioRequest extends CriarUsuarioRequest {
  setCodigo: number;
  userId: number;
}

export interface ResetSenhaResponse {
  usrCodigo: number;
  senhaPadrao: string;
}

