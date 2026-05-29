import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { SetorForm, SetorListItem } from './setores.models';

@Injectable({
  providedIn: 'root',
})
export class SetoresService {
  private readonly apiUrl = '/api/setores';

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<SetorListItem[]> {
    return this.http.get<SetorListItem[]>(this.apiUrl, {
      withCredentials: true,
    });
  }

  criar(form: SetorForm): Observable<SetorListItem> {
    return this.http.post<SetorListItem>(this.apiUrl, this.montarPayload(form), {
      withCredentials: true,
    });
  }

  alterar(queueId: number, form: SetorForm): Observable<SetorListItem> {
    return this.http.put<SetorListItem>(`${this.apiUrl}/${queueId}`, this.montarPayload(form), {
      withCredentials: true,
    });
  }

  excluir(queueId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${queueId}`, {
      withCredentials: true,
    });
  }

  private montarPayload(form: SetorForm): SetorForm {
    return {
      queueName: form.queueName?.trim() ?? '',
    };
  }
}
