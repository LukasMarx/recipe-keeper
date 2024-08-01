export interface RecipeIngredient {
  id: number;
  originalName: string;
  originalNamePlural: string;
  unit?: string;
  amount: number;
  isNegligible?: boolean;
  usage?: string;
  ingredient: Ingredient;
  createdDate: Date;
}
export interface Ingredient {
  id: string;
  plural: string;
  category:
    | 'fruit'
    | 'vegetable'
    | 'pastry'
    | 'dairy'
    | 'meat'
    | 'fisch'
    | 'finishedProduct'
    | 'seasoning'
    | 'candy'
    | 'beverages'
    | 'other';
}
