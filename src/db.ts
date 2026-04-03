import Database from 'better-sqlite3';

const db = new Database('restocost.db');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'perishable',
      buy_price REAL NOT NULL,
      buy_unit TEXT NOT NULL,
      conversion_qty REAL NOT NULL,
      usage_unit TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      position TEXT,
      salary REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      image_url TEXT,
      buffer_percentage REAL DEFAULT 0,
      labor_cost REAL DEFAULT 0,
      overhead_cost REAL DEFAULT 0,
      overhead_electricity REAL DEFAULT 0,
      overhead_water_gas REAL DEFAULT 0,
      overhead_internet REAL DEFAULT 0,
      overhead_rent REAL DEFAULT 0,
      overhead_cleaning REAL DEFAULT 0,
      overhead_non_prod_salary REAL DEFAULT 0,
      selling_price REAL DEFAULT 0,
      tax_percentage REAL DEFAULT 0,
      service_percentage REAL DEFAULT 0,
      target_portions REAL DEFAULT 1,
      labor_cost_type TEXT DEFAULT 'manual',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipe_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      ingredient_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE,
      FOREIGN KEY (ingredient_id) REFERENCES ingredients (id) ON DELETE RESTRICT
    );
  `);

  // Migration for existing tables (simple check)
  try {
    const tableInfo = db.pragma('table_info(ingredients)');
    const hasCategory = tableInfo.some((col: any) => col.name === 'category');
    if (!hasCategory) {
      db.exec("ALTER TABLE ingredients ADD COLUMN category TEXT DEFAULT 'perishable'");
    }

    const recipeInfo = db.pragma('table_info(recipes)');
    const hasImage = recipeInfo.some((col: any) => col.name === 'image_url');
    if (!hasImage) {
      db.exec("ALTER TABLE recipes ADD COLUMN image_url TEXT");
      db.exec("ALTER TABLE recipes ADD COLUMN labor_cost REAL DEFAULT 0");
      db.exec("ALTER TABLE recipes ADD COLUMN overhead_cost REAL DEFAULT 0");
      db.exec("ALTER TABLE recipes ADD COLUMN selling_price REAL DEFAULT 0");
    }

    const hasElectricity = recipeInfo.some((col: any) => col.name === 'overhead_electricity');
    if (!hasElectricity) {
      db.exec("ALTER TABLE recipes ADD COLUMN overhead_electricity REAL DEFAULT 0");
      db.exec("ALTER TABLE recipes ADD COLUMN overhead_water_gas REAL DEFAULT 0");
      db.exec("ALTER TABLE recipes ADD COLUMN overhead_internet REAL DEFAULT 0");
      db.exec("ALTER TABLE recipes ADD COLUMN overhead_rent REAL DEFAULT 0");
      db.exec("ALTER TABLE recipes ADD COLUMN overhead_cleaning REAL DEFAULT 0");
      db.exec("ALTER TABLE recipes ADD COLUMN overhead_non_prod_salary REAL DEFAULT 0");
    }

    const hasTax = recipeInfo.some((col: any) => col.name === 'tax_percentage');
    if (!hasTax) {
      db.exec("ALTER TABLE recipes ADD COLUMN tax_percentage REAL DEFAULT 0");
      db.exec("ALTER TABLE recipes ADD COLUMN service_percentage REAL DEFAULT 0");
    }

    const hasTargetPortions = recipeInfo.some((col: any) => col.name === 'target_portions');
    if (!hasTargetPortions) {
      db.exec("ALTER TABLE recipes ADD COLUMN target_portions REAL DEFAULT 1");
      db.exec("ALTER TABLE recipes ADD COLUMN labor_cost_type TEXT DEFAULT 'manual'");
    }

    // Seed initial data if empty
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM ingredients');
    const { count } = countStmt.get() as { count: number };
    if (count === 0) {
      const insertStmt = db.prepare(`
        INSERT INTO ingredients (name, category, buy_price, buy_unit, conversion_qty, usage_unit)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      insertStmt.run('Daging dan Unggas', 'perishable', 0, 'kg', 1, 'kg');
    }
  } catch (err) {
    console.error("Migration error:", err);
  }
}

export default db;
