import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RecipeService } from '../../services/recipe.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { UrlModalComponent } from '../../components/modals/url-modal/url-modal.component';
import { Recipe } from '../../interfaces/recipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly displayTitleMaxLength = 38;
  private readonly displayMetaMaxLength = 40;
  private readonly recipeService = inject(RecipeService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  public recipes$ = this.recipeService.getMyRecipes();

  addRecipe() {
    this.dialog.open(UrlModalComponent);
  }

  onClick(id: number) {
    this.router.navigate(['recipe', id]);
  }

  getDisplayTitle(recipe: Recipe): string {
    const normalizedTitle = this.normalizeTitle(recipe.title);
    const titleWithoutAuthor = this.removeImportedAuthor(normalizedTitle);
    const titleWithoutSuffix = this.removeTrailingSourceSuffix(titleWithoutAuthor);

    return this.truncateAtWordBoundary(titleWithoutSuffix, this.displayTitleMaxLength);
  }

  getRecipeMeta(recipe: Recipe): string {
    const importedAuthor = this.getImportedAuthor(recipe.title);
    if (importedAuthor) {
      return `by ${importedAuthor}`;
    }

    const sourceLabel = this.getSourceLabel(recipe.sourceUrl);
    if (sourceLabel) {
      return `by ${sourceLabel}`;
    }

    const description = recipe.description?.trim();
    if (description) {
      return this.truncateAtWordBoundary(description, this.displayMetaMaxLength);
    }

    return 'Saved in your collection';
  }

  private normalizeTitle(title?: string): string {
    return title?.replace(/\s+/g, ' ').trim() ?? '';
  }

  private getImportedAuthor(title?: string): string | null {
    const normalizedTitle = this.normalizeTitle(title);
    const authorMatch = normalizedTitle.match(/\svon\s+([^|,]+)$/i);
    const author = authorMatch?.[1]?.trim();

    return author ? author : null;
  }

  private removeImportedAuthor(title: string): string {
    return title.replace(/\svon\s+([^|,]+)$/i, '').trim();
  }

  private removeTrailingSourceSuffix(title: string): string {
    return title
      .replace(/\s+(?:\||·|•|–|—)\s+.+$/, '')
      .replace(/[,:;\-\s]+$/, '')
      .trim();
  }

  private truncateAtWordBoundary(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
      return value;
    }

    const shortenedValue = value.slice(0, maxLength + 1);
    const withoutTrailingWord = shortenedValue.replace(/\s+\S*$/, '').trim();
    const fallbackValue = value.slice(0, maxLength).trim();

    return `${withoutTrailingWord || fallbackValue}…`;
  }

  private getSourceLabel(sourceUrl?: string): string | null {
    if (!sourceUrl) {
      return null;
    }

    try {
      const hostname = new URL(sourceUrl).hostname.replace(/^www\./, '');
      const baseLabel = hostname.split('.')[0]?.replace(/[-_]+/g, ' ').trim();

      if (!baseLabel) {
        return null;
      }

      return baseLabel
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    } catch {
      return null;
    }
  }
}
