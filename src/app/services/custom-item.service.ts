import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CustomItem } from '../interfaces/custom-item';

@Injectable({
  providedIn: 'root',
})
export class CustomItemService {
  private readonly http = inject(HttpClient);

  public search(query: string, householdId?: number | null) {
    let params = new HttpParams();
    const trimmed = query.trim();
    if (trimmed) {
      params = params.set('q', trimmed);
    }
    if (householdId) {
      params = params.set('householdId', String(householdId));
    }
    return this.http.get<CustomItem[]>('custom-items', { params });
  }

  public delete(id: number) {
    return this.http.delete(`custom-items/${id}`);
  }
}
