import { Component, inject } from '@angular/core';
import { RecipeService } from '../../services/recipe.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly recipeService = inject(RecipeService);
  private readonly router = inject(Router);
  public recipes$ = this.recipeService.getMyRecipes();

  onClick(id: number) {
    this.router.navigate(['recipe', id]);
  }
}
