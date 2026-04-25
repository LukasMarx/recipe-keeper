import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { Recipe } from '../interfaces/recipe';
import { BehaviorSubject, map, tap } from 'rxjs';

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'OTHER';

export interface ScheduleRecipeDto {
  recipeId: number;

  scheduleDate: string;

  householdId?: number;

  mealType: MealType;

  addToGroceryList?: boolean;
}

export interface ScheduleRecipeRequest {
  recipeId: number;

  scheduleDate: string;

  householdId?: number;

  mealType: MealType;

  addToGroceryList?: boolean;
}

export function createScheduleRecipeDto({
  householdId,
  addToGroceryList = true,
  ...scheduleRecipe
}: ScheduleRecipeRequest): ScheduleRecipeDto {
  const dto: ScheduleRecipeDto = {
    ...scheduleRecipe,
    addToGroceryList,
  };

  if (householdId !== undefined) {
    dto.householdId = householdId;
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
  private readonly http = inject(HttpClient);
  private readonly translocoService = inject(TranslocoService);
  private readonly scheduledRecipes = new BehaviorSubject<ScheduledRecipe[]>(
    []
  );

  constructor() {}

  public scheduleRecipe(scheduleRecipeDto: ScheduleRecipeDto) {
    return this.http.post('schedule', { ...scheduleRecipeDto }, {
      params: this.buildLocaleParams(),
    });
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

  private buildLocaleParams() {
    let params = new HttpParams();
    const locale = this.translocoService.getActiveLang()?.trim();

    if (locale) {
      params = params.set('locale', locale);
    }

    return params;
  }
}
