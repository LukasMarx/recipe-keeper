import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { User } from './user.service';

export interface Household {
  id: number;
  name: string;
  admin: User;
  users: User[];
  openInvites: {
    id: number;
    recipientName: string;
    createDate: Date;
    issuedBy: User;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class HouseholdService {
  private readonly http = inject(HttpClient);

  private listSubject = new BehaviorSubject<Household[] | undefined>(undefined);

  constructor() {}

  public getAll() {
    this.http
      .get<Household[]>('household')
      .subscribe((res) => this.listSubject.next(res));
    return this.listSubject.asObservable();
  }

  public add(input: { name: string }) {
    return this.http.post('household', input).pipe(tap(() => this.getAll()));
  }

  public invite(input: { householdId: number; recipientName: string }) {
    return this.http
      .post('household/invite', input)
      .pipe(tap(() => this.getAll()));
  }
}
