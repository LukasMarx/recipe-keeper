import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  startOfWeek,
} from 'date-fns';
import { ScheduleItemComponent } from './schedule-item/schedule-item.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SelectRecipeModalComponent } from '../../components/modals/select-recipe-modal/select-recipe-modal.component';
import { RecipeService } from '../../services/recipe.service';
import { filter, map, take } from 'rxjs';
import {
  ScheduledRecipe,
  ScheduleService,
} from '../../services/schedule.service';
import { groupBy } from 'lodash';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, ScheduleItemComponent, MatDialogModule],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleComponent {
  private readonly dialog = inject(MatDialog);
  private readonly recipeService = inject(RecipeService);
  private readonly scheduleService = inject(ScheduleService);

  public schedulesRecipes$ = this.scheduleService.getScheduledRecipes();

  public days$ = this.schedulesRecipes$.pipe(
    map((recipes) => {
      const groupedByDate = groupBy(recipes, (recipe) =>
        recipe.scheduledDate.toString()
      );
      return eachDayOfInterval({
        start: new Date(new Date().toDateString()),
        end: addDays(new Date(new Date().toDateString()), 7),
      }).map((date) => ({
        date,
        formatedDate: format(date, 'EEEE, MMMM do'),
        recipes: groupedByDate[date.toString()] || [],
      }));
    })
  );

  onAddClicked(day: { date: Date; formatedDate: string }) {
    this.recipeService
      .getMyRecipes()
      .pipe(
        filter((x) => !!x),
        take(1)
      )
      .subscribe((recipes) => {
        this.dialog.open(SelectRecipeModalComponent, {
          maxWidth: '100%',
          maxHeight: '100%',
          height: '100%',
          data: { recipes },
          panelClass: 'full-screen-modal',
        });
      });
  }

  onRemoveClicked(scheduledRecipe: ScheduledRecipe) {
    this.scheduleService
      .deleteScheduledRecipe(scheduledRecipe.id)
      .subscribe(() => {});
  }
}
