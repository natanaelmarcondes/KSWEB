import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  OrdemServicoFiltro,
  OrdemServicoFiltrosResponse,
  OrdemServicoListResponse,
} from './ordens-servico.models';

@Injectable({ providedIn: 'root' })
export class OrdensServicoService {
  private readonly apiUrl = '/api/ordens-servico';

  constructor(private readonly http: HttpClient) {}

  listar(filtro: OrdemServicoFiltro): Observable<OrdemServicoListResponse> {
    let params = new HttpParams()
      .set('page', filtro.page)
      .set('pageSize', filtro.pageSize);

    if (filtro.numero?.trim()) {
      params = params.set('numero', filtro.numero.trim());
    }

    if (filtro.texto?.trim()) {
      params = params.set('texto', filtro.texto.trim());
    }

    if (filtro.statusId) {
      params = params.set('statusIds', filtro.statusId);
    }

    if (filtro.filtroUsuarioNome?.trim()) {
      params = params.set('filtroUsuarioNome', filtro.filtroUsuarioNome.trim());
      params = params.set('filtroPessoa', filtro.filtroPessoa || 'qualquer');
    }

    if (filtro.listarTudo) {
      params = params.set('listarTudo', true);
    }

    if (filtro.usuarioId) {
      params = params.set('usuarioId', filtro.usuarioId);
    }

    return this.http.get<OrdemServicoListResponse>(this.apiUrl, { params });
  }

  obterFiltros(): Observable<OrdemServicoFiltrosResponse> {
    return this.http.get<OrdemServicoFiltrosResponse>(`${this.apiUrl}/filtros`);
  }
}

