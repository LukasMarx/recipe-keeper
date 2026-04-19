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
import { Recipe, RecipeImportTask } from '../../interfaces/recipe';
import { Location } from '@angular/common';
import { distinctUntilChanged, map, switchMap } from 'rxjs';

type RecipeSection = 'ingredients' | 'instructions';
type DetailIngredient = {
  key: string;
  title: string;
  amount?: string;
  usage?: string;
  icon: string;
  imageUrl?: string;
};
type ResolvedRecipe = Recipe & {
  detailIngredients: DetailIngredient[];
  resolvedInstructions: Instruction[];
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
    this.route.params
      .pipe(
        map((params) => Number(params['id'])),
        distinctUntilChanged(),
        switchMap((id) => this.recipeService.getRecipe(id, true)),
        takeUntilDestroyed()
      )
      .subscribe((recipe) => this.recipe.set(this.resolveRecipe(recipe)));
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

    if (!currentRecipe || currentRecipe.status !== 'READY') {
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
    if (
      typeof ingredient.amount === 'number' &&
      ingredient.amount > 1 &&
      !ingredient.unit &&
      ingredient.originalNamePlural
    ) {
      return ingredient.originalNamePlural;
    }

    return ingredient.originalName || ingredient.ingredient?.plural || 'Ingredient';
  }

  ingredientAmount(ingredient: RecipeIngredient): string {
    return [
      typeof ingredient.amount === 'number' && Number.isFinite(ingredient.amount)
        ? this.formatAmount(ingredient.amount)
        : null,
      ingredient.unit,
    ]
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
    const baseTitle = recipe.title.replace(/\s+von\s+.+$/i, '').trim();
    return baseTitle || 'Imported recipe';
  }

  displayDescription(recipe: Recipe): string {
    return recipe.description
      .replace(/[►▶]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  hasImportState(recipe: Recipe): boolean {
    return recipe.status !== 'READY';
  }

  isRecipeReady(recipe: Recipe): boolean {
    return recipe.status === 'READY';
  }

  recipeStatusLabel(recipe: Recipe): string {
    switch (recipe.status) {
      case 'IMPORTING':
        return 'Importing';
      case 'ENRICHING':
        return 'Enriching';
      case 'FAILED':
        return 'Failed';
      default:
        return 'Ready';
    }
  }

  recipeStatusHeadline(recipe: Recipe): string {
    switch (recipe.status) {
      case 'IMPORTING':
        return 'Ingredients are being analyzed.';
      case 'ENRICHING':
        return 'The recipe is being enriched with additional details.';
      case 'FAILED':
        return 'The recipe import could not be completed.';
      default:
        return 'Recipe import finished.';
    }
  }

  recipeStatusDescription(recipe: Recipe): string {
    const activeTask = this.getPrimaryTask(recipe);

    if (recipe.status === 'FAILED') {
      return (
        recipe.importFailureMessage ??
        activeTask?.error ??
        'Some background tasks failed. Review the task details below.'
      );
    }

    if (activeTask) {
      return this.taskDescription(activeTask);
    }

    if (recipe.status === 'READY') {
      return 'All available instructions, nutrition data, and ingredient details are ready.';
    }

    return 'This recipe was created already and is still receiving additional data from the background queue.';
  }

  getVisibleTasks(recipe: Recipe): RecipeImportTask[] {
    return [...(recipe.importTasks ?? [])].sort((left, right) => {
      return this.taskSortWeight(left.status) - this.taskSortWeight(right.status);
    });
  }

  taskLabel(task: RecipeImportTask): string {
    switch (task.type) {
      case 'PARSE_INGREDIENTS':
        return 'Analyze ingredients';
      case 'ENHANCE_INSTRUCTIONS':
        return 'Improve instructions';
      case 'GENERATE_NUTRITION':
        return 'Generate nutrition';
      case 'GENERATE_INGREDIENT_IMAGE':
        return 'Generate ingredient images';
    }
  }

  taskStatusLabel(task: RecipeImportTask): string {
    switch (task.status) {
      case 'PENDING':
        return 'Pending';
      case 'PROCESSING':
        return 'In progress';
      case 'COMPLETED':
        return 'Completed';
      case 'FAILED':
        return 'Failed';
    }
  }

  private resolveRecipe(recipe: Recipe): ResolvedRecipe {
    const ingredientsList = Array.isArray(recipe.ingredientsList)
      ? recipe.ingredientsList
      : [];

    return {
      ...recipe,
      detailIngredients: ingredientsList.length
        ? ingredientsList.map((ingredient, index) => ({
            key: `${ingredient.id ?? index}-${ingredient.originalName ?? index}`,
            title: this.ingredientName(ingredient),
            amount: this.ingredientAmount(ingredient),
            usage: ingredient.usage,
            icon: this.ingredientIcon(ingredient),
            imageUrl: ingredient.ingredient.imageUrl,
          }))
        : (recipe.ingredients ?? []).map((ingredient, index) =>
            this.parseIngredientText(ingredient, index)
          ),
      resolvedInstructions: this.resolveInstructions(recipe, ingredientsList),
    } as ResolvedRecipe;
  }

  private resolveInstructions(
    recipe: Recipe,
    ingredientsList: RecipeIngredient[]
  ): Instruction[] {
    return (recipe.instructions ?? []).map((instruction, index) => {
      if (typeof instruction === 'string') {
        return {
          title: '',
          description: instruction,
          ingredients: [],
        } as Instruction;
      }

      const resolvedIngredients = Array.isArray(instruction?.ingredients)
        ? instruction.ingredients
            .map((ingredient) =>
              this.resolveInstructionIngredient(ingredient, ingredientsList, index)
            )
            .filter((ingredient): ingredient is RecipeIngredient => !!ingredient)
        : [];

      return {
        title: typeof instruction?.title === 'string' ? instruction.title : '',
        description:
          typeof instruction?.description === 'string'
            ? instruction.description
            : '',
        ingredients: resolvedIngredients,
      } as Instruction;
    });
  }

  private formatAmount(amount: number): string {
    return this.numberFormatter.format(amount);
  }

  private resolveInstructionIngredient(
    ingredientReference: any,
    ingredientsList: RecipeIngredient[],
    index: number
  ): RecipeIngredient | null {
    if (ingredientReference?.originalName) {
      return ingredientReference as RecipeIngredient;
    }

    if (typeof ingredientReference === 'string') {
      return (
        ingredientsList.find(
          (ingredient) =>
            ingredient.originalName === ingredientReference ||
            ingredient.originalNamePlural === ingredientReference
        ) ?? null
      );
    }

    const ingredientId = Number(
      ingredientReference?.ingredientId ?? ingredientReference?.id ?? ingredientReference
    );

    if (!Number.isFinite(ingredientId)) {
      return null;
    }

    return (
      ingredientsList.find(
        (ingredient) =>
          Number(ingredient.id) === ingredientId ||
          Number((ingredient as any).ingredientId) === ingredientId
      ) ?? null
    );
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

  private getPrimaryTask(recipe: Recipe): RecipeImportTask | undefined {
    return (recipe.importTasks ?? []).find(
      (task) => task.status === 'PROCESSING' || task.status === 'PENDING'
    );
  }

  private taskDescription(task: RecipeImportTask): string {
    switch (task.type) {
      case 'PARSE_INGREDIENTS':
        return 'Ingredients are being extracted and normalized for the recipe.';
      case 'ENHANCE_INSTRUCTIONS':
        return 'Step descriptions are being enhanced for readability.';
      case 'GENERATE_NUTRITION':
        return 'Nutrition facts are being generated.';
      case 'GENERATE_INGREDIENT_IMAGE':
        return 'Ingredient imagery is being created.';
    }
  }

  private taskSortWeight(taskStatus: RecipeImportTask['status']): number {
    switch (taskStatus) {
      case 'FAILED':
        return 0;
      case 'PROCESSING':
        return 1;
      case 'PENDING':
        return 2;
      case 'COMPLETED':
        return 3;
    }
  }
}
