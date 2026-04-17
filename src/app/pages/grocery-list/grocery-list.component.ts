import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { EditGroceryListModalComponent } from '../../components/modals/edit-grocery-list-modal/edit-grocery-list-modal.component';
import {
  GroceryList,
  GroceryListService,
} from '../../services/grocery-list.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

type GroceryCategory =
  | 'dairy'
  | 'fruit'
  | 'vegetable'
  | 'pastry'
  | 'meat'
  | 'fish'
  | 'finishedProduct'
  | 'seasoning'
  | 'candy'
  | 'beverages'
  | 'other';

type GroceryListEntry = GroceryList['items'][number];

interface GrocerySection {
  category: GroceryCategory;
  items: GroceryListEntry[];
}

@Component({
  selector: 'app-grocery-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './grocery-list.component.html',
  styleUrl: './grocery-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroceryListComponent {
  private readonly dialog = inject(MatDialog);
  public readonly groceryListService = inject(GroceryListService);

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

  public lists = signal<GroceryList[]>([]);
  public readonly selectedFilter = signal<'all' | GroceryCategory>('all');
  public readonly checkedItems = signal<Record<string, boolean>>({});
  public readonly quickAddControl = new FormControl('', { nonNullable: true });

  public readonly activeList = computed(() => this.lists().at(0));

  public readonly allItems = computed(() => this.activeList()?.items ?? []);

  public readonly availableFilters = computed(() => {
    const categories = new Set(
      this.allItems().map((item) => this.getItemCategory(item))
    );

    return this.categoryOrder.filter((category) => categories.has(category));
  });

  public readonly sections = computed<GrocerySection[]>(() => {
    const grouped = new Map<GroceryCategory, GroceryListEntry[]>();
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
        items: grouped.get(category) ?? [],
      }));
  });

  public readonly totalCount = computed(() => this.allItems().length);

  public readonly checkedCount = computed(
    () => this.allItems().filter((item) => this.isItemChecked(item)).length
  );

  public readonly progressPercent = computed(() => {
    const totalCount = this.totalCount();
    if (!totalCount) {
      return 0;
    }

    return (this.checkedCount() / totalCount) * 100;
  });

  constructor() {
    this.groceryListService.getLists().subscribe((lists) => {
      this.lists.set(lists);
      this.checkedItems.set(
        lists
          .at(0)
          ?.items.reduce((state: Record<string, boolean>, item: GroceryListEntry) => {
            const key = this.itemKey(item);
            state[key] = this.checkedItems()[key] ?? item.checked;
            return state;
          }, {}) ?? {}
      );
    });
  }

  public itemKey(item: GroceryListEntry) {
    return `${item.name}-${item.unit}-${this.getItemCategory(item)}`
      .toLowerCase()
      .replace(/\s+/g, '-');
  }

  public onAddList() {
    this.dialog.open(EditGroceryListModalComponent);
  }

  public selectFilter(filter: 'all' | GroceryCategory) {
    this.selectedFilter.set(filter);
  }

  public isItemChecked(item: GroceryListEntry) {
    return this.checkedItems()[this.itemKey(item)] ?? item.checked;
  }

  public toggleItem(item: GroceryListEntry) {
    const key = this.itemKey(item);
    this.checkedItems.update((checkedItems) => ({
      ...checkedItems,
      [key]: !(checkedItems[key] ?? item.checked),
    }));
  }

  public formatAmount(item: GroceryListEntry) {
    if (!item.unit) {
      return `${item.amount}`;
    }

    return `${item.amount} ${item.unit}`;
  }

  public formatName(item: GroceryListEntry) {
    if (!item.unit) {
      return (
        item.recipeIngredient?.originalNamePlural ||
        item.recipeIngredient?.ingredient.plural ||
        item.name
      );
    }

    return item.recipeIngredient?.originalName || item.name;
  }

  public onQuickAdd() {
    const name = this.quickAddControl.value.trim();
    if (!name) {
      return;
    }

    const timestamp = Date.now();
    const newItem: GroceryListEntry = {
      name,
      unit: '',
      amount: 1,
      checked: false,
      recipeIngredient: {
        id: timestamp,
        originalName: name,
        originalNamePlural: `${name}s`,
        amount: 1,
        ingredient: {
          id: `${timestamp}`,
          plural: `${name}s`,
          category: 'other',
        },
        createdDate: new Date(),
      },
    };

    this.lists.update((lists) => {
      const firstList = lists.at(0) ?? this.createLocalList();
      const nextFirstList: GroceryList = {
        ...firstList,
        items: [...firstList.items, newItem],
      };

      if (!lists.length) {
        return [nextFirstList];
      }

      return [nextFirstList, ...lists.slice(1)];
    });

    this.checkedItems.update((checkedItems) => ({
      ...checkedItems,
      [this.itemKey(newItem)]: false,
    }));
    this.quickAddControl.setValue('');
  }

  private getItemCategory(item: GroceryListEntry): GroceryCategory {
    const category = item.recipeIngredient?.ingredient.category;
    if (category === 'fisch') {
      return 'fish';
    }

    if (this.categoryOrder.includes(category as GroceryCategory)) {
      return category as GroceryCategory;
    }

    return 'other';
  }

  private createLocalList(): GroceryList {
    const now = new Date().toISOString();

    return {
      createDate: now,
      householdId: 0,
      id: 0,
      name: 'Shopping List',
      plannedDate: now,
      updateDate: now,
      userId: 0,
      items: [],
    };
  }
}
