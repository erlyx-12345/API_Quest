import { Meal } from '../_types';

export const colors = {
  background: '#FDF8F0',
  green: '#1BBF3E',
  orange: '#F58C00',
  dark: '#1A1A1A',
  gray: '#777',
  card: '#FFFFFF',
};

export const getSafeImageUri = (uri?: string) => {
  const placeholder = 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1400&q=80';
  if (!uri || typeof uri !== 'string') return placeholder;
  const trimmed = uri.trim();
  if (!trimmed) return placeholder;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return placeholder;
};

export const abbreviateMeasure = (measure: string): string => {
  if (!measure) return '';
  const abbrevMap: Record<string, string> = {
    tablespoon: 'tbsp',
    tablespoons: 'tbsp',
    tbsp: 'tbsp',
    teaspoon: 'tsp',
    teaspoons: 'tsp',
    tsp: 'tsp',
    cup: 'c',
    cups: 'c',
    ounce: 'oz',
    ounces: 'oz',
    oz: 'oz',
    gram: 'g',
    grams: 'g',
    milliliter: 'ml',
    milliliters: 'ml',
    ml: 'ml',
    liter: 'l',
    liters: 'l',
    pound: 'lb',
    pounds: 'lb',
    lb: 'lb',
    pinch: 'pinch',
    dash: 'dash',
    'to taste': 'to taste',
    'as needed': 'as needed',
    'as required': 'as required',
  };

  const lower = measure.toLowerCase().trim();
  for (const [key, value] of Object.entries(abbrevMap)) {
    if (lower === key || lower.startsWith(key.split(' ')[0])) {
      const numberMatch = measure.match(/^([\d./\s]+)/);
      if (numberMatch) {
        return `${numberMatch[1].trim()} ${value}`;
      }
      return value;
    }
  }
  return measure;
};

export const getIngredientList = (meal: Meal) => {
  const list: { ingredient: string; measure: string }[] = [];
  const seenIngredients = new Set<string>();

  for (let i = 1; i <= 20; i++) {
    const ingredient = (meal[`strIngredient${i}` as const] || '').trim();
    let measure = (meal[`strMeasure${i}` as const] || '').trim();

    if (!ingredient || ingredient.toLowerCase() === 'null') continue;
    if (ingredient.trim().length === 0) continue;

    const ingredientKey = ingredient.toLowerCase();
    if (seenIngredients.has(ingredientKey)) continue;
    seenIngredients.add(ingredientKey);

    if (!measure || measure.toLowerCase() === 'null') {
      measure = '';
    } else if (/^\s*(?:as required|as needed|as|to taste)\s*$/i.test(measure)) {
      measure = 'to taste';
    }

    list.push({ ingredient, measure });
  }

  return list;
};

export const dedupeMeals = (meals: Meal[]) => {
  const byId: Record<string, Meal> = {};
  meals.forEach((meal) => {
    if (meal && meal.idMeal && !byId[meal.idMeal]) {
      byId[meal.idMeal] = meal;
    }
  });
  return Object.values(byId);
};

export const getIngredientsFromMeal = (meal: Meal) => {
  return getIngredientList(meal);
};

export const filterMealsByCategory = (meals: Meal[], category: string) => {
  if (category === 'All') return meals;
  return meals.filter((meal) => meal.strCategory === category);
};

export const sortMeals = (meals: Meal[], sortOption: 'name' | 'rating', ratings: Record<string, number>) => {
  return [...meals].sort((a, b) => {
    if (sortOption === 'rating') {
      return (ratings[b.idMeal] || 0) - (ratings[a.idMeal] || 0) || a.strMeal.localeCompare(b.strMeal);
    }
    return a.strMeal.localeCompare(b.strMeal);
  });
};

export const getInstructionSteps = (instructions: string) => {
  if (!instructions) return [];
  const normalizedText = instructions
    .replace(/\r\n/g, '\n')
    .replace(/[\u00A0\t\r]+/g, ' ')
    .replace(/ +/g, ' ')
    .trim();

  const lines = normalizedText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      let text = line;
      text = text.replace(/^\s*(?:STEP|Step)\s*\d+\s*(?:[:.)\-]\s*)?/i, '');
      text = text.replace(/^\s*\d+\s*(?:[:.)\-]\s*)?/i, '');
      return text.trim();
    })
    .filter((text) => !!text)
    .filter((line) => !/^(?:Nutrition Facts)$/i.test(line))
    .filter((line) => !/^[0-9]+\s*(?:calories|g|mg|kcal)\b/i.test(line))
    .filter((line) => !/^(?:steps?\s+for|step\s+for|tools?|utensils?|equipment|time|yield|servings?)\b/i.test(line))
    .filter((line) => !/^[\s\W]*$/i.test(line))
    .filter((line) => !/^\d+\s*$/i.test(line));

  const deduped: string[] = [];
  lines.forEach((line) => {
    const cleanLine = line.trim().replace(/\s+/g, ' ').toLowerCase();
    if (!cleanLine) return;
    if (deduped.some((item) => item.trim().replace(/\s+/g, ' ').toLowerCase() === cleanLine)) return;
    deduped.push(line);
  });

  return deduped;
};

// `utils.ts` is a utility module; provide default export to match router route requirement.
export default function UtilsRoute() {
  return null;
};
