export interface AuthUsuario {
  usrCodigo: number;
  userId: number;
  nome: string;
  email: string;
  nivel: string;
  setor: string;
  queues: string[];
}

export interface LoginRequest {
  email: string;
  senha: string;
  manterConectado: boolean;
}

export interface AuthResponse {
  usuario: AuthUsuario;
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}

export interface MeResponse {
  usuario: AuthUsuario;
}
