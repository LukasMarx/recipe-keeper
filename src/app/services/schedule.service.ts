import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Recipe } from '../interfaces/recipe';
import { BehaviorSubject, map, tap } from 'rxjs';

export interface ScheduleRecipeDto {
  recipeId: number;

  scheduleDate: string;

  householdId: number;

  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'OTHER';
}

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'OTHER';

export interface ScheduledRecipe {
  id: number;
  scheduledDate: Date;
  recipe: Recipe;
  mealType: MealType;
}

@Injectable({
  providedIn: 'root',
})
export class ScheduleService {
  private http = inject(HttpClient);
  private readonly scheduledRecipes = new BehaviorSubject<ScheduledRecipe[]>(
    []
  );

  constructor() {}

  public scheduleRecipe(scheduleRecipeDto: ScheduleRecipeDto) {
    return this.http.post('schedule', { ...scheduleRecipeDto });
  }

  public getScheduledRecipes() {
    this.http
      .get<ScheduledRecipe[]>('schedule/1')
      .pipe(
        map((scheduleRecipe) => {
          return scheduleRecipe.map(({ scheduledDate, ...rest }) => ({
            scheduledDate: new Date(new Date(scheduledDate).toDateString()),
            ...rest,
          }));
        })
      )
      .subscribe((scheduledRecipes) => {
        this.scheduledRecipes.next(scheduledRecipes);
      });
    return this.scheduledRecipes.asObservable();
  }

  public deleteScheduledRecipe(id: number) {
    return this.http
      .delete(`schedule/${id}`)
      .pipe(tap(() => this.getScheduledRecipes()));
  }
}
