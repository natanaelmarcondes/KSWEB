export interface DailyListItem {
  dailyId: number;
  dailyNumero: number;
  dailyData: string;
  dailyUsuario: string;
}

export interface DailyListResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPaginas: number;
  items: DailyListItem[];
}

export interface DailyFiltro {
  page: number;
  pageSize: number;
}

export interface DailyForm {
  dailyId: number | null;
  dailyNumero: number | null;
  dailyData: string;
  dailyUsuario: string;
}

export interface CriarDailyRequest {
  dailyUsuario: string;
}

export interface CriarDailyResponse {
  sucesso: boolean;
  mensagem: string;
  dailyId: number;
  dailyNumero: number;
}

export interface DailyRegistro {
  regId: number;
  dailyId?: number;
  regData: string;
  osId: number | null;
  regCliente: string;
  regDescricao: string;
  regStatus: string;
}

export interface DailyRegistrosResponse {
  dailyId: number;
  total: number;
  items: DailyRegistro[];
}

export interface DailyRegistroForm {
  regData: string;
  osId: number | null;
  regCliente: string;
  regDescricao: string;
  regStatus: string;
}
