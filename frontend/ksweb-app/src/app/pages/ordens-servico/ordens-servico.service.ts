
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  OrdemServicoFiltro,
  OrdemServicoFiltrosResponse,
  OrdemServicoListResponse,
  OrdemServicoStatusOption,
} from './ordens-servico.models';

@Injectable({ providedIn: 'root' })
export class OrdensServicoService {
  private readonly apiUrl = '/api/ordens-servico-consulta';

  constructor(private readonly http: HttpClient) {}

  getUsuarios(): Observable<any[]> {
    return this.http.get<any[]>('/api/usuarios');
  }

  getStatus(): Observable<OrdemServicoStatusOption[]> {
    return this.http.get<OrdemServicoStatusOption[]>('/api/status');
  }

  listar(filtro: OrdemServicoFiltro): Observable<OrdemServicoListResponse> {
    let params = new HttpParams()
      .set('Page', filtro.page)
      .set('PageSize', filtro.pageSize);

    if (filtro.numero?.trim()) {
      params = params.set('NumeroOs', filtro.numero.trim());
    }
    if (filtro.filtroUsuarioNome?.trim()) {
      params = params.set('Solicitante', filtro.filtroUsuarioNome.trim());
    }
    if (filtro.texto?.trim()) {
      params = params.set('CriadoPor', filtro.texto.trim());
    }
    if (filtro.usuarioId) {
      params = params.set('Responsavel', filtro.usuarioId);
    }
    if (filtro.statusId) {
      params = params.set('Status', filtro.statusId);
    }
    return this.http.get<OrdemServicoListResponse>(this.apiUrl, { params });
  }

  obterFiltros(): Observable<OrdemServicoFiltrosResponse> {
    return this.http.get<OrdemServicoFiltrosResponse>(`${this.apiUrl}/filtros`);
  }
}

