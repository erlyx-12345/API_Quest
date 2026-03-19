import { Meal } from '../_types';
import { getSafeImageUri } from './_utils';

const API_BASE = 'https://www.themealdb.com/api/json/v1/1';

export class RecipeService {
  static async fetchCategoryMeals(category: string): Promise<Meal[]> {
    try {
      const response = await fetch(`${API_BASE}/filter.php?c=${encodeURIComponent(category)}`);
      if (!response.ok) {
        console.warn(`Category fetch failed for ${category}: ${response.status} ${response.statusText}`);
        return [];
      }

      const json = await response.json();
      if (!json.meals) return [];

      const limitedMeals = json.meals.slice(0, 12);
      return limitedMeals.map((item: any) => ({
        idMeal: item.idMeal,
        strMeal: item.strMeal,
        strMealThumb: getSafeImageUri(item.strMealThumb),
        strCategory: category,
        strArea: '',
        strInstructions: '',
      }));
    } catch (error) {
      console.warn(`Error fetching category ${category}:`, error);
      return [];
    }
  }

  static async fetchMeals(query = ''): Promise<Meal[]> {
    if (!query.trim()) {
      const fallbackCategories = ['Beef', 'Chicken', 'Dessert', 'Lamb', 'Pasta', 'Pork', 'Seafood', 'Side', 'Vegan', 'Vegetarian'];
      let categoryCandidates = fallbackCategories;

      try {
        const categoryResponse = await fetch(`${API_BASE}/list.php?c=list`);
        if (categoryResponse.ok) {
          const categoryJson = await categoryResponse.json();
          if (Array.isArray(categoryJson.meals)) {
            categoryCandidates = categoryJson.meals
              .map((item: any) => (item?.strCategory || '').trim())
              .filter((cat: string) => !!cat);
          }
        } else {
          console.warn(`Category listing fetch failed: ${categoryResponse.status}`);
        }
      } catch (catListError) {
        console.warn('Could not fetch category list, using fallback categories', catListError);
      }

      const categorySet = new Set<string>(categoryCandidates);
      fallbackCategories.forEach((cat) => categorySet.add(cat));
      const allCategories = Array.from(categorySet).sort((a, b) => a.localeCompare(b));

      const allMeals: Meal[] = [];
      for (const cat of allCategories) {
        const categoryMeals = await RecipeService.fetchCategoryMeals(cat);
        allMeals.push(...categoryMeals);
        await new Promise((resolve) => setTimeout(resolve, 80));
      }

      const deduped = Object.values(allMeals.reduce<Record<string, Meal>>((acc, m) => {
        if (m && m.idMeal && !acc[m.idMeal]) acc[m.idMeal] = m;
        return acc;
      }, {}));

      return deduped;
    }

    try {
      const response = await fetch(`${API_BASE}/search.php?s=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Network response not ok');

      const json = await response.json();
      if (!json.meals) return [];

      return json.meals.map((item: any) => ({
        idMeal: item.idMeal,
        strMeal: item.strMeal,
        strMealThumb: getSafeImageUri(item.strMealThumb),
        strCategory: item.strCategory || '',
        strArea: item.strArea || '',
        strInstructions: item.strInstructions || '',
        ...item,
      }));
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async fetchMealDetail(idMeal: string): Promise<Meal | null> {
    try {
      const detailRes = await fetch(`${API_BASE}/lookup.php?i=${idMeal}`);
      if (!detailRes.ok) return null;
      const detailJson = await detailRes.json();
      const detailedMeal: Meal | undefined = detailJson.meals?.[0];
      if (!detailedMeal) return null;
      return {
        ...detailedMeal,
        strMealThumb: getSafeImageUri(detailedMeal.strMealThumb),
      };
    } catch (error) {
      console.warn(`Detail fetch failed for ${idMeal}:`, error);
      return null;
    }
  }
}

export default function ApiRoute() {
  return null;
};
