import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
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
import { DIALOG_DATA } from '@angular/cdk/dialog';
import { format, addMinutes } from 'date-fns';
import { GroceryList, GroceryListService } from '../../../services/grocery-list.service';
import { combineLatest, finalize, map, startWith } from 'rxjs';

interface SelectableGroceryList {
  id: number;
  name: string;
  details: string;
}

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
  selector: 'app-schedule-recipe-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatNativeDateModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './schedule-recipe-modal.component.html',
  styleUrl: './schedule-recipe-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleRecipeModalComponent {
  private readonly scheduleService = inject(ScheduleService);
  private readonly householdService = inject(HouseholdService);
  private readonly groceryListService = inject(GroceryListService);
  private readonly dialogRef = inject(MatDialogRef);
  private readonly data = inject(DIALOG_DATA);

  public readonly groceryListModes: {
    value: GroceryListAssignmentMode;
    label: string;
  }[] = [
    {
      value: 'AUTO',
      label: 'Automatically use a matching shopping list',
    },
    {
      value: 'NONE',
      label: 'Do not add ingredients to a shopping list',
    },
    {
      value: 'EXISTING',
      label: 'Choose a specific shopping list',
    },
  ];

  public households$ = this.householdService.getAll();
  public readonly submitError = signal<string | null>(null);
  public readonly isSubmitting = signal(false);

  public form = new FormGroup(
    {
      date: new FormControl(new Date(), Validators.required),
      mealType: new FormControl<MealType>('DINNER', Validators.required),
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

  public shouldShowGroceryListPicker() {
    return this.form.controls.groceryListMode.value === 'EXISTING';
  }

  public hasGroceryListSelectionError() {
    return (
      this.form.hasError('groceryListRequired') &&
      (this.form.controls.groceryListId.touched || this.form.touched)
    );
  }

  public clearSubmitError() {
    this.submitError.set(null);
  }

  public onSubmit() {
    this.form.markAllAsTouched();
    this.submitError.set(null);

    if (this.form.invalid) {
      return;
    }

    const dt = this.form.value.date as Date;
    const timezoneOffset = dt.getTimezoneOffset();
    const groceryListMode = this.form.value.groceryListMode as GroceryListAssignmentMode;

    let payload;

    try {
      payload = createScheduleRecipeDto({
        recipeId: this.data.recipeId,
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
