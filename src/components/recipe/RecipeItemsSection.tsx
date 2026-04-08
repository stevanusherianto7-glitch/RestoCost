import React from 'react';
import { Plus, ChefHat, Package } from 'lucide-react';
import RecipeItemRow from '../RecipeItemRow';
import { Ingredient, Recipe, RecipeItem } from '../../types';

interface RecipeItemsSectionProps {
  recipe: Recipe;
  ingredients: Ingredient[];
  onAddItem: (ingredientId: number) => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, updates: Partial<RecipeItem>) => void;
}

const RecipeItemsSection: React.FC<RecipeItemsSectionProps> = ({
  recipe, ingredients, onAddItem, onRemoveItem, onUpdateItem
}) => {
  const rawMaterials = recipe.items.filter(item => item.category !== 'supplies');
  const packaging = recipe.items.filter(item => item.category === 'supplies');

  return (
    <div className="space-y-8">
      {/* Raw Materials Section */}
      <div className="card-premium">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ChefHat size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Bahan Baku & Komponen</h3>
          </div>
          <button
            type="button"
            onClick={() => onAddItem(ingredients[0]?.id || 1)}
            className="btn btn-secondary px-4 py-2 text-sm"
          >
            <Plus size={16} /> Tambah Bahan
          </button>
        </div>

        <div className="space-y-4">
          {recipe.items.map((item, index) => (
            <RecipeItemRow
              key={index}
              index={index}
              item={item}
              ingredients={ingredients}
              onRemove={() => onRemoveItem(index)}
              onUpdate={(updates) => onUpdateItem(index, updates)}
            />
          ))}
          {recipe.items.length === 0 && (
            <div className="text-center py-10 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
              <ChefHat size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs text-slate-400 font-medium">Belum ada bahan. Klik tambah untuk memulai.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeItemsSection;
