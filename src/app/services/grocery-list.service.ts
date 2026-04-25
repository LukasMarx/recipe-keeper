import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Ingredient, RecipeIngredient } from '../interfaces/ingredient';
import { TranslocoService } from '@jsverse/transloco';

export interface GroceryListEntry {
  id: number;
  name: string;
  unit?: string | null;
  amount: number;
  checked: boolean;
  recipeIngredient?: RecipeIngredient | null;
}

export interface GroceryListQuantity {
  amount: number | null;
  unit?: string | null;
}

export interface AggregatedGroceryListEntry {
  id: number;
  name: string;
  ingredientId?: Ingredient['id'] | null;
  ingredient?: Ingredient | null;
  checked: boolean;
  partiallyChecked: boolean;
  itemCount: number;
  itemIds: number[];
  scheduledRecipeIds: number[];
  recipeIngredientIds: number[];
  quantities: GroceryListQuantity[];
  quantityLabel?: string | null;
  amount: number | null;
  unit?: string | null;
}

export interface GroceryList {
  createDate: string;
  householdId: number;
  id: number;
  name: string;
  plannedDate?: string | null;
  status?: 'ACTIVE' | 'ARCHIVED';
  updateDate: string;
  userId?: number;
  archivedDate?: string | null;
  completedDate?: string | null;
  items: GroceryListEntry[];
  aggregatedItems: AggregatedGroceryListEntry[];
}

export interface GroceryListArchiveQuery {
  householdId?: number | null;
  limit?: number;
  offset?: number;
}

export interface CompleteGroceryListResponse {
  archivedList: GroceryList;
  activeList: GroceryList;
}

export interface CreateManualGroceryListItemDto {
  householdId?: number | null;
  name: string;
  ingredientId?: Ingredient['id'];
  unit?: string;
  amount: number;
}

export interface UpdateGroceryListItemDto {
  name?: string;
  unit?: string;
  amount?: number;
  checked?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class GroceryListService {
  private readonly http = inject(HttpClient);
  private readonly translocoService = inject(TranslocoService);

  constructor() {}

  public getActiveList(householdId?: number | null) {
    return this.http.get<GroceryList>('grocery-list', {
      params: this.buildParams({
        householdId,
        locale: this.translocoService.getActiveLang(),
      }),
    }).pipe(map((list) => this.normalizeList(list)));
  }

  public resolveActiveList(input: { householdId?: number | null; name?: string }) {
    return this.http
      .post<GroceryList>('grocery-list', input)
      .pipe(map((list) => this.normalizeList(list)));
  }

  public getArchivedLists(query: GroceryListArchiveQuery = {}) {
    return this.http.get<GroceryList[]>('grocery-list/archive', {
      params: this.buildParams({
        householdId: query.householdId,
        limit: query.limit,
        locale: this.translocoService.getActiveLang(),
        offset: query.offset,
      }),
    }).pipe(map((lists) => lists.map((list) => this.normalizeList(list))));
  }

  public getListById(id: number) {
    return this.http
      .get<GroceryList>(`grocery-list/${id}`, {
        params: this.buildParams({ locale: this.translocoService.getActiveLang() }),
      })
      .pipe(map((list) => this.normalizeList(list)));
  }

  public renameList(id: number, list: { name?: string }) {
    return this.http
      .put<GroceryList>(`grocery-list/${id}`, list)
      .pipe(map((updatedList) => this.normalizeList(updatedList)));
  }

  public deleteArchivedList(id: number) {
    return this.http.delete(`grocery-list/${id}`);
  }

  public completeActiveList(input: {
    householdId?: number | null;
    nextListName?: string;
  }) {
    return this.http.post<CompleteGroceryListResponse>(
      'grocery-list/complete',
      input
    ).pipe(
      map(({ activeList, archivedList }) => ({
        activeList: this.normalizeList(activeList),
        archivedList: this.normalizeList(archivedList),
      }))
    );
  }

  public addManualItem(input: CreateManualGroceryListItemDto) {
    return this.http.post<GroceryListEntry>('grocery-list/items', input);
  }

  public updateItem(itemId: number, input: UpdateGroceryListItemDto) {
    return this.http.put<GroceryListEntry>(`grocery-list/items/${itemId}`, input);
  }

  public deleteItem(itemId: number) {
    return this.http.delete(`grocery-list/items/${itemId}`);
  }

  public getCatergoryLabel(category: string) {
    return {
      dairy: this.translocoService.selectTranslate(
        'groceryList.categories.dairy'
      ),
      fruit: this.translocoService.selectTranslate(
        'groceryList.categories.fruit'
      ),
      vegetable: this.translocoService.selectTranslate(
        'groceryList.categories.vegetable'
      ),
      pastry: this.translocoService.selectTranslate(
        'groceryList.categories.pastry'
      ),
      meat: this.translocoService.selectTranslate(
        'groceryList.categories.meat'
      ),
      fish: this.translocoService.selectTranslate(
        'groceryList.categories.fish'
      ),
      finishedProduct: this.translocoService.selectTranslate(
        'groceryList.categories.finishedProduct'
      ),
      seasoning: this.translocoService.selectTranslate(
        'groceryList.categories.seasoning'
      ),
      candy: this.translocoService.selectTranslate(
        'groceryList.categories.candy'
      ),
      beverages: this.translocoService.selectTranslate(
        'groceryList.categories.beverages'
      ),
      other: this.translocoService.selectTranslate(
        'groceryList.categories.other'
      ),
    }[category];
  }

  public getCategoryIcon(category: string) {
    return {
      dairy: 'local_drink',
      fruit: 'nutrition',
      vegetable: 'eco',
      pastry: 'bakery_dining',
      meat: 'lunch_dining',
      fish: 'set_meal',
      finishedProduct: 'takeout_dining',
      seasoning: 'grain',
      candy: 'icecream',
      beverages: 'local_bar',
      other: 'category',
    }[category] || 'category';
  }

  private buildParams(
    params: Record<string, string | number | null | undefined>
  ) {
    let httpParams = new HttpParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }

      httpParams = httpParams.set(key, String(value));
    });

    return httpParams;
  }

  private normalizeList(list: GroceryList): GroceryList {
    const items = list.items ?? [];
    const aggregatedItems =
      list.aggregatedItems?.length
        ? list.aggregatedItems.map((item) => this.normalizeAggregatedItem(item, items))
        : items.map((item) => this.createFallbackAggregatedItem(item));

    return {
      ...list,
      items,
      aggregatedItems,
    };
  }

  private normalizeAggregatedItem(
    item: AggregatedGroceryListEntry,
    items: GroceryListEntry[]
  ): AggregatedGroceryListEntry {
    const itemIds = item.itemIds?.length ? item.itemIds : [];
    const fallbackItem =
      items.find((rawItem) => itemIds.includes(rawItem.id)) ??
      items.find(
        (rawItem) =>
          rawItem.recipeIngredient?.ingredient.id === item.ingredientId
      ) ??
      null;
    const ingredient = item.ingredient ?? fallbackItem?.recipeIngredient?.ingredient ?? null;

    return {
      ...item,
      ingredient,
      ingredientId: item.ingredientId ?? ingredient?.id ?? null,
      checked: Boolean(item.checked),
      partiallyChecked: Boolean(item.partiallyChecked),
      itemCount: (item.itemCount ?? itemIds.length) || 1,
      itemIds,
      scheduledRecipeIds: item.scheduledRecipeIds ?? [],
      recipeIngredientIds: item.recipeIngredientIds ?? [],
      quantities: item.quantities ?? [],
      quantityLabel:
        item.quantityLabel ?? this.formatQuantityLabel(item.amount, item.unit),
      amount: item.amount ?? null,
      unit: item.unit ?? null,
    };
  }

  private createFallbackAggregatedItem(
    item: GroceryListEntry
  ): AggregatedGroceryListEntry {
    return {
      id: item.id,
      name: item.name,
      ingredient: item.recipeIngredient?.ingredient ?? null,
      ingredientId: item.recipeIngredient?.ingredient.id ?? null,
      checked: item.checked,
      partiallyChecked: false,
      itemCount: 1,
      itemIds: [item.id],
      scheduledRecipeIds: [],
      recipeIngredientIds: item.recipeIngredient ? [item.recipeIngredient.id] : [],
      quantities: [
        {
          amount: item.amount,
          unit: item.unit ?? null,
        },
      ],
      quantityLabel: this.formatQuantityLabel(item.amount, item.unit),
      amount: item.amount,
      unit: item.unit ?? null,
    };
  }

  private formatQuantityLabel(
    amount: number | null | undefined,
    unit: string | null | undefined
  ) {
    if (amount === null || amount === undefined) {
      return null;
    }

    return unit ? `${amount} ${unit}` : `${amount}`;
  }
}
