import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private readonly http = inject(HttpClient);

  public myRecipes = new BehaviorSubject<undefined | any[]>(undefined);

  constructor() {}

  public getRecipeFromUrl(url: string) {
    return this.http.get('recipe/parse', {
      params: {
        url: url,
      },
    });
  }

  public postRecipe(recipe: any) {
    return this.http.post('recipe', recipe);
  }

  public getMyRecipes() {
    this.http
      .get('recipe')
      .subscribe((val) => this.myRecipes.next(val as any[]));
    return this.myRecipes.asObservable();
  }

  public getRecipe(id: number) {
    return this.http.get(`recipe/${id}`);
  }
}
