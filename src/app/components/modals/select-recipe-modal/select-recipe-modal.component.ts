import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Recipe } from '../../../interfaces/recipe';
import { MatIconModule } from '@angular/material/icon';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MealType, ScheduleService } from '../../../services/schedule.service';
import { HouseholdService } from '../../../services/household.service';
import {
  addDays,
  addMinutes,
  differenceInCalendarDays,
  format,
  isSameDay,
  startOfDay,
} from 'date-fns';

type ModalStep = 1 | 2;

type MealOption = {
  type: MealType;
  label: string;
  icon: string;
};

const DATE_OPTION_COUNT = 7;
const MEAL_OPTIONS: MealOption[] = [
  { type: 'BREAKFAST', label: 'Breakfast', icon: 'bakery_dining' },
  { type: 'LUNCH', label: 'Lunch', icon: 'lunch_dining' },
  { type: 'DINNER', label: 'Dinner', icon: 'dinner_dining' },
  { type: 'SNACK', label: 'Snack', icon: 'icecream' },
  { type: 'OTHER', label: 'Other', icon: 'restaurant' },
];

@Component({
  selector: 'app-select-recipe-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
  templateUrl: './select-recipe-modal.component.html',
  styleUrl: './select-recipe-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectRecipeModalComponent {
  private readonly dialogRef = inject(DialogRef);
  private readonly data = inject(DIALOG_DATA);
  private readonly scheduleService = inject(ScheduleService);
  private readonly householdService = inject(HouseholdService);
  private readonly today = startOfDay(new Date());

  public recipes: Recipe[] = this.data.recipes;
  public selectedRecipe = signal<Recipe | undefined>(undefined);
  public searchQuery = signal('');
  public currentStep = signal<ModalStep>(1);
  public readonly mealOptions = MEAL_OPTIONS;

  public households$ = this.householdService.getAll();

  public form = new FormGroup({
    date: new FormControl(this.data.date || new Date(), Validators.required),
    mealType: new FormControl<MealType>(
      this.data.mealType || 'DINNER',
      Validators.required
    ),
    householdId: new FormControl<number | null>(null),
  });

  public filteredRecipes = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) {
      return this.recipes;
    }

    return this.recipes.filter(recipe => 
      recipe.title.toLowerCase().includes(query) ||
      recipe.description?.toLowerCase().includes(query) ||
      recipe.keywords?.some(keyword => keyword.toLowerCase().includes(query))
    );
  });

  public get dateOptions(): Date[] {
    const selectedDate = startOfDay(this.form.controls.date.value ?? this.today);
    const hasFutureOffset = differenceInCalendarDays(selectedDate, this.today) > 0;
    const start = hasFutureOffset ? addDays(selectedDate, -1) : this.today;
    const rangeStart = start.getTime() < this.today.getTime() ? this.today : start;

    return Array.from({ length: DATE_OPTION_COUNT }, (_, index) =>
      addDays(rangeStart, index)
    );
  }

  public closeModal() {
    this.dialogRef.close();
  }

  public selectDate(date: Date) {
    this.form.controls.date.setValue(date);
    this.form.controls.date.markAsDirty();
    this.form.controls.date.markAsTouched();
  }

  public selectMealType(mealType: MealType) {
    this.form.controls.mealType.setValue(mealType);
    this.form.controls.mealType.markAsDirty();
    this.form.controls.mealType.markAsTouched();
  }

  public selectHousehold(householdId: number | null) {
    this.form.controls.householdId.setValue(householdId);
    this.form.controls.householdId.markAsDirty();
    this.form.controls.householdId.markAsTouched();
  }

  public goToStep(step: ModalStep) {
    if (step === 1) {
      this.currentStep.set(1);
      return;
    }

    if (this.selectedRecipe()) {
      this.currentStep.set(2);
    }
  }

  public isDateSelected(date: Date) {
    const value = this.form.controls.date.value;
    return !!value && isSameDay(value, date);
  }

  public isMealTypeSelected(mealType: MealType) {
    return this.form.controls.mealType.value === mealType;
  }

  public getMealOptionIcon(mealType: MealType) {
    return this.mealOptions.find(option => option.type === mealType)?.icon ?? 'restaurant';
  }

  public formatDayLabel(date: Date) {
    return format(date, 'EEE').toUpperCase();
  }

  public formatDateNumber(date: Date) {
    return format(date, 'd');
  }

  public getRecipeEyebrow(recipe: Recipe) {
    const label = recipe.keywords?.find(Boolean) || 'Recipe';
    return label.replace(/[-_]+/g, ' ').toUpperCase();
  }

  public getRecipeMeta(recipe: Recipe) {
    const details: string[] = [];
    const duration = recipe.prepTime ?? recipe.totalTime ?? recipe.cookTime;

    if (duration) {
      details.push(`Prep: ${duration}m`);
    }

    if (recipe.calories) {
      details.push(`${recipe.calories} kcal`);
    }

    return details.join(' • ');
  }

  onRecipeClick(recipeId: number) {
    const recipe = this.recipes.find(r => r.id === recipeId);
    if (recipe) {
      this.selectedRecipe.set(recipe);
    }
  }

  onSubmit() {
    if (this.form.valid && this.selectedRecipe()) {
      const dt = this.form.value.date as Date;
      const timezoneOffset = dt.getTimezoneOffset();
      this.scheduleService
        .scheduleRecipe({
          recipeId: this.selectedRecipe()!.id,
          scheduleDate: addMinutes(
            new Date(dt),
            timezoneOffset * -1
          ).toISOString()!,
          householdId: this.form.value.householdId || 0,
          mealType: this.form.value.mealType as MealType,
        })
        .subscribe(() => {
          this.dialogRef.close();
        });
    }
  }
}
