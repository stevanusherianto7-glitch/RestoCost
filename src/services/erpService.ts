import { db } from '../db/dexie-db';
import { Ingredient, Recipe, Sale, Purchase, StockOpname } from '../types';
import { DataService } from './dataService';

export class ERPService {
  /**
   * Deducts stock based on a sale of a specific recipe.
   */
  static async processSale(recipeId: number, quantity: number): Promise<void> {
    const recipe = await DataService.getRecipe(recipeId);
    
    await db.transaction('rw', db.ingredients, db.sales, async () => {
      // 1. Record the sale
      await db.sales.add({
        recipe_id: recipeId,
        recipe_name: recipe.name,
        quantity: quantity,
        total_price: recipe.selling_price * quantity,
        date: new Date().toISOString(),
      });

      // 2. Deduct inventory for each ingredient in the recipe
      for (const item of recipe.items) {
        const ingredient = await db.ingredients.get(item.ingredient_id);
        if (!ingredient) continue;

        // Conversion logic:
        // amount is in usage_unit.
        // current_stock is in buy_unit.
        // conversion_qty is how many usage_units are in 1 buy_unit.
        // Example: 200g (usage) / 1000 (conversion) = 0.2kg (buy_unit deduction)
        
        const totalUsageInBuyUnit = (item.amount * quantity) / ingredient.conversion_qty;
        const newStock = (ingredient.current_stock || 0) - totalUsageInBuyUnit;

        await db.ingredients.update(ingredient.id, {
          current_stock: Number(newStock.toFixed(4)) // Avoid floating point issues
        });
      }
    });
  }

  /**
   * Batch process sales (Inventory Sync).
   */
  static async syncSales(salesData: { recipeId: number; quantity: number }[]): Promise<void> {
    for (const sale of salesData) {
      await this.processSale(sale.recipeId, sale.quantity);
    }
  }

  /**
   * Get ingredients below safety stock levels.
   */
  static async getLowStockAlerts(): Promise<Ingredient[]> {
    return await db.ingredients
      .filter(ing => (ing.current_stock || 0) <= (ing.safety_stock || 0))
      .toArray();
  }

  /**
   * Calculate Profit & Loss (Gross Profit).
   * Omzet - HPP (COGS).
   */
  static async calculateProfitLoss(startDate: Date, endDate: Date): Promise<{
    revenue: number;
    hpp: number;
    grossProfit: number;
    salesCount: number;
  }> {
    const sales = await db.sales
      .where('date')
      .between(startDate.toISOString(), endDate.toISOString())
      .toArray();

    let totalRevenue = 0;
    let totalHPP = 0;

    for (const sale of sales) {
      totalRevenue += sale.total_price;
      
      // Calculate HPP for this recipe at the time of sale
      // Note: In a real system, we'd store the HPP at the time of sale.
      // For now, we calculate it dynamically based on CURRENT ingredient prices.
      const recipe = await DataService.getRecipe(sale.recipe_id);
      const hppPerPortion = recipe.items.reduce((acc, item) => {
        const cost = (item.amount / (item.conversion_qty || 1)) * (item.buy_price || 0);
        return acc + cost;
      }, 0);
      
      totalHPP += hppPerPortion * sale.quantity;
    }

    return {
      revenue: totalRevenue,
      hpp: totalHPP,
      grossProfit: totalRevenue - totalHPP,
      salesCount: sales.length
    };
  }

  /**
   * Records a purchase and increases stock.
   */
  static async recordPurchase(purchase: Omit<Purchase, 'id'>): Promise<void> {
    await db.transaction('rw', db.ingredients, db.purchases, async () => {
      const ingredient = await db.ingredients.get(purchase.ingredient_id);
      if (!ingredient) throw new Error("Ingredient not found");

      await db.purchases.add(purchase);
      
      const newStock = (ingredient.current_stock || 0) + purchase.quantity;
      await db.ingredients.update(ingredient.id, {
        current_stock: Number(newStock.toFixed(4)),
        buy_price: purchase.unit_price // Update last buy price
      });
    });
  }

  /**
   * Stock Opname (Physical vs Theoretical).
   */
  static async performStockOpname(ingredientId: number, physicalQty: number): Promise<void> {
    const ingredient = await db.ingredients.get(ingredientId);
    if (!ingredient) throw new Error("Ingredient not found");

    const theoreticalQty = ingredient.current_stock || 0;
    const variance = physicalQty - theoreticalQty;

    await db.transaction('rw', db.ingredients, db.stockOpnames, async () => {
      await db.stockOpnames.add({
        ingredient_id: ingredientId,
        ingredient_name: ingredient.name,
        physical_qty: physicalQty,
        theoretical_qty: theoreticalQty,
        variance: variance,
        date: new Date().toISOString(),
      });

      // Adjust stock to match physical reality
      await db.ingredients.update(ingredientId, {
        current_stock: physicalQty
      });
    });
  }
}
