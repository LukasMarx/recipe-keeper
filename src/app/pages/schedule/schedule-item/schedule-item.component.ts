import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  Input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Recipe } from '../../../interfaces/recipe';
import { ScheduledRecipe } from '../../../services/schedule.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-schedule-item',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './schedule-item.component.html',
  styleUrl: './schedule-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleItemComponent {
  private readonly router = inject(Router);
  public title = input('');
  public scheduledRecipes = input<ScheduledRecipe[]>();

  public removeClicked = output<ScheduledRecipe>();

  public addClicked = output();

  public onAddClick() {
    this.addClicked.emit();
  }

  public onRecipeClick(recipe: ScheduledRecipe) {
    this.router.navigate(['recipe', recipe.recipe.id]);
  }

  onRemoveClick(event: MouseEvent, recipe: ScheduledRecipe) {
    event.stopPropagation();
    this.removeClicked.emit(recipe);
  }

  capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}
