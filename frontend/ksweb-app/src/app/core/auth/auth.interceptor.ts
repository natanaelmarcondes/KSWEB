import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();
  const isAuthRequest = request.url.includes('/api/auth/login') || request.url.includes('/api/auth/refresh');
  const authRequest =
    token && !isAuthRequest
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

  return next(authRequest).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !isAuthRequest &&
        authService.getRefreshToken()
      ) {
        return authService.refreshSession().pipe(
          switchMap((response) =>
            next(request.clone({ setHeaders: { Authorization: `Bearer ${response.accessToken}` } })),
          ),
          catchError((refreshError: unknown) => {
            authService.finalizeLogout();
            return throwError(() => refreshError);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
