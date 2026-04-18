import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RecipeService } from '../../services/recipe.service';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { ScheduleRecipeModalComponent } from '../../components/modals/schedule-recipe-modal/schedule-recipe-modal.component';
import { Ingredient, RecipeIngredient } from '../../interfaces/ingredient';
import { Instruction } from '../../interfaces/instruction';
import { Recipe } from '../../interfaces/recipe';
import { Location } from '@angular/common';

type RecipeSection = 'ingredients' | 'instructions';
type DetailIngredient = {
  key: string;
  title: string;
  amount?: string;
  usage?: string;
  icon: string;
};
type ResolvedRecipe = Recipe & {
  detailIngredients: DetailIngredient[];
};

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './recipe-detail.component.html',
  styleUrl: './recipe-detail.component.scss',
})
export class RecipeDetailComponent {
  private readonly numberFormatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  });
  readonly ratingLabel = '4.8';

  readonly sections = [
    { id: 'ingredients', label: 'Ingredients' },
    { id: 'instructions', label: 'Instructions' },
  ] as const;

  readonly selectedSection = signal<RecipeSection>('ingredients');

  onDelete() {
    const currentRecipe = this.recipe();

    if (!currentRecipe) {
      return;
    }

    this.recipeService.deleteRecipe(currentRecipe.id).subscribe(() => {
      this.location.back();
    });
  }
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly recipeService = inject(RecipeService);
  private readonly route = inject(ActivatedRoute);
  private readonly dialogService = inject(MatDialog);

  recipe = signal<ResolvedRecipe | undefined>(undefined);

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
    const currentRecipe = this.recipe();

    if (!currentRecipe) {
      return;
    }

    this.router.navigate(['edit-recipe', currentRecipe.id]);
  }

  selectSection(section: RecipeSection) {
    this.selectedSection.set(section);
  }

  public onSchedule() {
    const currentRecipe = this.recipe();

    if (!currentRecipe) {
      return;
    }

    this.dialogService.open(ScheduleRecipeModalComponent, {
      data: {
        recipeId: currentRecipe.id,
      },
    });
  }

  ingredientIcon(ingredient: RecipeIngredient): string {
    switch (ingredient.ingredient?.category) {
      case 'vegetable':
        return 'eco';
      case 'fruit':
        return 'nutrition';
      case 'pastry':
        return 'bakery_dining';
      case 'dairy':
        return 'egg';
      case 'meat':
        return 'set_meal';
      case 'fisch':
        return 'phishing';
      case 'finishedProduct':
        return 'shopping_bag';
      case 'seasoning':
        return 'spa';
      case 'candy':
        return 'icecream';
      case 'beverages':
        return 'local_bar';
      default:
        return 'restaurant';
    }
  }

  ingredientName(ingredient: RecipeIngredient): string {
    if (ingredient.amount > 1 && !ingredient.unit) {
      return ingredient.originalNamePlural;
    }

    return ingredient.originalName;
  }

  ingredientAmount(ingredient: RecipeIngredient): string {
    return [this.formatAmount(ingredient.amount), ingredient.unit]
      .filter(Boolean)
      .join(' ');
  }

  instructionIngredientLabel(ingredient: RecipeIngredient): string {
    return [this.ingredientAmount(ingredient), ingredient.originalName]
      .filter(Boolean)
      .join(' ');
  }

  recipeTimeLabel(recipe: Recipe): string {
    const totalTime = recipe.totalTime ?? recipe.prepTime ?? recipe.cookTime;

    if (!totalTime) {
      return 'No time set';
    }

    if (totalTime >= 600) {
      const minutes = Math.round(totalTime / 60);

      if (minutes < 60) {
        return `${minutes} min`;
      }

      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      return remainingMinutes
        ? `${hours} h ${remainingMinutes} min`
        : `${hours} h`;
    }

    return `${totalTime} min`;
  }

  displayTitle(recipe: Recipe): string {
    return recipe.title.replace(/\s+von\s+.+$/i, '').trim();
  }

  displayDescription(recipe: Recipe): string {
    return recipe.description
      .replace(/[►▶]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private resolveRecipe(recipe: Recipe): ResolvedRecipe {
    const ingredientsList = Array.isArray(recipe.ingredientsList)
      ? recipe.ingredientsList
      : [];

    return {
      ...recipe,
      detailIngredients: ingredientsList.length
        ? ingredientsList.map((ingredient, index) => ({
            key: `${ingredient.id ?? index}-${ingredient.originalName}`,
            title: this.ingredientName(ingredient),
            amount: this.ingredientAmount(ingredient),
            usage: ingredient.usage,
            icon: this.ingredientIcon(ingredient),
          }))
        : (recipe.ingredients ?? []).map((ingredient, index) =>
            this.parseIngredientText(ingredient, index)
          ),
      instructions: (recipe.instructions ?? []).map((instruction: any) => {
        return {
          ...instruction,
          ingredients: (instruction.ingredients ?? []).map((ingredient: any) => {
            const fullIngredient =
              ingredientsList.find(
                (i) => i.ingredientId === ingredient.id
              ) ||
              ingredientsList.find(
                (i) => i.ingredientId === ingredient.id
              );
            return {
              ...(fullIngredient as any),
              id: ingredient,
            } as Ingredient;
          }),
        } as Instruction;
      }),
    } as ResolvedRecipe;
  }

  private formatAmount(amount: number): string {
    return this.numberFormatter.format(amount);
  }

  private parseIngredientText(
    ingredientText: string,
    index: number
  ): DetailIngredient {
    const trimmedIngredient = ingredientText.trim();
    const parsedIngredient = trimmedIngredient.match(
      /^([\d.,/]+)\s*([^\d\s]+)?\s+(.+)$/
    );

    if (!parsedIngredient) {
      return {
        key: `text-${index}`,
        title: trimmedIngredient,
        icon: this.ingredientIconFromText(trimmedIngredient),
      };
    }

    const [, amountValue, unitValue, nameValue] = parsedIngredient;

    return {
      key: `text-${index}`,
      title: nameValue,
      amount: [amountValue, unitValue].filter(Boolean).join(' '),
      icon: this.ingredientIconFromText(nameValue),
    };
  }

  private ingredientIconFromText(ingredientName: string): string {
    const normalizedName = ingredientName.toLowerCase();

    if (
      /(zwiebel|paprika|tomate|salat|gurke|karotte|knoblauch|gemu|pepper|onion)/.test(
        normalizedName
      )
    ) {
      return 'eco';
    }

    if (/(apfel|banane|zitrone|beere|orange|frucht)/.test(normalizedName)) {
      return 'nutrition';
    }

    if (/(käse|joghurt|milch|sahne|butter|mozzarella|feta)/.test(normalizedName)) {
      return 'egg';
    }

    if (/(fleisch|gyros|huhn|rind|hack|speck|wurst|schinken)/.test(normalizedName)) {
      return 'set_meal';
    }

    if (/(fisch|lachs|thunfisch|garnelen)/.test(normalizedName)) {
      return 'phishing';
    }

    if (/(nudel|reis|brot|teig|pasta)/.test(normalizedName)) {
      return 'bakery_dining';
    }

    return 'restaurant';
  }
}
