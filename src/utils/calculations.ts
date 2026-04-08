import { Recipe, Ingredient } from '../types';

export interface CalculationResult {
  rawMaterialCost: number;
  packagingCost: number;
  primeCost: number;
  bufferCost: number;
  totalHPP: number;
  grossProfit: number;
  margin: number;
  foodCostPercentage: number;
  serviceNominal: number;
  taxNominal: number;
  finalCustomerPrice: number;
  recommendedPrice: number;
  currentMargin: number; // Added for HPPAnalysisBar compatibility
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

  const bufferCost = (rawMaterialCost + packagingCost) * (recipe.buffer_percentage / 100);
  const primeCost = rawMaterialCost + packagingCost + (recipe.labor_cost || 0);
  const totalHPP = primeCost + (recipe.overhead_cost || 0) + bufferCost;
  
  const recommendedPrice = recipe.buffer_percentage < 100 
    ? totalHPP / (1 - (recipe.buffer_percentage / 100))
    : totalHPP * 2;

  const currentMargin = recipe.selling_price > 0 
    ? ((recipe.selling_price - totalHPP) / recipe.selling_price) * 100
    : 0;

  const foodCostPercentage = recipe.selling_price > 0
    ? (totalHPP / recipe.selling_price) * 100
    : 0;

  return {
    rawMaterialCost,
    packagingCost,
    primeCost,
    bufferCost,
    totalHPP,
    recommendedPrice,
    currentMargin,
    foodCostPercentage,
    grossProfit: (recipe.selling_price || 0) - totalHPP,
    margin: currentMargin,
    serviceNominal: (recipe.selling_price || 0) * (recipe.service_percentage || 0) / 100,
    taxNominal: (recipe.selling_price || 0) * (recipe.tax_percentage || 0) / 100,
    finalCustomerPrice: (recipe.selling_price || 0) 
  };
};
