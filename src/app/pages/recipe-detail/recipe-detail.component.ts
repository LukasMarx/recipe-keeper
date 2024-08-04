import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { RecipeService } from '../../services/recipe.service';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DurationPipe } from '../../pipes/duration.pipe';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IngredientListComponent } from '../../components/ingredient-list/ingredient-list.component';
import { MatDialog } from '@angular/material/dialog';
import { ScheduleRecipeModalComponent } from '../../components/modals/schedule-recipe-modal/schedule-recipe-modal.component';
import { Ingredient } from '../../interfaces/ingredient';
import { Instruction } from '../../interfaces/instruction';
import { Recipe } from '../../interfaces/recipe';
import { InstructionListComponent } from '../../components/instruction-list/instruction-list.component';
import { Location } from '@angular/common';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    CdkTextareaAutosize,
    ReactiveFormsModule,
    MatListModule,
    DurationPipe,
    MatProgressSpinnerModule,
    IngredientListComponent,
    InstructionListComponent,
  ],
  templateUrl: './recipe-detail.component.html',
  styleUrl: './recipe-detail.component.scss',
})
export class RecipeDetailComponent {
  onDelete() {
    throw new Error('Method not implemented.');
  }
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly recipeService = inject(RecipeService);
  private readonly route = inject(ActivatedRoute);
  private readonly dialogService = inject(MatDialog);

  recipe = signal<any>(undefined);

  constructor() {
    this.route.params.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = params['id'];
      this.recipeService
        .getRecipe(id)
        .subscribe((recipe) => this.recipe.set(this.resolveRecipe(recipe)));
    });
  }

  onBack() {
    this.location.back();
  }

  onEdit() {
    this.router.navigate(['edit-recipe', this.recipe().id]);
  }

  public onSchedule() {
    this.dialogService.open(ScheduleRecipeModalComponent, {
      data: {
        recipeId: this.recipe().id,
      },
    });
  }

  private resolveRecipe(recipe: Recipe) {
    return {
      ...recipe,
      instructions: recipe.instructions.map((instruction: any) => {
        return {
          ...instruction,
          ingredients: instruction.ingredients.map((ingredient: any) => {
            const fullIngredient =
              recipe.ingredientsList.find(
                (i) => i.ingredientId === ingredient.id
              ) ||
              recipe.ingredientsList.find(
                (i) => i.ingredientId === ingredient.id
              );
            return {
              ...(fullIngredient as any),
              id: ingredient,
            } as Ingredient;
          }),
        } as Instruction;
      }),
    } as Recipe;
  }
}
