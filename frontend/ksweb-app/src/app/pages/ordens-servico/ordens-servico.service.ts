
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  OrdemServicoFiltro,
  OrdemServicoFiltrosResponse,
  OrdemServicoFormResponse,
  OrdemServicoHistoricoItem,
  OrdemServicoListResponse,
  OrdemServicoResolucaoResponse,
  OrdemServicoResolucaoImagemResponse,
  SalvarOrdemServicoRequest,
  SalvarResolucaoRequest,
  OrdemServicoStatusOption,
  CriarOrdemServicoResponse,
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
      params = params.set('Titulo', filtro.texto.trim());
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

    if (filtro.status?.length) {
      filtro.status
        .filter((status) => status?.trim())
        .forEach((status) => {
          params = params.append('Status', status.trim());
        });
    }
    return this.http.get<OrdemServicoListResponse>(this.apiUrl, { params });
  }

  consultar(id: number): Observable<OrdemServicoFormResponse> {
    return this.http.get<OrdemServicoFormResponse>(`${this.apiUrl}/${id}`);
  }

  salvar(id: number, request: SalvarOrdemServicoRequest): Observable<void> {
    return this.http.put<void>(`/api/ordens-servico/${id}`, request);
  }

  criar(request: SalvarOrdemServicoRequest): Observable<CriarOrdemServicoResponse | void> {
    return this.http.post<CriarOrdemServicoResponse | void>('/api/ordens-servico', request);
  }

  consultarResolucao(id: number): Observable<OrdemServicoResolucaoResponse> {
    return this.http.get<OrdemServicoResolucaoResponse>(`${this.apiUrl}/${id}/resolucao`);
  }

  salvarResolucao(id: number, request: SalvarResolucaoRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/resolucao`, request);
  }

  enviarImagemResolucao(id: number, arquivo: File): Observable<OrdemServicoResolucaoImagemResponse | string> {
    const formData = new FormData();
    formData.append('imagem', arquivo, this.obterNomeImagemResolucao(arquivo));

    return this.http.post<OrdemServicoResolucaoImagemResponse | string>(`/api/ordens-servico/${id}/resolution-image`, formData);
  }

  enviarImagemDescricao(id: number, arquivo: File): Observable<OrdemServicoResolucaoImagemResponse | string> {
    const formData = new FormData();
    formData.append('imagem', arquivo, this.obterNomeImagemDescricao(arquivo));

    return this.http.post<OrdemServicoResolucaoImagemResponse | string>(`/api/ordens-servico/${id}/upload-image`, formData);
  }

  private obterNomeImagemResolucao(arquivo: File): string {
    if (/\.(jpe?g|png|gif|webp)$/i.test(arquivo.name)) {
      return arquivo.name;
    }

    const extensaoPorMime: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };

    return `resolution-image.${extensaoPorMime[arquivo.type] ?? 'png'}`;
  }

  private obterNomeImagemDescricao(arquivo: File): string {
    if (/\.(jpe?g|png|gif|webp)$/i.test(arquivo.name)) {
      return arquivo.name;
    }

    const extensaoPorMime: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };

    return `description-image.${extensaoPorMime[arquivo.type] ?? 'png'}`;
  }

  consultarHistorico(id: number): Observable<OrdemServicoHistoricoItem[]> {
    return this.http.get<OrdemServicoHistoricoItem[]>(`${this.apiUrl}/${id}/historico`);
  }

  marcarComoLida(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/lida`, {});
  }

  obterFiltros(): Observable<OrdemServicoFiltrosResponse> {
    return this.http.get<OrdemServicoFiltrosResponse>(`${this.apiUrl}/filtros`);
  }
}

