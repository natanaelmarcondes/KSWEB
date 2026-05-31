
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

    if (filtro.texto?.trim()) {
      params = params.set('Texto', filtro.texto.trim());
    }

    if (filtro.filtroUsuarioNome?.trim()) {
      const nomeUsuario = filtro.filtroUsuarioNome.trim();

      if (filtro.filtrarPor === 'criadoPor') {
        params = params.set('CriadoPor', nomeUsuario);
      } else if (filtro.filtrarPor === 'responsavel') {
        params = params.set('Responsavel', nomeUsuario);
      } else {
        params = params.set('Solicitante', nomeUsuario);
      }
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

