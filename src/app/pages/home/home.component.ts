import { Component, inject } from '@angular/core';
import { RecipeService } from '../../services/recipe.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RecipeListComponent } from '../../components/recipe-list/recipe-list.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RecipeListComponent, MatIconModule, MatButtonModule],
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
