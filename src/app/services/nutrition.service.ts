import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

export interface MacroTotals {
  calories: number;
  protein: number;
  totalCarbohydrates: number;
  totalFat: number;
}

export interface NutritionDayEntry {
  date: string;
  totals: MacroTotals;
}

export interface NutritionMealEntry {
  scheduledRecipeId: number;
  recipeName: string;
  recipeImageUrl: string | null;
  mealType: string;
  portionCount: number;
  nutrition: MacroTotals;
}

export interface NutritionFoodLogEntry {
  foodLogId: number;
  foodProductId?: number;
  foodProductName: string;
  brand: string | null;
  imageUrl: string | null;
  mealType: string;
  amountInGrams: number;
  nutrition: MacroTotals;
}

export interface NutritionDailyResponse {
  date: string;
  totals: MacroTotals;
  meals: NutritionMealEntry[];
  foodLogs: NutritionFoodLogEntry[];
}

export interface NutritionRangeResponse {
  rangeStart: string;
  rangeEnd: string;
  days: number;
  average: MacroTotals;
  daily: NutritionDayEntry[];
}

@Injectable({
  providedIn: 'root',
})
export class NutritionService {
  private readonly http = inject(HttpClient);

  getRange(days: number) {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<NutritionRangeResponse>('nutrition/range', { params });
  }

  getDaily(date?: string) {
    let params = new HttpParams();
    if (date) {
      params = params.set('date', date);
    }
    return this.http.get<NutritionDailyResponse>('nutrition/daily', { params });
  }
}
