import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MealType, ScheduledRecipe } from '../../../services/schedule.service';
import { Router } from '@angular/router';

export interface ScheduleMealGroup {
  mealType: MealType;
  label: string;
  actionLabel: string;
  recipes: ScheduledRecipe[];
}

export interface ScheduleDayCard {
  date: Date;
  sectionLabel: string;
  shortDateLabel: string;
  fullDateLabel: string;
  caloriesLabel: string | null;
  mealGroups: ScheduleMealGroup[];
  isToday: boolean;
  isEmpty: boolean;
}

@Component({
  selector: 'app-schedule-item',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './schedule-item.component.html',
  styleUrl: './schedule-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleItemComponent {
  private readonly router = inject(Router);
  public day = input.required<ScheduleDayCard>();

  public removeClicked = output<ScheduledRecipe>();

  public addClicked = output<MealType>();

  public onAddClick(mealType: MealType) {
    this.addClicked.emit(mealType);
  }

  public onRecipeClick(recipe: ScheduledRecipe) {
    this.router.navigate(['recipe', recipe.recipe.id]);
  }

  public onRemoveClick(event: MouseEvent, recipe: ScheduledRecipe) {
    event.stopPropagation();
    this.removeClicked.emit(recipe);
  }
}
