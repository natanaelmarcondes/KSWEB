import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap } from 'rxjs';

import { AuthResponse, AuthUsuario, LoginRequest, MeResponse } from './auth.models';

const ACCESS_TOKEN_KEY = 'ksweb_access_token';
const REFRESH_TOKEN_KEY = 'ksweb_refresh_token';
const PERSISTENCE_KEY = 'ksweb_auth_persistence';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = '/api/auth';
  private readonly usuarioSignal = signal<AuthUsuario | null>(this.readUsuario());

  readonly usuario = this.usuarioSignal.asReadonly();

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  login(payload: LoginRequest): Observable<AuthUsuario> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload).pipe(
      tap((response) => this.storeSession(response, payload.manterConectado)),
      map((response) => response.usuario),
    );
  }

  carregarUsuarioAtual(): Observable<AuthUsuario | null> {
    if (!this.getAccessToken()) {
      return of(null);
    }

    return this.http.get<MeResponse>(`${this.apiUrl}/me`).pipe(
      tap((response) => this.setUsuario(response.usuario)),
      map((response) => response.usuario),
      catchError(() => {
        this.clearSession();
        return of(null);
      }),
    );
  }

  refreshSession(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken })
      .pipe(tap((response) => this.storeSession(response, this.shouldPersist())));
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.finalizeLogout();
      return;
    }

    this.http.post<void>(`${this.apiUrl}/logout`, { refreshToken }).subscribe({
      next: () => this.finalizeLogout(),
      error: () => this.finalizeLogout(),
    });
  }

  finalizeLogout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return Boolean(this.getAccessToken());
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY) ?? sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY) ?? sessionStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private storeSession(response: AuthResponse, persist: boolean): void {
    const storage = persist ? localStorage : sessionStorage;
    const otherStorage = persist ? sessionStorage : localStorage;

    otherStorage.removeItem(ACCESS_TOKEN_KEY);
    otherStorage.removeItem(REFRESH_TOKEN_KEY);
    storage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    storage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(PERSISTENCE_KEY, persist ? 'local' : 'session');
    this.setUsuario(response.usuario);
  }

  private shouldPersist(): boolean {
    return localStorage.getItem(PERSISTENCE_KEY) === 'local';
  }

  private setUsuario(usuario: AuthUsuario): void {
    this.usuarioSignal.set(usuario);
    localStorage.setItem('ksweb_usuario', JSON.stringify(usuario));
  }

  private readUsuario(): AuthUsuario | null {
    const rawUsuario = localStorage.getItem('ksweb_usuario');

    if (!rawUsuario) {
      return null;
    }

    try {
      return JSON.parse(rawUsuario) as AuthUsuario;
    } catch {
      localStorage.removeItem('ksweb_usuario');
      return null;
    }
  }

  private clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(PERSISTENCE_KEY);
    localStorage.removeItem('ksweb_usuario');
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    this.usuarioSignal.set(null);
  }
}
