import { RecipeIngredient } from './ingredient';
import { Instruction, RawInstruction } from './instruction';

export type RecipeStatus = 'IMPORTING' | 'ENRICHING' | 'READY' | 'FAILED';

export type RecipeImportTaskType =
  | 'PARSE_INGREDIENTS'
  | 'ENHANCE_INSTRUCTIONS'
  | 'GENERATE_NUTRITION'
  | 'GENERATE_INGREDIENT_IMAGE';

export type RecipeImportTaskStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export interface RecipeStatusEvent {
  recipeId: number;
  status: RecipeStatus;
}

export interface RecipeTaskStatusEvent {
  taskId: string | number;
  type: RecipeImportTaskType;
  status: RecipeImportTaskStatus;
  recipeId?: number;
  result?: unknown;
  error?: string | null;
}

export interface RecipeImportTask extends RecipeTaskStatusEvent {
  recipeId: number;
}

export interface Recipe {
  id: number;
  title: string;
  description: string;
  userId: number;
  imageUrl: string;
  ingredients: string[];
  instructions: Array<Instruction | RawInstruction | string>;
  prepTime?: number | null;
  cookTime?: number | null;
  totalTime?: number | null;
  recipeYield: number;
  portions?: number;
  sourceUrl?: string | null;
  createDate?: Date | string;
  updateDate?: Date | string;
  videoUrl?: string | null;
  videoThumbnailUrl?: string | null;
  keywords: string[];
  calories?: number | null;
  ingredientsList: RecipeIngredient[];
  status: RecipeStatus;
  importTasks?: RecipeImportTask[];
  importFailureMessage?: string | null;
}
