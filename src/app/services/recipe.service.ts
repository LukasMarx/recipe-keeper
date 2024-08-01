import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, map, of, tap } from 'rxjs';
import { Recipe } from '../interfaces/recipe';
import { Instruction } from '../interfaces/instruction';
import { Ingredient } from '../interfaces/ingredient';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<number, any>();

  public myRecipes = new BehaviorSubject<undefined | Recipe[]>(undefined);

  constructor() {}

  public getRecipeFromUrl(url: string) {
    return this.http.get<Recipe>('recipe/parse', {
      params: {
        url: url,
      },
    });
  }

  public postRecipe(recipe: any) {
    return this.http.post('recipe', recipe);
  }

  public putRecipe(recipe: any) {
    this.cache.delete(recipe.id);
    return this.http.put(`recipe/${recipe.id}`, recipe);
  }

  public getMyRecipes() {
    this.http
      .get('recipe')
      .subscribe((val) => this.myRecipes.next(val as any[]));
    return this.myRecipes.asObservable();
  }

  public getRecipe(id: number, force = false) {
    if (!force && this.cache.has(id)) {
      return of(this.cache.get(id));
    }
    return this.http.get(`recipe/${id}`).pipe(
      tap((recipe) => {
        this.cache.set(id, recipe);
      })
    );
  }
}
