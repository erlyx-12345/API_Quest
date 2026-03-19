export interface Meal {
  idMeal: string;
  strMeal: string;
  strMealThumb?: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  [key: `strIngredient${number}`]: string | null | undefined;
  [key: `strMeasure${number}`]: string | null | undefined;
}

export type ViewState = 'intro' | 'dashboard' | 'detail';

export default function TypesRoute() {
  return null;
};
