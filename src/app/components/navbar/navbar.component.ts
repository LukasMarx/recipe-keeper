import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { UrlModalComponent } from '../modals/url-modal/url-modal.component';
import { RecipeService } from '../../services/recipe.service';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  private readonly dialog = inject(MatDialog);

  addRecipe() {
    const ref = this.dialog.open(UrlModalComponent);
  }
}
