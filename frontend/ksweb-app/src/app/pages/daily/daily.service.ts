import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CriarDailyRequest,
  CriarDailyResponse,
  DailyFiltro,
  DailyForm,
  DailyListResponse,
  DailyRegistro,
  DailyRegistroForm,
  DailyRegistrosResponse,
} from './daily.models';

@Injectable({
  providedIn: 'root',
})
export class DailyService {
  private readonly apiUrl = '/api/daily';

  constructor(private readonly http: HttpClient) {}

  listar(filtro: DailyFiltro): Observable<DailyListResponse> {
    const params = new HttpParams()
      .set('Page', filtro.page)
      .set('PageSize', filtro.pageSize);

    return this.http.get<DailyListResponse>(this.apiUrl, { params });
  }

  obter(dailyId: number): Observable<DailyForm> {
    return this.http.get<DailyForm>(`${this.apiUrl}/${dailyId}`);
  }

  criarNova(payload: CriarDailyRequest): Observable<CriarDailyResponse> {
    return this.http.post<CriarDailyResponse>(`${this.apiUrl}/nova`, payload);
  }

  excluir(dailyId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${dailyId}`);
  }

  listarRegistros(dailyId: number): Observable<DailyRegistrosResponse> {
    return this.http.get<DailyRegistrosResponse>(`${this.apiUrl}/${dailyId}/registros`);
  }

  adicionarRegistro(dailyId: number, form: DailyRegistroForm): Observable<DailyRegistro> {
    return this.http.post<DailyRegistro>(`${this.apiUrl}/${dailyId}/registros`, this.montarRegistroPayload(form));
  }

  alterarRegistro(dailyId: number, regId: number, form: DailyRegistroForm): Observable<DailyRegistro> {
    return this.http.put<DailyRegistro>(
      `${this.apiUrl}/${dailyId}/registros/${regId}`,
      this.montarRegistroPayload(form),
    );
  }

  excluirRegistro(dailyId: number, regId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${dailyId}/registros/${regId}`);
  }

  private montarRegistroPayload(form: DailyRegistroForm): DailyRegistroForm {
    return {
      regData: form.regData,
      osId: form.osId,
      regCliente: form.regCliente?.trim() ?? '',
      regDescricao: form.regDescricao?.trim() ?? '',
      regStatus: form.regStatus?.trim() ?? '',
    };
  }
}
