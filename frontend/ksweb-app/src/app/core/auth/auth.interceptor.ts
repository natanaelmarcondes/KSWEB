import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';

import { inject } from '@angular/core';

import {
  catchError,
  switchMap,
  throwError
} from 'rxjs';

import { AuthService } from './auth.service';

const API_BASE_URL = 'http://192.168.1.48:1516';

export const authInterceptor: HttpInterceptorFn = (request, next) => {

  const authService = inject(AuthService);

  let url = request.url;

  // ---------------------------------------------------------
  // Redireciona todas as chamadas relativas /api para a API
  // publicada na porta 1516.
  //
  // Exemplo:
  //
  // /api/auth/login
  //
  // vira:
  //
  // http://192.168.1.48:1516/api/auth/login
  // ---------------------------------------------------------
  if (url.startsWith('/api/')) {
    url = `${API_BASE_URL}${url}`;
  }

  // ---------------------------------------------------------
  // Também trata as imagens servidas pela API
  // ---------------------------------------------------------
  if (url.startsWith('/inlineimages/')) {
    url = `${API_BASE_URL}${url}`;
  }

  // Cria a requisição já com a URL corrigida
  let modifiedRequest = request.clone({
    url
  });

  const token = authService.getAccessToken();

  const isAuthRequest =
    modifiedRequest.url.includes('/api/auth/login') ||
    modifiedRequest.url.includes('/api/auth/refresh');

  // ---------------------------------------------------------
  // Adiciona JWT nas requisições que precisam de autenticação
  // ---------------------------------------------------------
  if (token && !isAuthRequest) {
    modifiedRequest = modifiedRequest.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(modifiedRequest).pipe(

    catchError((error: unknown) => {

      // -----------------------------------------------------
      // Token expirado
      // -----------------------------------------------------
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !isAuthRequest &&
        authService.getRefreshToken()
      ) {

        return authService.refreshSession().pipe(

          switchMap((response) => {

            let retryRequest = request.clone({
              url
            });

            retryRequest = retryRequest.clone({
              setHeaders: {
                Authorization: `Bearer ${response.accessToken}`
              }
            });

            return next(retryRequest);

          }),

          catchError((refreshError: unknown) => {

            authService.finalizeLogout();

            return throwError(() => refreshError);

          })

        );
      }

      return throwError(() => error);

    })

  );
};