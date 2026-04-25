import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import {
  getIngredientDisplayName,
  getIngredientDisplayPlural,
} from '../../../../interfaces/ingredient';
import { IngredientService, IngredientSearchResult } from '../../../../services/ingredient.service';
import { GroceryListService } from '../../../../services/grocery-list.service';
import { GroceryCategory, QuickAddSuggestion } from './grocery-quick-add.models';
import { QuickAddDetailComponent } from './quick-add-detail/quick-add-detail.component';
import { QuickAddSuggestionsComponent } from './quick-add-suggestions/quick-add-suggestions.component';

function extractErrorMessage(error: unknown) {
  if (error instanceof HttpErrorResponse) {
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }

    if (
      error.error &&
      typeof error.error === 'object' &&
      'message' in error.error &&
      typeof error.error.message === 'string' &&
      error.error.message.trim()
    ) {
      return error.error.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return null;
}

@Component({
  selector: 'app-grocery-quick-add',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    QuickAddDetailComponent,
    QuickAddSuggestionsComponent,
  ],
  templateUrl: './grocery-quick-add.component.html',
  styleUrl: './grocery-quick-add.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroceryQuickAddComponent {
  private readonly ingredientService = inject(IngredientService);
  private readonly groceryListService = inject(GroceryListService);

  private readonly categoryOrder: GroceryCategory[] = [
    'vegetable',
    'fruit',
    'dairy',
    'meat',
    'fish',
    'pastry',
    'finishedProduct',
    'seasoning',
    'candy',
    'beverages',
    'other',
  ];

  public readonly householdId = input.required<number>();

  public readonly itemAdded = output<void>();
  public readonly errorChanged = output<string | null>();

  public readonly isAddingItem = signal(false);
  public readonly isQuickAddFocused = signal(false);
  public readonly activeSuggestionIndex = signal(-1);
  public readonly selectedQuickAddSuggestion = signal<QuickAddSuggestion | null>(null);

  public readonly addItemForm = new FormGroup({
    amount: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.01)],
    }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    unit: new FormControl('', { nonNullable: true }),
  });

  public readonly quickAddSuggestions = toSignal(
    this.addItemForm.controls.name.valueChanges.pipe(
      startWith(this.addItemForm.controls.name.value),
      map((value) => value.trim()),
      distinctUntilChanged(),
      debounceTime(250),
      switchMap((query) => {
        if (!this.isQuickAddFocused() || !query.length) {
          return of<QuickAddSuggestion[]>([]);
        }

        return this.ingredientService.search(query, 8).pipe(
          map((ingredients) => ingredients.map((ingredient) => this.mapQuickAddSuggestion(ingredient))),
          catchError(() => of<QuickAddSuggestion[]>([]))
        );
      })
    ),
    { initialValue: [] }
  );

  public readonly isQuickAddSuggestionListVisible = computed(
    () => !this.selectedQuickAddSuggestion() && this.quickAddSuggestions().length > 0
  );

  public readonly isQuickAddDetailVisible = computed(
    () => this.selectedQuickAddSuggestion() !== null
  );

  public readonly isQuickAddOverlayVisible = computed(
    () => this.isQuickAddSuggestionListVisible() || this.isQuickAddDetailVisible()
  );

  public handleQuickAddFocus() {
    if (this.selectedQuickAddSuggestion()) {
      return;
    }

    this.isQuickAddFocused.set(true);
  }

  public handleQuickAddInput() {
    if (this.selectedQuickAddSuggestion()) {
      this.selectedQuickAddSuggestion.set(null);
      this.addItemForm.controls.amount.setValue(1);
      this.addItemForm.controls.unit.setValue('');
    }

    this.isQuickAddFocused.set(true);
    this.activeSuggestionIndex.set(-1);
  }

  public handleQuickAddFocusOut(event: FocusEvent) {
    const currentTarget = event.currentTarget;
    const nextTarget = event.relatedTarget;

    if (
      currentTarget instanceof HTMLElement &&
      nextTarget instanceof Node &&
      currentTarget.contains(nextTarget)
    ) {
      return;
    }

    this.isQuickAddFocused.set(false);
    this.activeSuggestionIndex.set(-1);
  }

  public handleQuickAddKeydown(event: KeyboardEvent) {
    const suggestions = this.quickAddSuggestions();
    if (!suggestions.length) {
      if (event.key === 'Escape') {
        this.isQuickAddFocused.set(false);
        this.activeSuggestionIndex.set(-1);
      }

      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeSuggestionIndex.update((currentIndex) =>
        Math.min(currentIndex + 1, suggestions.length - 1)
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeSuggestionIndex.update((currentIndex) =>
        currentIndex <= 0 ? suggestions.length - 1 : currentIndex - 1
      );
      return;
    }

    if (event.key === 'Enter' && this.activeSuggestionIndex() > -1) {
      event.preventDefault();
      this.applyQuickAddSuggestion(suggestions[this.activeSuggestionIndex()]);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.isQuickAddFocused.set(false);
      this.activeSuggestionIndex.set(-1);
    }
  }

  public setActiveSuggestionIndex(index: number) {
    this.activeSuggestionIndex.set(index);
  }

  public dismissQuickAddSuggestions() {
    this.isQuickAddFocused.set(false);
    this.activeSuggestionIndex.set(-1);
    this.selectedQuickAddSuggestion.set(null);
  }

  public applyQuickAddSuggestion(suggestion: QuickAddSuggestion) {
    this.addItemForm.controls.name.setValue(suggestion.name);
    this.selectedQuickAddSuggestion.set(suggestion);
    this.addItemForm.controls.amount.setValue(1);
    this.addItemForm.controls.unit.setValue('');
    this.isQuickAddFocused.set(false);
    this.activeSuggestionIndex.set(-1);
  }

  public returnToQuickAddSuggestions() {
    if (!this.selectedQuickAddSuggestion()) {
      return;
    }

    this.selectedQuickAddSuggestion.set(null);
    this.isQuickAddFocused.set(true);
    this.activeSuggestionIndex.set(-1);
  }

  public increaseQuickAddAmount() {
    this.addItemForm.controls.amount.setValue(this.addItemForm.controls.amount.value + 1);
  }

  public decreaseQuickAddAmount() {
    const nextAmount = Math.max(1, this.addItemForm.controls.amount.value - 1);
    this.addItemForm.controls.amount.setValue(nextAmount);
  }

  public getQuickAddSuggestionOptionId(index: number) {
    return `quick-add-suggestion-${index}`;
  }

  public addManualItem() {
    if (this.addItemForm.invalid) {
      this.addItemForm.markAllAsTouched();
      return;
    }

    this.errorChanged.emit(null);
    this.isAddingItem.set(true);

    const value = this.addItemForm.getRawValue();
    const selectedSuggestion = this.selectedQuickAddSuggestion();

    this.groceryListService
      .addManualItem({
        amount: value.amount,
        householdId: this.householdId(),
        ingredientId: selectedSuggestion?.id,
        name: value.name.trim(),
        unit: value.unit.trim() || undefined,
      })
      .pipe(finalize(() => this.isAddingItem.set(false)))
      .subscribe({
        next: () => {
          this.addItemForm.reset({ amount: 1, name: '', unit: '' });
          this.dismissQuickAddSuggestions();
          this.itemAdded.emit();
        },
        error: (error) => {
          this.errorChanged.emit(
            extractErrorMessage(error) ?? 'The grocery item could not be added.'
          );
        },
      });
  }

  private mapQuickAddSuggestion(ingredient: IngredientSearchResult): QuickAddSuggestion {
    return {
      key: ingredient.id,
      id: ingredient.id,
      name:
        getIngredientDisplayName(ingredient) ||
        getIngredientDisplayPlural(ingredient) ||
        ingredient.id,
      category: this.normalizeIngredientCategory(ingredient.category),
      imageUrl: ingredient.imageUrl ?? null,
    };
  }

  private normalizeIngredientCategory(category: string | null | undefined): GroceryCategory {
    if (category === 'fisch') {
      return 'fish';
    }

    if (this.categoryOrder.includes(category as GroceryCategory)) {
      return category as GroceryCategory;
    }

    return 'other';
  }
}