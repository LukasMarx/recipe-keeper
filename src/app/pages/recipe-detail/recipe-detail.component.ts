import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { RecipeService } from '../../services/recipe.service';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DurationPipe } from '../../pipes/duration.pipe';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    CdkTextareaAutosize,
    ReactiveFormsModule,
    MatListModule,
    DurationPipe,
  ],
  templateUrl: './recipe-detail.component.html',
  styleUrl: './recipe-detail.component.scss',
})
export class RecipeDetailComponent {
  private readonly recipeService = inject(RecipeService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  recipe = signal<any>(undefined);

  constructor() {
    this.route.params.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = params['id'];
      this.recipeService
        .getRecipe(id)
        .subscribe((recipe) => this.recipe.set(recipe));
    });
  }

  onBack() {
    this.router.navigate(['']);
  }
}
