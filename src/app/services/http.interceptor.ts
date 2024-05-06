import { inject } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { NEVER, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { HttpInterceptorFn } from '@angular/common/http';

export const intercept: HttpInterceptorFn = (
  req,
  next
): Observable<HttpEvent<any>> => {
  const router = inject(Router);
  let apiReq = req.clone({
    url: `${environment.origin}/${req.url}`,
  });
  const access_token = localStorage.getItem('access_token');

  if (access_token) {
    try {
      const jwtPayload = JSON.parse(window.atob(access_token.split('.')[1]));
      if (jwtPayload.exp * 1000 < new Date().getTime()) {
        localStorage.removeItem('access_token');
        router.navigate(['login']);
        return NEVER;
      }

      apiReq = apiReq.clone({
        headers: req.headers.set('Authorization', `Bearer ${access_token}`),
      });
    } catch (e) {
      localStorage.removeItem('access_token');
    }
  }
  return next(apiReq).pipe(
    tap(
      () => {},
      (err: any) => {
        if (err instanceof HttpErrorResponse) {
          if (err.status !== 401) {
            return;
          }
          router.navigate(['login']);
        }
      }
    )
  );
};
