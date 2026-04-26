import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { format, subDays } from 'date-fns';
import { forkJoin } from 'rxjs';

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

const DAYS = 30;

const DAILY_GOALS: MacroTotals = {
  calories: 2000,
  protein: 140,
  totalCarbohydrates: 250,
  totalFat: 70,
};

@Component({
  selector: 'app-nutrition',
  standalone: true,
  imports: [DecimalPipe, HeaderComponent, NutritionBarChartComponent],
  templateUrl: './nutrition.component.html',
  styleUrl: './nutrition.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NutritionComponent implements OnInit {
  private readonly nutritionService = inject(NutritionService);

  protected readonly goals = DAILY_GOALS;
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);
  protected readonly data = signal<NutritionRangeResponse | null>(null);
  protected readonly dailyData = signal<NutritionDailyResponse | null>(null);

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
