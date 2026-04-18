import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  addDays,
  eachDayOfInterval,
  format,
} from 'date-fns';
import {
  ScheduleDayCard,
  ScheduleItemComponent,
  ScheduleMealGroup,
} from './schedule-item/schedule-item.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SelectRecipeModalComponent } from '../../components/modals/select-recipe-modal/select-recipe-modal.component';
import { RecipeService } from '../../services/recipe.service';
import { filter, map, take } from 'rxjs';
import {
  MealType,
  ScheduledRecipe,
  ScheduleService,
} from '../../services/schedule.service';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

const DAYS_TO_SHOW = 7;
const PRIMARY_MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER'];
const EXTRA_MEAL_TYPES: MealType[] = ['SNACK', 'OTHER'];
const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snack',
  OTHER: 'Other',
};

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, ScheduleItemComponent, MatDialogModule, MatIconModule],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleComponent {
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly recipeService = inject(RecipeService);
  private readonly scheduleService = inject(ScheduleService);
  private readonly today = new Date(new Date().toDateString());
  private readonly visibleDates = eachDayOfInterval({
    start: this.today,
    end: addDays(this.today, DAYS_TO_SHOW - 1),
  });

  public readonly weekRangeLabel = `${format(this.visibleDates[0], 'MMM d')} - ${format(
    this.visibleDates[this.visibleDates.length - 1],
    'MMM d'
  )}`;

  public schedulesRecipes$ = this.scheduleService.getScheduledRecipes();

  public days$ = this.schedulesRecipes$.pipe(
    map((recipes): ScheduleDayCard[] => {
      const groupedByDate = this.groupRecipesBy(
        recipes,
        (recipe) => recipe.scheduledDate.toString()
      );
      return this.visibleDates.map((date, index) =>
        this.buildDayCard(date, groupedByDate[date.toString()] || [], index)
      );
    })
  );

  public openRecipeComposer() {
    this.router.navigate(['new-recipe']);
  }

  public goToRecipes() {
    this.router.navigate(['recipes']);
  }

  public goToAccount() {
    this.router.navigate(['account']);
  }

  public onAddClicked(day: ScheduleDayCard, mealType: MealType = 'DINNER') {
    this.recipeService
      .getMyRecipes()
      .pipe(
        filter((x) => !!x),
        take(1)
      )
      .subscribe((recipes) => {
        const dialogRef = this.dialog.open(SelectRecipeModalComponent, {
          maxWidth: '100%',
          maxHeight: '100%',
          height: '100%',
          data: { recipes, date: day.date, mealType },
          panelClass: 'full-screen-modal',
        });

        dialogRef.afterClosed().subscribe(() => {
          this.scheduleService.getScheduledRecipes();
        });
      });
  }

  public onRemoveClicked(scheduledRecipe: ScheduledRecipe) {
    this.scheduleService
      .deleteScheduledRecipe(scheduledRecipe.id)
      .subscribe(() => {});
  }

  private buildDayCard(
    date: Date,
    recipes: ScheduledRecipe[],
    index: number
  ): ScheduleDayCard {
    const isToday = index === 0;
    const calories = recipes.reduce(
      (total, recipe) => total + (recipe.recipe.calories || 0),
      0
    );

    return {
      date,
      sectionLabel: this.getSectionLabel(index, date),
      shortDateLabel: format(date, 'EEE, d'),
      fullDateLabel: format(date, 'EEEE, MMMM do'),
      caloriesLabel: calories > 0 ? `${calories.toLocaleString()} kcal` : null,
      mealGroups: this.buildMealGroups(recipes, isToday),
      isToday,
      isEmpty: recipes.length === 0,
    };
  }

  private buildMealGroups(
    recipes: ScheduledRecipe[],
    isToday: boolean
  ): ScheduleMealGroup[] {
    const recipesByMealType = this.groupRecipesBy(
      recipes,
      (recipe) => recipe.mealType
    );
    const actionLabel = isToday ? 'Add' : 'Plan';

    return [...PRIMARY_MEAL_TYPES, ...EXTRA_MEAL_TYPES]
      .map((mealType) => ({
        mealType,
        label: MEAL_LABELS[mealType],
        actionLabel,
        recipes: recipesByMealType[mealType] || [],
        hiddenWhenEmpty:
          EXTRA_MEAL_TYPES.includes(mealType) &&
          (recipesByMealType[mealType] || []).length === 0,
      }))
      .filter((group) => !group.hiddenWhenEmpty)
      .map(({ hiddenWhenEmpty, ...group }) => group);
  }

  private getSectionLabel(index: number, date: Date) {
    if (index === 0) {
      return 'Today';
    }

    if (index === 1) {
      return 'Tomorrow';
    }

    return format(date, 'EEEE');
  }

  private groupRecipesBy<Key extends string>(
    recipes: ScheduledRecipe[],
    selector: (recipe: ScheduledRecipe) => Key
  ): Record<Key, ScheduledRecipe[]> {
    return recipes.reduce(
      (groups, recipe) => {
        const key = selector(recipe);
        groups[key] = [...(groups[key] || []), recipe];
        return groups;
      },
      {} as Record<Key, ScheduledRecipe[]>
    );
  }
}
