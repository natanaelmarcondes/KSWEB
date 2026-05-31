import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { SetorListItem } from './setores-list/setores-list.component';

@Injectable({
  providedIn: 'root',
})
export class SetoresService {
  constructor(private readonly http: HttpClient) {}

  listar(): Observable<SetorListItem[]> {
    return this.http.get<SetorListItem[]>('/api/setores', {
      withCredentials: true,
    });
  }
}