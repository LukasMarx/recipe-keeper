import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize, forkJoin } from 'rxjs';
import {
  getIngredientDisplayName,
  getIngredientDisplayPlural,
} from '../../interfaces/ingredient';
import { UserService } from '../../services/user.service';
import {
  AggregatedGroceryListEntry,
  GroceryList,
  GroceryListEntry,
  GroceryListService,
} from '../../services/grocery-list.service';
import { HeaderComponent } from '../../components/header/header.component';
import { GroceryQuickAddComponent } from './components/grocery-quick-add/grocery-quick-add.component';
import { GroceryCategory } from './components/grocery-quick-add/grocery-quick-add.models';

type GroceryView = 'active' | 'archive';

interface GrocerySection {
  category: GroceryCategory;
  items: AggregatedGroceryListEntry[];
}

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

function normalizeHouseholdId(householdId: number | null | undefined) {
  return householdId && householdId > 0 ? householdId : null;
}

@Component({
  selector: 'app-grocery-list',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    HeaderComponent,
    GroceryQuickAddComponent,
  ],
  templateUrl: './grocery-list.component.html',
  styleUrl: './grocery-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroceryListComponent {
  public readonly groceryListService = inject(GroceryListService);

  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);

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

  private readonly archiveLimit = 8;

  public readonly activeHouseholdId = signal<number | null>(null);
  public readonly view = signal<GroceryView>('active');
  public readonly selectedFilter = signal<'all' | GroceryCategory>('all');

  public readonly activeList = signal<GroceryList | null>(null);
  public readonly archivedLists = signal<GroceryList[]>([]);
  public readonly archiveOffset = signal(0);
  public readonly hasMoreArchiveResults = signal(false);
  public readonly selectedArchivedListId = signal<number | null>(null);
  public readonly selectedArchivedList = signal<GroceryList | null>(null);

  public readonly isLoadingActive = signal(true);
  public readonly isLoadingArchive = signal(false);
  public readonly isLoadingArchivedList = signal(false);
  public readonly isAddingItem = signal(false);
  public readonly pendingAggregatedItemId = signal<number | null>(null);
  public readonly pendingRawItemId = signal<number | null>(null);
  public readonly isCompletingList = signal(false);
  public readonly isDeletingArchivedList = signal<number | null>(null);
  public readonly expandedAggregatedItemIds = signal<number[]>([]);

  public readonly activeListError = signal<string | null>(null);
  public readonly archiveError = signal<string | null>(null);
  public readonly actionError = signal<string | null>(null);

  public readonly editItemForm = new FormGroup({
    amount: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.01)],
    }),
    checked: new FormControl(false, { nonNullable: true }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    unit: new FormControl('', { nonNullable: true }),
  });

  public readonly editingItemId = signal<number | null>(null);

  public readonly allItems = computed(
    () => this.activeList()?.aggregatedItems ?? []
  );
  public readonly rawItems = computed(() => this.activeList()?.items ?? []);
  public readonly rawItemsById = computed(
    () => new Map(this.rawItems().map((item) => [item.id, item]))
  );

  public readonly availableFilters = computed(() => {
    const categories = new Set(
      this.allItems().map((item) => this.getItemCategory(item))
    );

    return this.categoryOrder.filter((category) => categories.has(category));
  });

  public readonly sections = computed<GrocerySection[]>(() => {
    const grouped = new Map<GroceryCategory, AggregatedGroceryListEntry[]>();
    const selectedFilter = this.selectedFilter();

    for (const item of this.allItems()) {
      const category = this.getItemCategory(item);
      if (selectedFilter !== 'all' && selectedFilter !== category) {
        continue;
      }

      const items = grouped.get(category) ?? [];
      items.push(item);
      grouped.set(category, items);
    }

    return this.categoryOrder
      .filter((category) => grouped.has(category))
      .map((category) => ({
        category,
        items: [...(grouped.get(category) ?? [])].sort(
          (left, right) => Number(left.checked) - Number(right.checked)
        ),
      }));
  });

  public readonly totalCount = computed(() => this.allItems().length);
  public readonly checkedCount = computed(
    () => this.allItems().filter((item) => item.checked).length
  );
  public readonly progressPercent = computed(() => {
    const totalCount = this.totalCount();
    if (!totalCount) {
      return 0;
    }

    return (this.checkedCount() / totalCount) * 100;
  });

  public readonly archivePage = computed(
    () => Math.floor(this.archiveOffset() / this.archiveLimit) + 1
  );

  constructor() {
    this.loadHouseholdContext();
  }

  public selectView(view: GroceryView) {
    this.view.set(view);

    if (view === 'archive' && !this.archivedLists().length && !this.isLoadingArchive()) {
      this.loadArchivePage(0);
    }
  }

  public selectFilter(filter: 'all' | GroceryCategory) {
    this.selectedFilter.set(filter);
  }

  public setActionError(message: string | null) {
    this.actionError.set(message);
  }

  public handleQuickAddAdded() {
    this.loadActiveList();
  }

  public formatQuantity(item: {
    quantityLabel?: string | null;
    amount: number | null;
    unit?: string | null;
  }) {
    if (item.quantityLabel?.trim()) {
      return item.quantityLabel;
    }

    if (item.amount === null || item.amount === undefined) {
      return '';
    }

    return item.unit ? `${item.amount} ${item.unit}` : `${item.amount}`;
  }

  public formatRawName(item: GroceryListEntry) {
    if (!item.unit) {
      return (
        getIngredientDisplayPlural(item.recipeIngredient) ||
        getIngredientDisplayName(item.recipeIngredient) ||
        item.name
      );
    }

    return getIngredientDisplayName(item.recipeIngredient) || item.name;
  }

  public getAggregatedItemSourceLabel(item: AggregatedGroceryListEntry) {
    return `${item.itemCount} ${item.itemCount === 1 ? 'source entry' : 'source entries'}`;
  }

  public getItemImageUrl(item: AggregatedGroceryListEntry | GroceryListEntry) {
    if (this.isAggregatedItem(item)) {
      return item.ingredient?.imageUrl ?? null;
    }

    return item.recipeIngredient?.ingredient?.imageUrl ?? null;
  }

  public isEditingItem(item: GroceryListEntry) {
    return this.editingItemId() === item.id;
  }

  public isSingleSourceItem(item: AggregatedGroceryListEntry) {
    return item.itemIds.length === 1;
  }

  public isSourceListExpanded(item: AggregatedGroceryListEntry) {
    return this.expandedAggregatedItemIds().includes(item.id);
  }

  public getSingleSourceItem(item: AggregatedGroceryListEntry) {
    if (!this.isSingleSourceItem(item)) {
      return null;
    }

    return this.rawItemsById().get(item.itemIds[0]) ?? null;
  }

  public getSourceItems(item: AggregatedGroceryListEntry) {
    return item.itemIds
      .map((itemId) => this.rawItemsById().get(itemId) ?? null)
      .filter((rawItem): rawItem is GroceryListEntry => rawItem !== null);
  }

  public toggleSourceList(item: AggregatedGroceryListEntry) {
    if (this.isSingleSourceItem(item)) {
      return;
    }

    this.expandedAggregatedItemIds.update((expandedIds) =>
      expandedIds.includes(item.id)
        ? expandedIds.filter((expandedId) => expandedId !== item.id)
        : [...expandedIds, item.id]
    );
  }

  public getAggregatedItemAriaChecked(item: AggregatedGroceryListEntry) {
    if (item.partiallyChecked) {
      return 'mixed';
    }

    return item.checked ? 'true' : 'false';
  }

  public getRawItemAriaChecked(item: GroceryListEntry) {
    return item.checked ? 'true' : 'false';
  }

  public startEditingItem(item: GroceryListEntry) {
    this.actionError.set(null);
    this.editingItemId.set(item.id);
    this.editItemForm.setValue({
      amount: item.amount,
      checked: item.checked,
      name: item.name,
      unit: item.unit ?? '',
    });
  }

  public cancelEditingItem() {
    this.editingItemId.set(null);
    this.editItemForm.reset({ amount: 1, checked: false, name: '', unit: '' });
  }

  public saveItemEdits(item: GroceryListEntry) {
    if (this.editItemForm.invalid) {
      this.editItemForm.markAllAsTouched();
      return;
    }

    this.actionError.set(null);
  this.pendingRawItemId.set(item.id);

    const value = this.editItemForm.getRawValue();

    this.groceryListService
      .updateItem(item.id, {
        amount: value.amount,
        checked: value.checked,
        name: value.name.trim(),
        unit: value.unit.trim() || undefined,
      })
      .pipe(finalize(() => this.pendingRawItemId.set(null)))
      .subscribe({
        next: () => {
          this.cancelEditingItem();
          this.loadActiveList();
        },
        error: (error) => {
          this.actionError.set(
            extractErrorMessage(error) ?? 'The grocery item could not be updated.'
          );
        },
      });
  }

  public toggleAggregatedItem(item: AggregatedGroceryListEntry) {
    const sourceItems = this.getSourceItems(item);
    if (!sourceItems.length) {
      return;
    }

    this.actionError.set(null);
    this.pendingAggregatedItemId.set(item.id);

    forkJoin(
      sourceItems.map((sourceItem) =>
        this.groceryListService.updateItem(sourceItem.id, {
          checked: !item.checked,
        })
      )
    )
      .pipe(finalize(() => this.pendingAggregatedItemId.set(null)))
      .subscribe({
        next: () => this.loadActiveList(),
        error: (error) => {
          this.actionError.set(
            extractErrorMessage(error) ?? 'The grocery item could not be updated.'
          );
        },
      });
  }

  public toggleRawItem(item: GroceryListEntry) {
    this.actionError.set(null);
    this.pendingRawItemId.set(item.id);

    this.groceryListService
      .updateItem(item.id, { checked: !item.checked })
      .pipe(finalize(() => this.pendingRawItemId.set(null)))
      .subscribe({
        next: () => this.loadActiveList(),
        error: (error) => {
          this.actionError.set(
            extractErrorMessage(error) ?? 'The grocery item could not be updated.'
          );
        },
      });
  }

  public deleteRawItem(item: GroceryListEntry) {
    if (!window.confirm(`Remove ${this.formatRawName(item)} from the current grocery list?`)) {
      return;
    }

    this.actionError.set(null);
    this.pendingRawItemId.set(item.id);

    this.groceryListService
      .deleteItem(item.id)
      .pipe(finalize(() => this.pendingRawItemId.set(null)))
      .subscribe({
        next: () => {
          if (this.editingItemId() === item.id) {
            this.cancelEditingItem();
          }

          this.loadActiveList();
        },
        error: (error) => {
          this.actionError.set(
            extractErrorMessage(error) ?? 'The grocery item could not be removed.'
          );
        },
      });
  }

  public completeShopping() {
    const householdId = this.activeHouseholdId();
    if (!householdId) {
      this.actionError.set('Select an active household before completing a grocery run.');
      return;
    }

    this.actionError.set(null);
    this.isCompletingList.set(true);

    this.groceryListService
      .completeActiveList({ householdId })
      .pipe(finalize(() => this.isCompletingList.set(false)))
      .subscribe({
        next: ({ activeList, archivedList }) => {
          this.activeList.set(activeList);
          this.selectedFilter.set('all');
          this.cancelEditingItem();
          this.loadArchivePage(0);
          this.snackBar.open(`Archived ${archivedList.name}.`, undefined, {
            duration: 3000,
          });
        },
        error: (error) => {
          this.actionError.set(
            extractErrorMessage(error) ??
              'The current grocery list could not be archived.'
          );
        },
      });
  }

  public openArchivedList(listId: number) {
    this.archiveError.set(null);
    this.selectedArchivedListId.set(listId);
    this.isLoadingArchivedList.set(true);

    this.groceryListService
      .getListById(listId)
      .pipe(finalize(() => this.isLoadingArchivedList.set(false)))
      .subscribe({
        next: (list) => this.selectedArchivedList.set(list),
        error: (error) => {
          this.selectedArchivedList.set(null);
          this.archiveError.set(
            extractErrorMessage(error) ?? 'The archived grocery list could not be opened.'
          );
        },
      });
  }

  public goToPreviousArchivePage() {
    if (this.archiveOffset() === 0) {
      return;
    }

    this.loadArchivePage(Math.max(0, this.archiveOffset() - this.archiveLimit));
  }

  public goToNextArchivePage() {
    if (!this.hasMoreArchiveResults()) {
      return;
    }

    this.loadArchivePage(this.archiveOffset() + this.archiveLimit);
  }

  public deleteArchivedList(list: GroceryList) {
    if (!window.confirm(`Delete archived grocery list ${list.name}?`)) {
      return;
    }

    this.archiveError.set(null);
    this.isDeletingArchivedList.set(list.id);

    this.groceryListService
      .deleteArchivedList(list.id)
      .pipe(finalize(() => this.isDeletingArchivedList.set(null)))
      .subscribe({
        next: () => {
          if (this.selectedArchivedListId() === list.id) {
            this.selectedArchivedListId.set(null);
            this.selectedArchivedList.set(null);
          }

          const nextOffset =
            this.archivedLists().length === 1 && this.archiveOffset() > 0
              ? Math.max(0, this.archiveOffset() - this.archiveLimit)
              : this.archiveOffset();

          this.loadArchivePage(nextOffset);
        },
        error: (error) => {
          this.archiveError.set(
            extractErrorMessage(error) ?? 'The archived grocery list could not be deleted.'
          );
        },
      });
  }

  public getArchiveDate(list: GroceryList) {
    return list.completedDate || list.archivedDate || list.updateDate || list.createDate;
  }

  public getArchiveItemCountLabel(list: GroceryList) {
    const itemCount = list.aggregatedItems.length;
    return `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;
  }

  public trackByAggregatedItemId(
    _index: number,
    item: AggregatedGroceryListEntry
  ) {
    return item.id;
  }

  public trackByRawItemId(_index: number, item: GroceryListEntry) {
    return item.id;
  }

  public trackByListId(_index: number, list: GroceryList) {
    return list.id;
  }

  private loadHouseholdContext() {
    this.userService.get().subscribe({
      next: (user) => {
        const householdId = normalizeHouseholdId(user.activeHouseholdId);
        this.activeHouseholdId.set(householdId);

        if (!householdId) {
          this.isLoadingActive.set(false);
          this.activeList.set(null);
          this.archivedLists.set([]);
          this.selectedArchivedList.set(null);
          this.selectedArchivedListId.set(null);
          this.activeListError.set(null);
          this.archiveError.set(null);
          return;
        }

        this.loadActiveList();
        this.loadArchivePage(0);
      },
      error: (error) => {
        this.isLoadingActive.set(false);
        this.activeListError.set(
          extractErrorMessage(error) ?? 'The active household could not be loaded.'
        );
      },
    });
  }

  private loadActiveList() {
    const householdId = this.activeHouseholdId();
    if (!householdId) {
      return;
    }

    this.isLoadingActive.set(true);
    this.activeListError.set(null);

    this.groceryListService
      .getActiveList(householdId)
      .pipe(finalize(() => this.isLoadingActive.set(false)))
      .subscribe({
        next: (list) => {
          this.activeList.set(list);

          if (
            this.selectedFilter() !== 'all' &&
            !list.aggregatedItems.some(
              (item) => this.getItemCategory(item) === this.selectedFilter()
            )
          ) {
            this.selectedFilter.set('all');
          }

          if (
            this.editingItemId() &&
            !list.items.some((item) => item.id === this.editingItemId())
          ) {
            this.cancelEditingItem();
          }
        },
        error: (error) => {
          this.activeList.set(null);
          this.activeListError.set(
            extractErrorMessage(error) ?? 'The current grocery list could not be loaded.'
          );
        },
      });
  }

  private loadArchivePage(offset: number) {
    const householdId = this.activeHouseholdId();
    if (!householdId) {
      return;
    }

    this.isLoadingArchive.set(true);
    this.archiveError.set(null);

    this.groceryListService
      .getArchivedLists({
        householdId,
        limit: this.archiveLimit,
        offset,
      })
      .pipe(finalize(() => this.isLoadingArchive.set(false)))
      .subscribe({
        next: (lists) => {
          this.archivedLists.set(lists);
          this.archiveOffset.set(offset);
          this.hasMoreArchiveResults.set(lists.length === this.archiveLimit);

          if (!lists.some((list) => list.id === this.selectedArchivedListId())) {
            this.selectedArchivedListId.set(null);
            this.selectedArchivedList.set(null);
          }
        },
        error: (error) => {
          this.archivedLists.set([]);
          this.hasMoreArchiveResults.set(false);
          this.archiveError.set(
            extractErrorMessage(error) ?? 'The grocery archive could not be loaded.'
          );
        },
      });
  }

  public getItemCategory(
    item: AggregatedGroceryListEntry | GroceryListEntry
  ): GroceryCategory {
    const category =
      this.isAggregatedItem(item)
        ? item.ingredient?.category
        : item.recipeIngredient?.ingredient.category;

    if (category === 'fisch') {
      return 'fish';
    }

    if (this.categoryOrder.includes(category as GroceryCategory)) {
      return category as GroceryCategory;
    }

    return 'other';
  }

  private isAggregatedItem(
    item: AggregatedGroceryListEntry | GroceryListEntry
  ): item is AggregatedGroceryListEntry {
    return 'itemIds' in item;
  }

}
