import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Recipe } from '../interfaces/recipe';
import { BehaviorSubject, map, tap } from 'rxjs';

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'OTHER';

export type GroceryListAssignmentMode = 'AUTO' | 'NONE' | 'EXISTING';

export interface ScheduleRecipeDto {
  recipeId: number;

  scheduleDate: string;

  householdId: number;

  mealType: MealType;

  groceryListId?: number | null;
}

export interface ScheduleRecipeRequest {
  recipeId: number;

  scheduleDate: string;

  householdId: number;

  mealType: MealType;

  groceryListMode?: GroceryListAssignmentMode;

  groceryListId?: number | null;
}

export function createScheduleRecipeDto({
  groceryListMode = 'AUTO',
  groceryListId,
  ...scheduleRecipe
}: ScheduleRecipeRequest): ScheduleRecipeDto {
  const dto: ScheduleRecipeDto = { ...scheduleRecipe };

  if (groceryListMode === 'NONE') {
    dto.groceryListId = null;
    return dto;
  }

  if (groceryListMode === 'EXISTING') {
    if (typeof groceryListId !== 'number' || groceryListId <= 0) {
      throw new Error('A valid shopping list must be selected.');
    }

    dto.groceryListId = groceryListId;
  }

  return dto;
}

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
      .get<ScheduledRecipe[]>('schedule')
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
