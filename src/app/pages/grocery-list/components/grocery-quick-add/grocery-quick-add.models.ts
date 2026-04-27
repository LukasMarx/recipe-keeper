export type GroceryCategory =
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
  | 'household'
  | 'hygiene'
  | 'other';

export interface QuickAddSuggestion {
  key: string;
  name: string;
  /** Ingredient ID — null for custom-item suggestions */
  id: string | null;
  category: GroceryCategory;
  imageUrl: string | null;
  /** Custom-item catalogue ID — null for ingredient suggestions */
  customItemId: number | null;
}

export interface SuggestionPart {
  text: string;
  match: boolean;
}