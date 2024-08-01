import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { RecipeListComponent } from '../../recipe-list/recipe-list.component';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Recipe } from '../../../interfaces/recipe';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-select-recipe-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    RecipeListComponent,
    MatStepperModule,
    MatInputModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './select-recipe-modal.component.html',
  styleUrl: './select-recipe-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectRecipeModalComponent {
  private readonly dialogRef = inject(DialogRef);
  private readonly data = inject(DIALOG_DATA);

  public recipes: Recipe[] = this.data.recipes;
}
