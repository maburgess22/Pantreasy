// utils/types.ts

export interface PantryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  track_low_stock?: boolean;
  low_stock_threshold?: number;
  user_id?: string;
}

export interface Recipe {
  id: string;
  title: string;
  category: string;
  cook_time: string;
  ingredients: string[];
  instructions?: string[];
  image?: string;
  source_url?: string;
  portions?: number;
  user_id?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
  quantity?: number;
  unit?: string;
  user_id?: string;
}

export interface MealPlanItem {
  id: string;
  date: string;
  meal_type: string;
  recipe_id?: string;
  manual_name?: string;
  portions: number;
  recipes?: { title: string; image?: string; cook_time?: string; category?: string };
  user_id?: string;
}