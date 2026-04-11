import { Recipe, Ingredient } from '../types';

export interface CalculationResult {
  rawMaterialCost: number;
  packagingCost: number;
  bufferCost: number;
  totalHPP: number; // Pure COGS
  totalOperationalCost: number; // OPEX (labor + overhead)
  primeCost: number; // For some businesses, totalHPP + OPEX, we separate it
  grossProfit: number;
  netProfit: number;
  currentMargin: number; // Gross Margin
  currentNetMargin: number; // Net Margin 
  foodCostPercentage: number;
  serviceNominal: number;
  taxNominal: number;
  finalCustomerPrice: number;
  recommendedPrice: number;
}

export const calculateHPP = (recipe: Recipe, ingredients: Ingredient[]): CalculationResult => {
  let rawMaterialCost = 0;
  let packagingCost = 0;

  recipe.items.forEach(item => {
    const ing = ingredients.find(i => i.id === item.ingredient_id);
    if (ing && ing.conversion_qty > 0) {
      const costPerUnit = ing.buy_price / ing.conversion_qty;
      const subtotal = costPerUnit * item.amount;
      if (ing.category === 'supplies') {
        packagingCost += subtotal;
      } else {
        rawMaterialCost += subtotal;
      }
    }
  });

  const bufferCost = (rawMaterialCost + packagingCost) * ((recipe.buffer_percentage || 0) / 100);
  
  // Total HPP (Cost Of Goods Sold) ONLY includes Raw Materials, Packaging, and Waste Buffer.
  const totalHPP = rawMaterialCost + packagingCost + bufferCost;
  
  // Operational Cost (OPEX)
  const totalOperationalCost = (recipe.labor_cost || 0) + (recipe.overhead_cost || 0);

  const primeCost = rawMaterialCost + packagingCost + (recipe.labor_cost || 0);
  
  // Recommended Price is based ONLY on COGS and Target Margin !!
  const targetMargin = recipe.target_margin || 65; 
  let recommendedPrice = 0;
  
  if (targetMargin < 100) {
    // Standard Gross Margin Logic
    recommendedPrice = totalHPP / (1 - (targetMargin / 100));
  } else {
    // Cost-Plus (Markup) Logic for targets >= 100%
    // Price = Cost + (Margin% * Cost)
    recommendedPrice = totalHPP * (1 + (targetMargin / 100));
  }

  // Actual Margins & Costs based on user's selected Selling Price
  const sp = recipe.selling_price || 0;
  
  const grossProfit = sp - totalHPP;
  const netProfit = grossProfit - totalOperationalCost;
  
  const currentMargin = sp > 0 ? (grossProfit / sp) * 100 : 0;
  const currentNetMargin = sp > 0 ? (netProfit / sp) * 100 : 0;
  const foodCostPercentage = sp > 0 ? (totalHPP / sp) * 100 : 0;

  return {
    rawMaterialCost,
    packagingCost,
    bufferCost,
    totalHPP,
    totalOperationalCost,
    primeCost,
    grossProfit,
    netProfit,
    currentMargin,
    currentNetMargin,
    foodCostPercentage,
    recommendedPrice,
    serviceNominal: sp * ((recipe.service_percentage || 0) / 100),
    taxNominal: sp * ((recipe.tax_percentage || 0) / 100),
    finalCustomerPrice: sp 
  };
};
