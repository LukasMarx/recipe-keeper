export interface Recipe {
  id: number;
  title: string;
  description: string;
  userId: number;
  imageUrl: string;
  ingredients: string[];
  instructions: any[];
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  recipeYield: number;
  sourceUrl?: string;
  createDate: Date;
  updateDate: Date;
  videoUrl?: string;
  videoThumbnailUrl?: string;
  keywords: string[];
  calories?: number;
  ingredientsList: any[];
}
