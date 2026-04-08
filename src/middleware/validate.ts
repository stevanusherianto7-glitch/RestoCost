import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const validate = (schema: z.ZodTypeAny) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: "Validation error",
        details: error.issues.map(e => ({ path: e.path, message: e.message }))
      });
    }
    next(error);
  }
};

export const ingredientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().optional(),
  buy_price: z.number().min(0, "Price must be non-negative"),
  buy_unit: z.string().min(1, "Buy unit is required"),
  conversion_qty: z.number().gt(0, "Conversion quantity must be greater than zero"),
  usage_unit: z.string().min(1, "Usage unit is required"),
});

export const employeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  position: z.string().optional(),
  salary: z.number().min(0, "Salary must be non-negative"),
});

export const recipeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  image_url: z.string().optional(),
  buffer_percentage: z.number().min(0).default(0),
  labor_cost: z.number().min(0).default(0),
  overhead_cost: z.number().min(0).default(0),
  overhead_electricity: z.number().min(0).default(0),
  overhead_water_gas: z.number().min(0).default(0),
  overhead_internet: z.number().min(0).default(0),
  overhead_rent: z.number().min(0).default(0),
  overhead_cleaning: z.number().min(0).default(0),
  overhead_non_prod_salary: z.number().min(0).default(0),
  selling_price: z.number().min(0).default(0),
  tax_percentage: z.number().min(0).default(0),
  service_percentage: z.number().min(0).default(0),
  target_portions: z.number().min(1).default(1),
  labor_cost_type: z.enum(['manual', 'auto']).default('manual'),
  items: z.array(z.object({
    ingredient_id: z.number(),
    amount: z.number().gt(0),
  })).min(1, "Recipe must have at least one ingredient"),
});
