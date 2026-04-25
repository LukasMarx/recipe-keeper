import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { GroceryListService } from '../../../../../services/grocery-list.service';
import {
  QuickAddSuggestion,
  SuggestionPart,
} from '../grocery-quick-add.models';

@Component({
  selector: 'app-quick-add-suggestions',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './quick-add-suggestions.component.html',
  styleUrl: './quick-add-suggestions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickAddSuggestionsComponent {
  public readonly groceryListService = inject(GroceryListService);

  public readonly suggestions = input.required<QuickAddSuggestion[]>();
  public readonly activeSuggestionIndex = input.required<number>();
  public readonly query = input('');

  public readonly activeSuggestionIndexChange = output<number>();
  public readonly suggestionSelected = output<QuickAddSuggestion>();

  public setActiveSuggestionIndex(index: number) {
    this.activeSuggestionIndexChange.emit(index);
  }

  public selectSuggestion(suggestion: QuickAddSuggestion) {
    this.suggestionSelected.emit(suggestion);
  }

  public getSuggestionOptionId(index: number) {
    return `quick-add-suggestion-${index}`;
  }

  public getSuggestionParts(name: string): SuggestionPart[] {
    const query = this.normalizeSearchValue(this.query());
    if (!query) {
      return [{ text: name, match: false }];
    }

    const normalizedName = this.normalizeSearchValue(name);
    const matchIndex = normalizedName.indexOf(query);

    if (matchIndex < 0) {
      return [{ text: name, match: false }];
    }

    const parts: SuggestionPart[] = [];
    if (matchIndex > 0) {
      parts.push({ text: name.slice(0, matchIndex), match: false });
    }

    parts.push({
      text: name.slice(matchIndex, matchIndex + query.length),
      match: true,
    });

    if (matchIndex + query.length < name.length) {
      parts.push({ text: name.slice(matchIndex + query.length), match: false });
    }

    return parts;
  }

  private normalizeSearchValue(value: string | null | undefined) {
    return (value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  }
}