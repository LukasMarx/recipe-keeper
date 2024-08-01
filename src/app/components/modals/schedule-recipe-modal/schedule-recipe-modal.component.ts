import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
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
import { MealType, ScheduleService } from '../../../services/schedule.service';
import { DIALOG_DATA } from '@angular/cdk/dialog';
import { addMinutes } from 'date-fns';

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
  private readonly dialogRef = inject(MatDialogRef);
  private readonly data = inject(DIALOG_DATA);

  public form = new FormGroup({
    date: new FormControl(new Date(), Validators.required),
    mealType: new FormControl<MealType>('DINNER', Validators.required),
  });

  public onSubmit() {
    if (this.form.valid) {
      const dt = this.form.value.date as Date;
      const timezoneOffset = dt.getTimezoneOffset();
      this.scheduleService
        .scheduleRecipe({
          recipeId: this.data.recipeId,
          scheduleDate: addMinutes(
            new Date(dt.toLocaleDateString()),
            timezoneOffset * -1
          ).toISOString()!,
          householdId: this.data.householdId,
          mealType: this.form.value.mealType as MealType,
        })
        .subscribe(() => {
          this.dialogRef.close();
        });
    }
  }
}
