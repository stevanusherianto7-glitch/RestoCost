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
  onUpdateRecipe: (updates: Partial<Recipe>) => void;
}

const RecipeItemsSection: React.FC<RecipeItemsSectionProps> = ({
  recipe, ingredients, onAddItem, onRemoveItem, onUpdateItem, onUpdateRecipe
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

      {/* Waste & Buffer Section */}
      <div className="card-premium">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Sensitivitas Waste & Spoilage</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Buffer Bahan Baku</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between gap-6">
          <div className="flex-1">
             <p className="text-sm font-bold text-slate-700">Estimasi Bahan Terbuang (%)</p>
             <p className="text-xs text-slate-500 mt-1">Tambahkan persentase ini ke HPP untuk menalangi bahan yang akan terbuang saat preparasi atau basi.</p>
          </div>
          <div className="w-32 relative">
             <input
                type="number"
                min="0"
                max="100"
                value={recipe.buffer_percentage === 0 ? '' : recipe.buffer_percentage}
                onChange={(e) => onUpdateRecipe({ buffer_percentage: parseFloat(e.target.value) || 0 })}
                className="input-premium py-3 px-4 text-lg font-black text-slate-900 w-full text-center"
                placeholder="0"
                title="Buffer Persentase"
             />
             <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeItemsSection;
