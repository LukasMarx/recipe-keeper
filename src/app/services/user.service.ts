import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

export interface User {
  id: number;
  displayName: string;
  activeHouseholdId: number;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);

  constructor() {}

  public get() {
    return this.http.get<User>('user/profile');
  }

  public setHouseholdId(householdId: number) {
    return this.http.put('user/profile', {
      activeHouseholdId: householdId,
    });
  }
}
