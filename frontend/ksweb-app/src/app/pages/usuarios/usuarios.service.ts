import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { UsuarioListItem } from './usuarios-list/usuarios-list.component';

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  constructor(private readonly http: HttpClient) {}

  listar(): Observable<UsuarioListItem[]> {
    return this.http.get<UsuarioListItem[]>('/api/usuarios', {
      withCredentials: true,
    });
  }
}