import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Recipe } from '../../../interfaces/recipe';
import { MatIconModule } from '@angular/material/icon';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  createScheduleRecipeDto,
  GroceryListAssignmentMode,
  MealType,
  ScheduleService,
} from '../../../services/schedule.service';
import {
  Household,
  HouseholdService,
} from '../../../services/household.service';
import {
  addDays,
  addMinutes,
  differenceInCalendarDays,
  format,
  isSameDay,
  startOfDay,
} from 'date-fns';
import { GroceryList, GroceryListService } from '../../../services/grocery-list.service';
import { combineLatest, finalize, map, startWith } from 'rxjs';

type ModalStep = 1 | 2;

type MealOption = {
  type: MealType;
  label: string;
  icon: string;
};

type GroceryListModeOption = {
  value: GroceryListAssignmentMode;
  title: string;
  description: string;
};

interface SelectableGroceryList {
  id: number;
  name: string;
  details: string;
}

const DATE_OPTION_COUNT = 7;
const MEAL_OPTIONS: MealOption[] = [
  { type: 'BREAKFAST', label: 'Breakfast', icon: 'bakery_dining' },
  { type: 'LUNCH', label: 'Lunch', icon: 'lunch_dining' },
  { type: 'DINNER', label: 'Dinner', icon: 'dinner_dining' },
  { type: 'SNACK', label: 'Snack', icon: 'icecream' },
  { type: 'OTHER', label: 'Other', icon: 'restaurant' },
];
const GROCERY_LIST_MODE_OPTIONS: GroceryListModeOption[] = [
  {
    value: 'AUTO',
    title: 'Automatically use a matching shopping list',
    description: 'Keeps the current behavior and lets the backend choose or create the right list.',
  },
  {
    value: 'NONE',
    title: 'Do not add ingredients to a shopping list',
    description: 'Schedules the recipe without creating or updating a shopping list.',
  },
  {
    value: 'EXISTING',
    title: 'Choose a specific shopping list',
    description: 'Assigns the recipe ingredients to one existing list you select explicitly.',
  },
];

const groceryListSelectionValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const groceryListMode = control.get('groceryListMode')?.value;
  const groceryListId = control.get('groceryListId')?.value;

  if (groceryListMode !== 'EXISTING') {
    return null;
  }

  return typeof groceryListId === 'number' && groceryListId > 0
    ? null
    : { groceryListRequired: true };
};

function normalizeHouseholdId(householdId: number | null | undefined) {
  return householdId && householdId > 0 ? householdId : 0;
}

function buildSelectableGroceryLists(
  lists: GroceryList[],
  households: Household[],
  householdId: number | null | undefined
): SelectableGroceryList[] {
  const selectedHouseholdId = normalizeHouseholdId(householdId);

  return lists
    .filter(
      (list) => normalizeHouseholdId(list.householdId) === selectedHouseholdId
    )
    .sort((left, right) => {
      const leftTime = new Date(left.plannedDate).getTime();
      const rightTime = new Date(right.plannedDate).getTime();
      const leftValue = Number.isNaN(leftTime) ? Number.MAX_SAFE_INTEGER : leftTime;
      const rightValue = Number.isNaN(rightTime)
        ? Number.MAX_SAFE_INTEGER
        : rightTime;

      return leftValue - rightValue || left.name.localeCompare(right.name);
    })
    .map((list) => {
      const details: string[] = [];
      const plannedDate = new Date(list.plannedDate);
      const householdName =
        normalizeHouseholdId(list.householdId) === 0
          ? 'Personal'
          : households.find((household) => household.id === list.householdId)?.name;

      if (!Number.isNaN(plannedDate.getTime())) {
        details.push(format(plannedDate, 'MMM d, yyyy'));
      }

      if (householdName) {
        details.push(householdName);
      }

      return {
        id: list.id,
        name: list.name,
        details: details.join(' • '),
      };
    });
}

function extractErrorMessage(error: unknown) {
  if (error instanceof HttpErrorResponse) {
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }

    if (
      error.error &&
      typeof error.error === 'object' &&
      'message' in error.error &&
      typeof error.error.message === 'string' &&
      error.error.message.trim()
    ) {
      return error.error.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return null;
}

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
  private readonly groceryListService = inject(GroceryListService);
  private readonly today = startOfDay(new Date());

  public recipes: Recipe[] = this.data.recipes;
  public selectedRecipe = signal<Recipe | undefined>(undefined);
  public searchQuery = signal('');
  public currentStep = signal<ModalStep>(1);
  public readonly mealOptions = MEAL_OPTIONS;
  public readonly groceryListModeOptions = GROCERY_LIST_MODE_OPTIONS;
  public readonly submitError = signal<string | null>(null);
  public readonly isSubmitting = signal(false);

  public households$ = this.householdService.getAll();

  public form = new FormGroup(
    {
      date: new FormControl(this.data.date || new Date(), Validators.required),
      mealType: new FormControl<MealType>(
        this.data.mealType || 'DINNER',
        Validators.required
      ),
      householdId: new FormControl<number | null>(null),
      groceryListMode: new FormControl<GroceryListAssignmentMode>(
        'AUTO',
        Validators.required
      ),
      groceryListId: new FormControl<number | null>(null),
    },
    { validators: groceryListSelectionValidator }
  );

  public readonly availableGroceryLists$ = combineLatest([
    this.groceryListService.getAvailableLists(),
    this.households$,
    this.form.controls.householdId.valueChanges.pipe(
      startWith(this.form.controls.householdId.value)
    ),
  ]).pipe(
    map(([lists, households, householdId]) =>
      buildSelectableGroceryLists(lists, households ?? [], householdId)
    )
  );

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
    this.submitError.set(null);
    this.form.controls.date.setValue(date);
    this.form.controls.date.markAsDirty();
    this.form.controls.date.markAsTouched();
  }

  public selectMealType(mealType: MealType) {
    this.submitError.set(null);
    this.form.controls.mealType.setValue(mealType);
    this.form.controls.mealType.markAsDirty();
    this.form.controls.mealType.markAsTouched();
  }

  public selectHousehold(householdId: number | null) {
    this.submitError.set(null);
    this.form.controls.householdId.setValue(householdId);
    this.form.controls.householdId.markAsDirty();
    this.form.controls.householdId.markAsTouched();
  }

  public selectGroceryListMode(mode: GroceryListAssignmentMode) {
    this.submitError.set(null);
    this.form.controls.groceryListMode.setValue(mode);
    this.form.controls.groceryListMode.markAsDirty();
    this.form.controls.groceryListMode.markAsTouched();
    this.form.updateValueAndValidity();
  }

  public selectGroceryList(groceryListId: number) {
    this.submitError.set(null);
    this.form.controls.groceryListId.setValue(groceryListId);
    this.form.controls.groceryListId.markAsDirty();
    this.form.controls.groceryListId.markAsTouched();
    this.form.updateValueAndValidity();
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

  public isGroceryListModeSelected(mode: GroceryListAssignmentMode) {
    return this.form.controls.groceryListMode.value === mode;
  }

  public isGroceryListSelected(groceryListId: number) {
    return this.form.controls.groceryListId.value === groceryListId;
  }

  public shouldShowGroceryListPicker() {
    return this.form.controls.groceryListMode.value === 'EXISTING';
  }

  public hasGroceryListSelectionError() {
    return (
      this.form.hasError('groceryListRequired') &&
      (this.form.controls.groceryListId.touched || this.form.touched)
    );
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
    this.form.markAllAsTouched();
    this.submitError.set(null);

    if (this.form.invalid || !this.selectedRecipe()) {
      return;
    }

    const dt = this.form.value.date as Date;
    const timezoneOffset = dt.getTimezoneOffset();
    const groceryListMode = this.form.value.groceryListMode as GroceryListAssignmentMode;

    let payload;

    try {
      payload = createScheduleRecipeDto({
        recipeId: this.selectedRecipe()!.id,
        scheduleDate: addMinutes(new Date(dt), timezoneOffset * -1).toISOString(),
        householdId: this.form.value.householdId || 0,
        mealType: this.form.value.mealType as MealType,
        groceryListMode,
        groceryListId: this.form.value.groceryListId,
      });
    } catch (error) {
      this.submitError.set(
        extractErrorMessage(error) ?? 'Choose a valid shopping list.'
      );
      return;
    }

    this.isSubmitting.set(true);
    this.scheduleService
      .scheduleRecipe(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.dialogRef.close();
        },
        error: (error) => {
          this.submitError.set(
            extractErrorMessage(error) ??
              (groceryListMode === 'EXISTING'
                ? 'The selected shopping list is unavailable. Please choose another list.'
                : 'The recipe could not be scheduled. Please try again.')
          );
        },
      });
  }
}
