import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { map } from 'rxjs';

import { environment } from '../../environments/environment';
import { Ingredient } from '../interfaces/ingredient';

export interface IngredientSearchResult extends Ingredient {
  originalName?: string;
  userId?: number;
  createDate?: string;
  updateDate?: string;
}

@Injectable({
  providedIn: 'root',
})
export class IngredientService {
  private readonly http = inject(HttpClient);
  private readonly translocoService = inject(TranslocoService);

  public search(query: string, limit = 8) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return this.http.get<IngredientSearchResult[]>('ingredient/search', {
        params: this.buildSearchParams('', limit),
      }).pipe(map(() => []));
    }

    return this.http.get<IngredientSearchResult[]>('ingredient/search', {
      params: this.buildSearchParams(trimmedQuery, limit),
    }).pipe(
      map((ingredients) =>
        (ingredients ?? []).map((ingredient) => ({
          ...ingredient,
          imageUrl: this.resolveImageUrl(ingredient.imageUrl),
        }))
      )
    );
  }

  private buildSearchParams(query: string, limit: number) {
    let params = new HttpParams().set('query', query).set('limit', String(limit));
    const locale = this.translocoService.getActiveLang()?.trim();

    if (locale) {
      params = params.set('locale', locale);
    }

    return params;
  }

  private resolveImageUrl(imageUrl: string | undefined) {
    if (!imageUrl?.trim()) {
      return undefined;
    }

    if (/^https?:\/\//i.test(imageUrl)) {
      return imageUrl;
    }

    const apiOrigin = new URL(environment.origin).origin;
    const normalizedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;

    return `${apiOrigin}${normalizedPath}`;
  }
}