import express from "express";
import { createServer as createViteServer } from "vite";
import { initDb } from "./src/db";
import db from "./src/db";
import { validate, ingredientSchema, employeeSchema, recipeSchema } from "./src/middleware/validate";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Initialize Database
  initDb();

  // Simple Auth Middleware
  const authMiddleware = (req: any, res: any, next: any) => {
    // If we're in production, we could check for an API_KEY. For now, we'll let it pass.
    next();
  };

  // API Routes
  
  // Ingredients
  app.get("/api/ingredients", (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM ingredients ORDER BY name ASC');
      const ingredients = stmt.all();
      res.json(ingredients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ingredients" });
    }
  });

  app.post("/api/ingredients", authMiddleware, validate(ingredientSchema), (req, res) => {
    try {
      const { name, category, buy_price, buy_unit, conversion_qty, usage_unit } = req.body;
      const stmt = db.prepare(`
        INSERT INTO ingredients (name, category, buy_price, buy_unit, conversion_qty, usage_unit)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(name, category || 'perishable', buy_price, buy_unit, conversion_qty, usage_unit);
      res.json({ id: info.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ error: "Failed to create ingredient" });
    }
  });

  app.put("/api/ingredients/:id", authMiddleware, validate(ingredientSchema), (req, res) => {
    try {
      const { name, category, buy_price, buy_unit, conversion_qty, usage_unit } = req.body;
      const stmt = db.prepare(`
        UPDATE ingredients 
        SET name = ?, category = ?, buy_price = ?, buy_unit = ?, conversion_qty = ?, usage_unit = ?
        WHERE id = ?
      `);
      const info = stmt.run(name, category || 'perishable', buy_price, buy_unit, conversion_qty, usage_unit, req.params.id);
      if (info.changes === 0) return res.status(404).json({ error: "Ingredient not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update ingredient" });
    }
  });

  app.delete("/api/ingredients/:id", authMiddleware, (req, res) => {
    try {
      const stmt = db.prepare('DELETE FROM ingredients WHERE id = ?');
      const info = stmt.run(req.params.id);
      if (info.changes === 0) return res.status(404).json({ error: "Ingredient not found" });
      res.json({ success: true });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        return res.status(400).json({ error: "Cannot delete ingredient currently in use in a recipe." });
      }
      res.status(500).json({ error: "Failed to delete ingredient" });
    }
  });

  // Employees
  app.get("/api/employees", (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM employees ORDER BY name ASC');
      const employees = stmt.all();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });

  app.post("/api/employees", authMiddleware, validate(employeeSchema), (req, res) => {
    try {
      const { name, position, salary } = req.body;
      const stmt = db.prepare(`
        INSERT INTO employees (name, position, salary)
        VALUES (?, ?, ?)
      `);
      const info = stmt.run(name, position, salary || 0);
      res.json({ id: info.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ error: "Failed to create employee" });
    }
  });

  app.put("/api/employees/:id", authMiddleware, validate(employeeSchema), (req, res) => {
    try {
      const { name, position, salary } = req.body;
      const stmt = db.prepare(`
        UPDATE employees 
        SET name = ?, position = ?, salary = ?
        WHERE id = ?
      `);
      const info = stmt.run(name, position, salary || 0, req.params.id);
      if (info.changes === 0) return res.status(404).json({ error: "Employee not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", authMiddleware, (req, res) => {
    try {
      const stmt = db.prepare('DELETE FROM employees WHERE id = ?');
      const info = stmt.run(req.params.id);
      if (info.changes === 0) return res.status(404).json({ error: "Employee not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete employee" });
    }
  });

  // Recipes
  app.get("/api/recipes", (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM recipes ORDER BY name ASC');
      const recipes = stmt.all();
      res.json(recipes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recipes" });
    }
  });

  app.get("/api/recipes/:id", (req, res) => {
    try {
      const recipeStmt = db.prepare('SELECT * FROM recipes WHERE id = ?');
      const recipe = recipeStmt.get(req.params.id);
      
      if (!recipe) return res.status(404).json({ error: "Recipe not found" });

      const itemsStmt = db.prepare(`
        SELECT ri.*, i.name as ingredient_name, i.category, i.buy_price, i.conversion_qty, i.usage_unit 
        FROM recipe_items ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_id = ?
      `);
      const items = itemsStmt.all(req.params.id);

      res.json({ ...(recipe as any), items });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recipe details" });
    }
  });

  app.post("/api/recipes", authMiddleware, validate(recipeSchema), (req, res) => {
    try {
      const { 
        name, image_url, buffer_percentage, labor_cost, overhead_cost, 
        overhead_electricity, overhead_water_gas, overhead_internet, 
        overhead_rent, overhead_cleaning, overhead_non_prod_salary,
        selling_price, tax_percentage, service_percentage, 
        target_portions, labor_cost_type, items 
      } = req.body;
      
      const insertRecipe = db.transaction(() => {
        const stmt = db.prepare(`
          INSERT INTO recipes (
            name, image_url, buffer_percentage, labor_cost, overhead_cost, 
            overhead_electricity, overhead_water_gas, overhead_internet, 
            overhead_rent, overhead_cleaning, overhead_non_prod_salary,
            selling_price, tax_percentage, service_percentage,
            target_portions, labor_cost_type
          ) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const info = stmt.run(
          name, image_url, buffer_percentage || 0, labor_cost || 0, overhead_cost || 0,
          overhead_electricity || 0, overhead_water_gas || 0, overhead_internet || 0,
          overhead_rent || 0, overhead_cleaning || 0, overhead_non_prod_salary || 0,
          selling_price || 0, tax_percentage || 0, service_percentage || 0,
          target_portions || 1, labor_cost_type || 'manual'
        );
        const recipeId = info.lastInsertRowid;

        const itemStmt = db.prepare('INSERT INTO recipe_items (recipe_id, ingredient_id, amount) VALUES (?, ?, ?)');
        for (const item of (items as any[])) {
          itemStmt.run(recipeId, item.ingredient_id, item.amount);
        }
        return recipeId;
      });

      const recipeId = insertRecipe();
      res.json({ id: recipeId });
    } catch (error) {
      res.status(500).json({ error: "Failed to create recipe" });
    }
  });

  app.put("/api/recipes/:id", authMiddleware, validate(recipeSchema), (req, res) => {
    try {
      const { 
        name, image_url, buffer_percentage, labor_cost, overhead_cost, 
        overhead_electricity, overhead_water_gas, overhead_internet, 
        overhead_rent, overhead_cleaning, overhead_non_prod_salary,
        selling_price, tax_percentage, service_percentage,
        target_portions, labor_cost_type, items 
      } = req.body;
      const recipeId = req.params.id;

      const updateRecipe = db.transaction(() => {
        const stmt = db.prepare(`
          UPDATE recipes 
          SET name = ?, image_url = ?, buffer_percentage = ?, labor_cost = ?, overhead_cost = ?, 
              overhead_electricity = ?, overhead_water_gas = ?, overhead_internet = ?, 
              overhead_rent = ?, overhead_cleaning = ?, overhead_non_prod_salary = ?,
              selling_price = ?, tax_percentage = ?, service_percentage = ?,
              target_portions = ?, labor_cost_type = ?
          WHERE id = ?
        `);
        const info = stmt.run(
          name, image_url, buffer_percentage || 0, labor_cost || 0, overhead_cost || 0, 
          overhead_electricity || 0, overhead_water_gas || 0, overhead_internet || 0,
          overhead_rent || 0, overhead_cleaning || 0, overhead_non_prod_salary || 0,
          selling_price || 0, tax_percentage || 0, service_percentage || 0, 
          target_portions || 1, labor_cost_type || 'manual', recipeId
        );

        if (info.changes === 0) throw new Error("Recipe not found");

        // Delete existing items
        db.prepare('DELETE FROM recipe_items WHERE recipe_id = ?').run(recipeId);

        // Insert new items
        const itemStmt = db.prepare('INSERT INTO recipe_items (recipe_id, ingredient_id, amount) VALUES (?, ?, ?)');
        for (const item of (items as any[])) {
          itemStmt.run(recipeId, item.ingredient_id, item.amount);
        }
      });

      updateRecipe();
      res.json({ success: true });
    } catch (error: any) {
      if (error.message === "Recipe not found") return res.status(404).json({ error: error.message });
      res.status(500).json({ error: "Failed to update recipe" });
    }
  });

  app.delete("/api/recipes/:id", authMiddleware, (req, res) => {
    try {
      const stmt = db.prepare('DELETE FROM recipes WHERE id = ?');
      const info = stmt.run(req.params.id);
      if (info.changes === 0) return res.status(404).json({ error: "Recipe not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete recipe" });
    }
  });

  // Serve static files in production
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    // Vite middleware for development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
