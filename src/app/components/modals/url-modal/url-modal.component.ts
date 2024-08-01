import { Component, inject, signal } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MatFormFieldModule,
} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';
import { RecipeService } from '../../../services/recipe.service';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-url-modal',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './url-modal.component.html',
  styleUrl: './url-modal.component.scss',
})
export class UrlModalComponent {
  private dialogRef = inject(DialogRef);
  private readonly recipeService = inject(RecipeService);
  private readonly router = inject(Router);
  public url = '';
  public isLoading = signal<boolean>(false);

  public onSubmit() {
    if (this.url) {
      this.isLoading.set(true);
      this.recipeService.getRecipeFromUrl(this.url).subscribe((recipe) => {
        this.dialogRef.close();
        this.isLoading.set(false);
        this.router.navigate(['new-recipe'], {
          queryParams: {
            recipe: JSON.stringify(recipe),
          },
        });
      });
    }
  }

  public onCancel() {
    this.dialogRef.close();
  }
}
