import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { StatusForm, StatusListItem } from './status.models';

@Injectable({
  providedIn: 'root',
})
export class StatusService {
  private readonly apiUrl = '/api/status';

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<StatusListItem[]> {
    return this.http.get<StatusListItem[]>(this.apiUrl, {
      withCredentials: true,
    });
  }

  criar(form: StatusForm): Observable<StatusListItem> {
    return this.http.post<StatusListItem>(this.apiUrl, this.montarPayload(form), {
      withCredentials: true,
    });
  }

  alterar(statusId: number, form: StatusForm): Observable<StatusListItem> {
    return this.http.put<StatusListItem>(`${this.apiUrl}/${statusId}`, this.montarPayload(form), {
      withCredentials: true,
    });
  }

  excluir(statusId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${statusId}`, {
      withCredentials: true,
    });
  }

  private montarPayload(form: StatusForm): StatusForm {
    return {
      statusName: form.statusName?.trim() ?? '',
      isPending: Boolean(form.isPending),
      statusStopClock: Boolean(form.statusStopClock),
      statusDescription: form.statusDescription?.trim() ?? '',
      internalName: form.internalName?.trim() ?? '',
    };
  }
}
