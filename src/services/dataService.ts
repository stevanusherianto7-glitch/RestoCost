import { db } from '../db/dexie-db';
import { Ingredient, Employee, Recipe, RecipeItem } from '../types';

export class DataService {
  // Ingredients
  static async getIngredients(): Promise<Ingredient[]> {
    return await db.ingredients.orderBy('name').toArray();
  }

  static async saveIngredient(ingredient: Omit<Ingredient, 'id'> & { id?: number }): Promise<number> {
    if (ingredient.id) {
      await db.ingredients.update(ingredient.id, ingredient);
      return ingredient.id;
    }
    return (await db.ingredients.add(ingredient as Ingredient)) as number;
  }

  static async deleteIngredient(id: number): Promise<void> {
    // Check if used in recipes
    const inUse = await db.recipeItems.where('ingredient_id').equals(id).count();
    if (inUse > 0) throw new Error("Cannot delete ingredient currently in use.");
    await db.ingredients.delete(id);
  }

  // Employees
  static async getEmployees(): Promise<Employee[]> {
    return await db.employees.orderBy('name').toArray();
  }

  static async saveEmployee(employee: Omit<Employee, 'id'> & { id?: number }): Promise<number> {
    if (employee.id) {
      await db.employees.update(employee.id, employee);
      return employee.id;
    }
    return (await db.employees.add(employee as Employee)) as number;
  }

  static async deleteEmployee(id: number): Promise<void> {
    await db.employees.delete(id);
  }

  // Recipes
  static async getRecipes(): Promise<Recipe[]> {
    return await db.recipes.orderBy('name').toArray();
  }

  static async getRecipe(id: number): Promise<Recipe & { items: RecipeItem[] }> {
    const recipe = await db.recipes.get(id);
    if (!recipe) throw new Error("Recipe not found");
    const items = await db.recipeItems.where('recipe_id').equals(id).toArray();
    
    // Join with ingredient names
    const enrichedItems = await Promise.all(items.map(async (item) => {
      const ing = await db.ingredients.get(item.ingredient_id);
      return {
        ...item,
        ingredient_name: ing?.name,
        buy_price: ing?.buy_price,
        conversion_qty: ing?.conversion_qty,
        usage_unit: ing?.usage_unit,
        category: ing?.category
      };
    }));

    return { ...recipe, items: enrichedItems };
  }

  static async saveRecipe(recipeData: any): Promise<number> {
    const { items, ...recipe } = recipeData;
    
    return await db.transaction('rw', db.recipes, db.recipeItems, async () => {
      let recipeId = recipe.id;
      if (recipeId) {
        await db.recipes.update(recipeId, recipe);
        // Clear existing items
        await db.recipeItems.where('recipe_id').equals(recipeId).delete();
      } else {
        recipeId = (await db.recipes.add(recipe as Recipe)) as number;
      }

      // Add new items
      const itemPromises = items.map((item: any) => 
        db.recipeItems.add({
          recipe_id: recipeId,
          ingredient_id: item.ingredient_id,
          amount: item.amount
        } as RecipeItem)
      );
      await Promise.all(itemPromises);
      
      return recipeId;
    });
  }

  static async deleteRecipe(id: number): Promise<void> {
    await db.transaction('rw', db.recipes, db.recipeItems, async () => {
      await db.recipes.delete(id);
      await db.recipeItems.where('recipe_id').equals(id).delete();
    });
  }
}
