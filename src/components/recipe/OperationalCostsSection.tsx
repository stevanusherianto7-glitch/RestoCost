import React from 'react';
import { Briefcase, Zap, Plus, X } from 'lucide-react';
import { Recipe } from '../../types';

interface OperationalCostsSectionProps {
  recipe: Recipe;
  onUpdateRecipe: (updates: Partial<Recipe>) => void;
}

const OperationalCostsSection: React.FC<OperationalCostsSectionProps> = ({
  recipe, onUpdateRecipe
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Labor Cost Section */}
      <div className="card-premium h-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Briefcase size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800">Beban Tenaga Kerja</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Labor & Manpower Cost</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
            <button
              type="button"
              onClick={() => onUpdateRecipe({ labor_cost_type: 'manual' })}
              className={`py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                recipe.labor_cost_type === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'
              }`}
            >
              Manual Input
            </button>
            <button
              type="button"
              onClick={() => onUpdateRecipe({ labor_cost_type: 'staff' })}
              className={`py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                recipe.labor_cost_type === 'staff' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'
              }`}
            >
              Master Data
            </button>
          </div>

          <div className="space-y-3">
            <label className="label-premium flex justify-between items-center">
               <span>Total Biaya Tenaga Kerja</span>
               <span className="text-[10px] text-blue-500 font-black tracking-widest uppercase bg-blue-50 px-2 py-0.5 rounded-lg">Per Batch</span>
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
              <input
                type="number"
                value={recipe.labor_cost}
                onChange={(e) => onUpdateRecipe({ labor_cost: parseFloat(e.target.value) || 0 })}
                className="input-premium py-5 pl-12 text-xl font-black text-slate-900 group-hover:bg-slate-50/50 transition-colors"
                placeholder="0"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium italic mt-2 ml-1">Tips: Masukkan total gaji staf yang terlibat dibagi jumlah porsi per hari.</p>
          </div>
        </div>
      </div>

      {/* Overhead Cost Section */}
      <div className="card-premium h-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Zap size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800">Biaya Overhead</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Utils & Operating Expenses</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <label className="label-premium flex justify-between items-center">
              <span>Total Biaya Overhead</span>
              <span className="text-[10px] text-amber-500 font-black tracking-widest uppercase bg-amber-50 px-2 py-0.5 rounded-lg">Per Batch</span>
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
              <input
                type="number"
                value={recipe.overhead_cost}
                onChange={(e) => onUpdateRecipe({ overhead_cost: parseFloat(e.target.value) || 0 })}
                className="input-premium py-5 pl-12 text-xl font-black text-slate-900 group-hover:bg-slate-50/50 transition-colors"
                placeholder="0"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium italic mt-2 ml-1">Tips: Meliputi listrik, air, gas, sewa, dan penyusutan peralatan.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationalCostsSection;
