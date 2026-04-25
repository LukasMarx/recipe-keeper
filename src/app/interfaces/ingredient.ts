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
  displayName?: string;
  displayPlural?: string;
  displayLocale?: string;
  imageUrl?: string;
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

type IngredientDisplayValue = {
  id?: string | number | null;
  name?: string | null;
  plural?: string | null;
  originalName?: string | null;
  originalNamePlural?: string | null;
  displayName?: string | null;
  displayPlural?: string | null;
  ingredient?: Ingredient | null;
};

function firstNonBlank(
  ...values: Array<string | number | null | undefined>
): string | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return `${value}`;
    }

    if (typeof value === 'string') {
      const trimmedValue = value.trim();

      if (trimmedValue) {
        return trimmedValue;
      }
    }
  }

  return undefined;
}

export function getIngredientDisplayName(
  value: IngredientDisplayValue | null | undefined
) {
  return firstNonBlank(
    value?.displayName,
    value?.ingredient?.displayName,
    value?.originalName,
    value?.name,
    value?.id,
    value?.ingredient?.id
  );
}

export function getIngredientDisplayPlural(
  value: IngredientDisplayValue | null | undefined
) {
  return firstNonBlank(
    value?.displayPlural,
    value?.ingredient?.displayPlural,
    value?.originalNamePlural,
    value?.plural,
    value?.ingredient?.plural
  );
}
