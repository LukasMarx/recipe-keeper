import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { RecipeIngredient } from '../interfaces/ingredient';
import { TranslocoService } from '@jsverse/transloco';
import {
  GroceryListItem,
  SimpleGroceryListItem,
} from '../interfaces/grocery-list-item';
import { map } from 'rxjs';

export interface GroceryList {
  createDate: string;
  householdId: number;
  id: number;
  name: string;
  plannedDate: string;
  updateDate: string;
  userId: number;
  items: {
    name: string;
    unit: string;
    amount: number;
    checked: boolean;
    recipeIngredient: RecipeIngredient;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class GroceryListService {
  private readonly http = inject(HttpClient);
  private translocoService = inject(TranslocoService);

  constructor() {}

  public getLists() {
    return this.http.get<any[]>('grocery-list').pipe(
      map((list) => {
        return list.map((list) => {
          const newItems = this.combineItems(list.items);
          list.items = newItems;
          return list;
        });
      })
    );
  }

  public getListById(id: number) {
    return this.http.get(`grocery-list/${id}`);
  }

  public createList(list: any) {
    return this.http.post('grocery-list', list);
  }

  public updateList(id: number, list: any) {
    return this.http.put(`grocery-list/${id}`, list);
  }

  public deleteList(id: number) {
    return this.http.delete(`grocery-list/${id}`);
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

  private combineItems(items: SimpleGroceryListItem[]) {
    const combinedItems: GroceryListItem[] = [];
    items.forEach((item) => {
      const existingItem = combinedItems.find(
        (x) => x.name === item.name && x.unit === item.unit
      );
      if (existingItem) {
        existingItem.amount += item.amount;
      } else {
        combinedItems.push({ ...item, checked: false });
      }
    });

    return combinedItems;
  }
}
