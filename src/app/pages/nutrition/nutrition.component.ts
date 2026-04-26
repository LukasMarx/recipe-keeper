import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe, TitleCasePipe } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { format, subDays } from 'date-fns';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { HeaderComponent } from '../../components/header/header.component';
import {
  MacroTotals,
  NutritionDailyResponse,
  NutritionRangeResponse,
  NutritionService,
} from '../../services/nutrition.service';
import {
  BarChartEntry,
  NutritionBarChartComponent,
} from './nutrition-bar-chart/nutrition-bar-chart.component';
import { AddFoodLogModalComponent } from '../../components/modals/add-food-log-modal/add-food-log-modal.component';
import { FoodLogService } from '../../services/food-log.service';

const DAYS = 30;

const MEAL_TYPE_ORDER = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'OTHER'];

const DAILY_GOALS: MacroTotals = {
  calories: 2000,
  protein: 140,
  totalCarbohydrates: 250,
  totalFat: 70,
};

type LedgerItem = {
  kind: 'recipe' | 'foodlog';
  id: number;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  mealType: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

@Component({
  selector: 'app-nutrition',
  standalone: true,
  imports: [DecimalPipe, TitleCasePipe, MatDialogModule, HeaderComponent, NutritionBarChartComponent],
  templateUrl: './nutrition.component.html',
  styleUrl: './nutrition.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NutritionComponent implements OnInit {
  private readonly nutritionService = inject(NutritionService);
  private readonly foodLogService = inject(FoodLogService);
  private readonly dialog = inject(MatDialog);
  protected readonly goals = DAILY_GOALS;
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);
  protected readonly data = signal<NutritionRangeResponse | null>(null);
  protected readonly dailyData = signal<NutritionDailyResponse | null>(null);
  protected readonly activeTab = signal<'today' | 'weekly'>('today');

  private readonly todayStr = format(new Date(), 'yyyy-MM-dd');

  protected readonly todayTotals = computed((): MacroTotals => {
    const d = this.dailyData();
    if (d) return d.totals;
    return { calories: 0, protein: 0, totalCarbohydrates: 0, totalFat: 0 };
  });

  protected readonly remainingCalories = computed(() =>
    Math.max(DAILY_GOALS.calories - this.todayTotals().calories, 0)
  );

  protected readonly proteinPercent = computed(() =>
    Math.min((this.todayTotals().protein / DAILY_GOALS.protein) * 100, 100)
  );

  protected readonly carbsPercent = computed(() =>
    Math.min((this.todayTotals().totalCarbohydrates / DAILY_GOALS.totalCarbohydrates) * 100, 100)
  );

  protected readonly fatPercent = computed(() =>
    Math.min((this.todayTotals().totalFat / DAILY_GOALS.totalFat) * 100, 100)
  );

  protected readonly ledgerItems = computed((): LedgerItem[] => {
    const d = this.dailyData();
    if (!d) return [];

    const fromMeals: LedgerItem[] = (d.meals ?? []).map((m) => ({
      kind: 'recipe',
      id: m.scheduledRecipeId,
      name: m.recipeName,
      brand: null,
      imageUrl: m.recipeImageUrl ?? null,
      mealType: m.mealType,
      calories: m.nutrition.calories,
      protein: m.nutrition.protein,
      carbs: m.nutrition.totalCarbohydrates,
      fat: m.nutrition.totalFat,
    }));

    const fromLogs: LedgerItem[] = (d.foodLogs ?? []).map((fl) => ({
      kind: 'foodlog',
      id: fl.foodLogId,
      name: fl.foodProductName,
      brand: fl.brand,
      imageUrl: fl.imageUrl ?? null,
      mealType: fl.mealType,
      calories: fl.nutrition.calories,
      protein: fl.nutrition.protein,
      carbs: fl.nutrition.totalCarbohydrates,
      fat: fl.nutrition.totalFat,
    }));

    return [...fromMeals, ...fromLogs].sort(
      (a, b) => MEAL_TYPE_ORDER.indexOf(a.mealType) - MEAL_TYPE_ORDER.indexOf(b.mealType)
    );
  });

  protected readonly caloriesEntries = computed(() =>
    this.buildChartEntries((t) => t.calories)
  );

  protected readonly proteinEntries = computed(() =>
    this.buildChartEntries((t) => t.protein)
  );

  protected readonly carbsEntries = computed(() =>
    this.buildChartEntries((t) => t.totalCarbohydrates)
  );

  protected readonly fatEntries = computed(() =>
    this.buildChartEntries((t) => t.totalFat)
  );

  protected readonly averageCalories = computed(() => this.data()?.average.calories ?? 0);
  protected readonly averageProtein = computed(() => this.data()?.average.protein ?? 0);
  protected readonly averageCarbs = computed(() => this.data()?.average.totalCarbohydrates ?? 0);
  protected readonly averageFat = computed(() => this.data()?.average.totalFat ?? 0);

  protected readonly hasData = computed(() => !this.isLoading() && !this.hasError() && this.data() !== null);

  constructor() {
    this.foodLogService.foodProductImageUpdated$
      .pipe(takeUntilDestroyed())
      .subscribe(({ foodProductId, imageUrl }) => {
        const d = this.dailyData();
        if (!d) return;

        const logs = d.foodLogs ?? [];
        const hasMatch = logs.some((fl) => fl.foodProductId === foodProductId);

        if (hasMatch) {
          this.dailyData.set({
            ...d,
            foodLogs: logs.map((fl) =>
              fl.foodProductId === foodProductId ? { ...fl, imageUrl } : fl
            ),
          });
        } else {
          // foodProductId not included in nutrition/daily response → re-fetch
          this.refreshDaily();
        }
      });
  }

  ngOnInit(): void {
    forkJoin({
      daily: this.nutritionService.getDaily(),
      range: this.nutritionService.getRange(DAYS),
    }).subscribe({
      next: ({ daily, range }) => {
        this.dailyData.set(daily);
        this.data.set(range);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  protected openAddEntry(): void {
    const ref = this.dialog.open(AddFoodLogModalComponent, {
      width: '480px',
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((newLog) => {
      if (newLog) {
        this.refreshDaily();
      }
    });
  }

  protected deleteFoodLog(id: number): void {
    this.foodLogService.deleteFoodLog(id).subscribe(() => this.refreshDaily());
  }

  private refreshDaily(): void {
    this.nutritionService.getDaily().subscribe((daily) => this.dailyData.set(daily));
  }

  private buildChartEntries(getValue: (t: MacroTotals) => number): BarChartEntry[] {
    const d = this.data();
    if (!d) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: DAYS }, (_, i) => {
      const date = subDays(today, DAYS - 1 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const entry = d.daily.find((e) => e.date === dateStr);
      return {
        date: dateStr,
        value: entry ? getValue(entry.totals) : 0,
        isToday: dateStr === this.todayStr,
      };
    });
  }
}
