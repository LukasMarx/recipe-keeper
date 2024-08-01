import { Component, inject } from '@angular/core';
import { RecipeService } from '../../services/recipe.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RecipeListComponent } from '../../components/recipe-list/recipe-list.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { UrlModalComponent } from '../../components/modals/url-modal/url-modal.component';

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
  private readonly dialog = inject(MatDialog);
  public recipes$ = this.recipeService.getMyRecipes();

  addRecipe() {
    const ref = this.dialog.open(UrlModalComponent);
  }

  onClick(id: number) {
    this.router.navigate(['recipe', id]);
  }
}
