import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly accessTokenSubject = new BehaviorSubject<string | null>(
    localStorage.getItem('access_token')
  );

  public readonly accessToken$ = this.accessTokenSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  constructor() {}

  public getAccessToken(): string | null {
    return this.accessTokenSubject.value;
  }

  public setAccessToken(accessToken: string) {
    localStorage.setItem('access_token', accessToken);
    this.accessTokenSubject.next(accessToken);
  }

  public clearAccessToken() {
    localStorage.removeItem('access_token');
    this.accessTokenSubject.next(null);
  }

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
          this.setAccessToken(result.access_token);
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
          this.setAccessToken(result.access_token);
        })
      );
  }
}
