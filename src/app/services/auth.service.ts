import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  constructor() {}

  public register(input: {
    displayName: string;
    email: string;
    password: string;
    repeatPassword: string;
  }) {
    return this.http
      .post('auth/register', {
        username: input.email,
        displayName: input.displayName,
        password: input.password,
        repeatPassword: input.repeatPassword,
      })
      .pipe(
        tap((result: any) => {
          localStorage.setItem('access_token', result.access_token);
        })
      );
  }

  public signIn(input: { email: string; password: string }) {
    return this.http
      .post('auth/login', {
        username: input.email,
        password: input.password,
      })
      .pipe(
        tap((result: any) => {
          localStorage.setItem('access_token', result.access_token);
        })
      );
  }
}
