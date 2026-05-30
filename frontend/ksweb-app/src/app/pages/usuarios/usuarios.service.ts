import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AtualizarUsuarioRequest,
  CriarUsuarioRequest,
  FilaOption,
  ResetSenhaResponse,
  UsuarioEdicao,
  UsuarioResumo,
} from './usuarios.models';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly apiUrl = '/api/usuarios';

  constructor(private readonly http: HttpClient) {}

  listar(termo?: string): Observable<UsuarioResumo[]> {
    let params = new HttpParams();

    if (termo?.trim()) {
      params = params.set('termo', termo.trim());
    }

    return this.http.get<UsuarioResumo[]>(this.apiUrl, { params });
  }

  listarFilas(): Observable<FilaOption[]> {
    return this.http.get<FilaOption[]>(`${this.apiUrl}/filas`);
  }

  obter(codigo: number): Observable<UsuarioEdicao> {
    return this.http.get<UsuarioEdicao>(`${this.apiUrl}/${codigo}`);
  }

  criar(payload: CriarUsuarioRequest): Observable<UsuarioEdicao> {
    return this.http.post<UsuarioEdicao>(this.apiUrl, payload);
  }

  atualizar(codigo: number, payload: AtualizarUsuarioRequest): Observable<UsuarioEdicao> {
    return this.http.put<UsuarioEdicao>(`${this.apiUrl}/${codigo}`, payload);
  }

  resetarSenha(codigo: number): Observable<ResetSenhaResponse> {
    return this.http.post<ResetSenhaResponse>(`${this.apiUrl}/${codigo}/reset-senha`, {});
  }
}

