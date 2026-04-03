export type IngredientCategory = 
  | 'perishable' 
  | 'dry_goods' 
  | 'condiment' 
  | 'processed' 
  | 'supplies';

export interface Ingredient {
  id: number;
  name: string;
  category: IngredientCategory;
  buy_price: number;
  buy_unit: string;
  conversion_qty: number;
  usage_unit: string;
}

export interface RecipeItem {
  id?: number;
  recipe_id?: number;
  ingredient_id: number;
  amount: number;
  ingredient_name?: string;
  buy_price?: number;
  conversion_qty?: number;
  usage_unit?: string;
  category?: IngredientCategory;
}

export interface Recipe {
  id: number;
  name: string;
  image_url?: string;
  buffer_percentage: number;
  labor_cost: number;
  overhead_cost: number;
  overhead_electricity: number;
  overhead_water_gas: number;
  overhead_internet: number;
  overhead_rent: number;
  overhead_cleaning: number;
  overhead_non_prod_salary: number;
  selling_price: number;
  tax_percentage: number;
  service_percentage: number;
  items: RecipeItem[];
}
