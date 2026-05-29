import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { DashboardResumo } from './dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly http: HttpClient) {}

  carregarResumo(): Observable<DashboardResumo> {
    return this.http.get<DashboardResumo>('/api/dashboard');
  }
}
