import { DIALOG_DATA } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { addMinutes } from 'date-fns';
import { finalize } from 'rxjs';
import { HouseholdService } from '../../../services/household.service';
import {
  createScheduleRecipeDto,
  MealType,
  ScheduleService,
} from '../../../services/schedule.service';
import { UserService } from '../../../services/user.service';

function normalizeHouseholdId(householdId: number | null | undefined) {
  return householdId && householdId > 0 ? householdId : undefined;
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
    MatCheckboxModule,
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
  private readonly userService = inject(UserService);
  private readonly dialogRef = inject(MatDialogRef);
  private readonly data = inject(DIALOG_DATA);

  public households$ = this.householdService.getAll();
  public readonly submitError = signal<string | null>(null);
  public readonly isSubmitting = signal(false);

  public form = new FormGroup({
    date: new FormControl(new Date(), Validators.required),
    mealType: new FormControl<MealType>('DINNER', Validators.required),
    householdId: new FormControl<number | null>(null),
    addToGroceryList: new FormControl(true, Validators.required),
  });

  constructor() {
    this.userService.get().subscribe({
      next: (user) => {
        this.form.controls.householdId.setValue(
          normalizeHouseholdId(user.activeHouseholdId) ?? null
        );
      },
    });
  }

  public shouldAddIngredientsToGroceryList() {
    return this.form.controls.addToGroceryList.value ?? true;
  }

  public clearSubmitError() {
    this.submitError.set(null);
  }

  public setGroceryListAssignment(shouldAdd: boolean) {
    this.clearSubmitError();
    this.form.controls.addToGroceryList.setValue(shouldAdd);
  }

  public onSubmit() {
    this.form.markAllAsTouched();
    this.submitError.set(null);

    if (this.form.invalid) {
      return;
    }

    const dt = this.form.value.date as Date;
    const timezoneOffset = dt.getTimezoneOffset();

    const payload = createScheduleRecipeDto({
      recipeId: this.data.recipeId,
      scheduleDate: addMinutes(new Date(dt), timezoneOffset * -1).toISOString(),
      householdId: normalizeHouseholdId(this.form.value.householdId),
      mealType: this.form.value.mealType as MealType,
      addToGroceryList: this.form.controls.addToGroceryList.value ?? true,
    });

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
            extractErrorMessage(error) ?? 'The recipe could not be scheduled. Please try again.'
          );
        },
      });
  }
}
