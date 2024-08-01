import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Recipe } from '../../../interfaces/recipe';

@Component({
  selector: 'app-recipe-list-item',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './recipe-list-item.component.html',
  styleUrl: './recipe-list-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeListItemComponent {
  public recipe = input<Recipe>();
}
