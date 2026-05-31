import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { StatusListItem } from './status.models';

@Injectable({
  providedIn: 'root',
})
export class StatusService {
  constructor(private readonly http: HttpClient) {}

  listar(): Observable<StatusListItem[]> {
    return this.http.get<StatusListItem[]>('/api/status', {
      withCredentials: true,
    });
  }
}