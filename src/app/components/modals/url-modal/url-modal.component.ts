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
import { finalize } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  private readonly snackBar = inject(MatSnackBar);
  public url = '';
  public isLoading = signal<boolean>(false);

  public onSubmit() {
    const trimmedUrl = this.url.trim();

    if (trimmedUrl) {
      this.isLoading.set(true);
      this.recipeService
        .importRecipe(trimmedUrl)
        .pipe(
          finalize(() => {
            this.isLoading.set(false);
          })
        )
        .subscribe({
          next: (recipe) => {
            this.dialogRef.close();
            this.router.navigate(['recipe', recipe.id]);
          },
          error: () => {
            this.snackBar.open(
              'The recipe import could not be started. Please try again.',
              undefined,
              {
                verticalPosition: 'top',
                duration: 4000,
              }
            );
          },
        });
    }
  }

  public onCancel() {
    this.dialogRef.close();
  }
}
