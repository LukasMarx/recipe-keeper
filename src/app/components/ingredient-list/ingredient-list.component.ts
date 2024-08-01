import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  Input,
} from '@angular/core';
import { RecipeIngredient } from '../../interfaces/ingredient';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-ingredient-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './ingredient-list.component.html',
  styleUrl: './ingredient-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientListComponent {
  onAddClick() {
    throw new Error('Method not implemented.');
  }
  onDeleteClick(_t1: RecipeIngredient) {
    throw new Error('Method not implemented.');
  }
  onEditClick(_t1: RecipeIngredient) {
    throw new Error('Method not implemented.');
  }
  ingredients = input<RecipeIngredient[]>();
  isInEditMode = input(false);
}
