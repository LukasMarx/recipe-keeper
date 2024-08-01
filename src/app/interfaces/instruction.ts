import { Ingredient, RecipeIngredient } from './ingredient';

export interface Instruction {
  title: string;
  description: string;
  ingredients: RecipeIngredient[];
}

export interface RawInstruction {
  title: string;
  description: string;
  ingredients: string[];
}
