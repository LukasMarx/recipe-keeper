export type GroceryListItem = SimpleGroceryListItem | CombinedGroceryListItem;

export interface SimpleGroceryListItem {
  id: number;
  name: string;
  unit: string;
  amount: number;
  checked: boolean;
}

export interface CombinedGroceryListItem {
  name: string;
  unit: string;
  amount: number;
  checked: boolean;
  items: GroceryListItem[];
}
