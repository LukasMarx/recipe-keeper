import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { UrlModalComponent } from '../url-modal/url-modal.component';
import { RecipeService } from '../../services/recipe.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  private readonly dialog = inject(MatDialog);
  private readonly recipeService = inject(RecipeService);
  private readonly router = inject(Router);

  addRecipe() {
    const ref = this.dialog.open(UrlModalComponent);
    ref.afterClosed().subscribe((url) => {
      if (url) {
        this.recipeService.getRecipeFromUrl(url).subscribe((recipe) =>
          this.router.navigate(['new-recipe'], {
            queryParams: {
              recipe: JSON.stringify(recipe),
            },
          })
        );
      }
    });
  }
}
