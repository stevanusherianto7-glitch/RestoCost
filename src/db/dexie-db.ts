import Dexie, { type Table } from 'dexie';
import { Ingredient, Employee, Recipe, RecipeItem } from '../types';

export class RestoCostDatabase extends Dexie {
  ingredients!: Table<Ingredient>;
  employees!: Table<Employee>;
  recipes!: Table<Recipe>;
  recipeItems!: Table<RecipeItem>;

  constructor() {
    super('RestoCostDB');
    this.version(1).stores({
      ingredients: '++id, name, category',
      employees: '++id, name, position',
      recipes: '++id, name',
      recipeItems: '++id, recipe_id, ingredient_id'
    });
  }
}

export const db = new RestoCostDatabase();

// Seed initial data if empty
db.on('populate', () => {
  db.ingredients.add({
    name: 'Bahan Contoh (Offline)',
    category: 'perishable',
    buy_price: 0,
    buy_unit: 'kg',
    conversion_qty: 1,
    usage_unit: 'kg'
  } as Ingredient);
});
