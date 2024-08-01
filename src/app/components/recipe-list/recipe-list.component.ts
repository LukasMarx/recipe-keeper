import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { Recipe } from '../../interfaces/recipe';
import { RecipeListItemComponent } from './recipe-list-item/recipe-list-item.component';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [CommonModule, RecipeListItemComponent],
  templateUrl: './recipe-list.component.html',
  styleUrl: './recipe-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeListComponent {
  public recipes = input<Recipe[] | null>();
  public onRecipeClick = output<number>();

  onClick(recipeId: number) {
    this.onRecipeClick.emit(recipeId);
  }
}
