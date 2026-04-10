import React from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { Ingredient, RecipeItem } from '../types';

interface RecipeItemRowProps {
  index: number;
  item: RecipeItem;
  ingredients: Ingredient[];
  onRemove: () => void;
  onUpdate: (updates: Partial<RecipeItem>) => void;
}

const RecipeItemRow: React.FC<RecipeItemRowProps> = ({
  index, item, ingredients, onRemove, onUpdate
}) => {
  const selectedIngredient = ingredients.find(i => i.id === item.ingredient_id);
  const costPerUnit = selectedIngredient ? (selectedIngredient.buy_price / selectedIngredient.conversion_qty) : 0;
  const totalCost = costPerUnit * item.amount;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white p-5 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all group group/row">
      <div className="md:col-span-5 space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Item Bahan</label>
        <select
          value={item.ingredient_id}
          onChange={(e) => onUpdate({ ingredient_id: parseInt(e.target.value) })}
          className="input-premium py-3 text-sm font-bold bg-slate-50 border-none group-hover/row:bg-white"
        >
          <option value="0">Pilih Bahan...</option>
          {ingredients.map((ing) => (
            <option key={ing.id} value={ing.id}>{ing.name}</option>
          ))}
        </select>
      </div>

      <div className="md:col-span-3">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
          Takaran & Satuan Unit
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            step="any"
            value={item.amount}
            onChange={(e) => onUpdate({ amount: parseFloat(e.target.value) || 0 })}
            className="input-premium py-3 text-sm font-bold bg-slate-50 border-none group-hover/row:bg-white w-full"
            placeholder="0.00"
          />
          <select 
            disabled 
            value={selectedIngredient?.usage_unit || ''}
            className="input-premium py-3 px-2 text-sm font-bold bg-slate-100 border-none text-slate-500 cursor-not-allowed w-28 text-center appearance-none"
            title="Satuan unit (diambil dari Master Bahan Baku)"
          >
            <option value="">Unit</option>
            {selectedIngredient?.usage_unit && (
              <option value={selectedIngredient.usage_unit}>{selectedIngredient.usage_unit}</option>
            )}
          </select>
        </div>
      </div>

      <div className="md:col-span-3 space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subtotal HPP</label>
        <div className="px-4 py-3 bg-slate-50/50 rounded-xl flex items-center justify-between border border-transparent group-hover/row:border-emerald-50 transition-colors">
          <span className="text-sm font-black text-emerald-600">
            Rp {totalCost.toLocaleString('id-ID', { maximumFractionDigits: 1 })}
          </span>
          {!selectedIngredient && (
            <div className="p-1 bg-amber-50 text-amber-500 rounded-lg animate-pulse">
               <AlertCircle size={14} />
            </div>
          )}
        </div>
      </div>

      <div className="md:col-span-1 pt-6 flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default RecipeItemRow;
