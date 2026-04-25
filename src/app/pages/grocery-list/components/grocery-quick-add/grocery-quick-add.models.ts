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
  | 'other';

export interface QuickAddSuggestion {
  key: string;
  name: string;
  id: string;
  category: GroceryCategory;
  imageUrl: string | null;
}

export interface SuggestionPart {
  text: string;
  match: boolean;
}