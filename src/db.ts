import Database from 'better-sqlite3';

const db = new Database('restocost.db');

export function initDb() {
  // Use a transaction for initial table creation
  db.transaction(() => {
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
  })();

  // Migration logic
  const migrate = (tableName: string, columnName: string, sql: string) => {
    try {
      const tableInfo = db.pragma(`table_info(${tableName})`) as any[];
      const hasColumn = tableInfo.some((col) => col.name === columnName);
      if (!hasColumn) {
        db.exec(sql);
        console.log(`Migration: Added ${columnName} to ${tableName}`);
      }
    } catch (err) {
      console.error(`Migration error on ${tableName}.${columnName}:`, err);
    }
  };

  migrate('ingredients', 'category', "ALTER TABLE ingredients ADD COLUMN category TEXT DEFAULT 'perishable'");
  
  migrate('recipes', 'image_url', "ALTER TABLE recipes ADD COLUMN image_url TEXT");
  migrate('recipes', 'labor_cost', "ALTER TABLE recipes ADD COLUMN labor_cost REAL DEFAULT 0");
  migrate('recipes', 'overhead_cost', "ALTER TABLE recipes ADD COLUMN overhead_cost REAL DEFAULT 0");
  migrate('recipes', 'selling_price', "ALTER TABLE recipes ADD COLUMN selling_price REAL DEFAULT 0");
  
  migrate('recipes', 'overhead_electricity', "ALTER TABLE recipes ADD COLUMN overhead_electricity REAL DEFAULT 0");
  migrate('recipes', 'overhead_water_gas', "ALTER TABLE recipes ADD COLUMN overhead_water_gas REAL DEFAULT 0");
  migrate('recipes', 'overhead_internet', "ALTER TABLE recipes ADD COLUMN overhead_internet REAL DEFAULT 0");
  migrate('recipes', 'overhead_rent', "ALTER TABLE recipes ADD COLUMN overhead_rent REAL DEFAULT 0");
  migrate('recipes', 'overhead_cleaning', "ALTER TABLE recipes ADD COLUMN overhead_cleaning REAL DEFAULT 0");
  migrate('recipes', 'overhead_non_prod_salary', "ALTER TABLE recipes ADD COLUMN overhead_non_prod_salary REAL DEFAULT 0");
  
  migrate('recipes', 'tax_percentage', "ALTER TABLE recipes ADD COLUMN tax_percentage REAL DEFAULT 0");
  migrate('recipes', 'service_percentage', "ALTER TABLE recipes ADD COLUMN service_percentage REAL DEFAULT 0");
  
  migrate('recipes', 'target_portions', "ALTER TABLE recipes ADD COLUMN target_portions REAL DEFAULT 1");
  migrate('recipes', 'labor_cost_type', "ALTER TABLE recipes ADD COLUMN labor_cost_type TEXT DEFAULT 'manual'");

  // Seed initial data if empty
  try {
    const { count } = db.prepare('SELECT COUNT(*) as count FROM ingredients').get() as { count: number };
    if (count === 0) {
      db.prepare(`
        INSERT INTO ingredients (name, category, buy_price, buy_unit, conversion_qty, usage_unit)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('Bahan Dasar Contoh', 'perishable', 0, 'kg', 1, 'kg');
    }
  } catch (err) {
    console.error("Seeding error:", err);
  }
}

export default db;
