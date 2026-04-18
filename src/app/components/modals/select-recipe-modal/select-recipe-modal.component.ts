import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { RecipeListComponent } from '../../recipe-list/recipe-list.component';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Recipe } from '../../../interfaces/recipe';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MealType, ScheduleService } from '../../../services/schedule.service';
import { HouseholdService } from '../../../services/household.service';
import { addMinutes } from 'date-fns';

@Component({
  selector: 'app-select-recipe-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    RecipeListComponent,
    MatStepperModule,
    MatInputModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
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

  public recipes: Recipe[] = this.data.recipes;
  public selectedRecipe = signal<Recipe | undefined>(undefined);
  public searchQuery = signal('');
  
  public households$ = this.householdService.getAll();

  public form = new FormGroup({
    date: new FormControl(this.data.date || new Date(), Validators.required),
    mealType: new FormControl<MealType>(
      this.data.mealType || 'DINNER',
      Validators.required
    ),
    householdId: new FormControl<number | null>(null),
  });

  public get filteredRecipes(): Recipe[] {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.recipes;
    return this.recipes.filter(recipe => 
      recipe.title.toLowerCase().includes(query) ||
      recipe.description?.toLowerCase().includes(query)
    );
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
