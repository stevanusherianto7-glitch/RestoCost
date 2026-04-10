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

        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Pengeluaran Bulanan</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Listrik, Air & Gas</label>
                <input 
                  type="number" 
                  value={recipe.overhead_electricity || 0}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    const totalMonthly = val + (recipe.overhead_rent || 0) + (recipe.overhead_internet || 0);
                    const perPortion = recipe.target_portions > 0 ? totalMonthly / recipe.target_portions : 0;
                    onUpdateRecipe({ overhead_electricity: val, overhead_cost: perPortion });
                  }}
                  aria-label="Listrik, Air & Gas bulanan"
                  placeholder="0"
                  className="w-full bg-white border-none rounded-xl px-4 py-2 text-sm font-bold shadow-sm focus:ring-2 focus:ring-amber-500/20" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Sewa Tempat</label>
                <input 
                  type="number" 
                  value={recipe.overhead_rent || 0}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    const totalMonthly = val + (recipe.overhead_electricity || 0) + (recipe.overhead_internet || 0);
                    const perPortion = recipe.target_portions > 0 ? totalMonthly / recipe.target_portions : 0;
                    onUpdateRecipe({ overhead_rent: val, overhead_cost: perPortion });
                  }}
                  aria-label="Sewa tempat bulanan"
                  placeholder="0"
                  className="w-full bg-white border-none rounded-xl px-4 py-2 text-sm font-bold shadow-sm focus:ring-2 focus:ring-amber-500/20" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Internet & Lainnya</label>
                <input 
                  type="number" 
                  value={recipe.overhead_internet || 0}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    const totalMonthly = val + (recipe.overhead_electricity || 0) + (recipe.overhead_rent || 0);
                    const perPortion = recipe.target_portions > 0 ? totalMonthly / recipe.target_portions : 0;
                    onUpdateRecipe({ overhead_internet: val, overhead_cost: perPortion });
                  }}
                  aria-label="Internet & biaya lainnya"
                  placeholder="0"
                  className="w-full bg-white border-none rounded-xl px-4 py-2 text-sm font-bold shadow-sm focus:ring-2 focus:ring-amber-500/20" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Target Porsi / Bulan</label>
                <input 
                  type="number" 
                  value={recipe.target_portions || 1}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 1;
                    const totalMonthly = (recipe.overhead_electricity || 0) + (recipe.overhead_rent || 0) + (recipe.overhead_internet || 0);
                    const perPortion = totalMonthly / val;
                    onUpdateRecipe({ target_portions: val, overhead_cost: perPortion });
                  }}
                  aria-label="Target porsi per bulan"
                  placeholder="1"
                  className="w-full bg-emerald-50 text-emerald-700 border-none rounded-xl px-4 py-2 text-sm font-bold shadow-sm focus:ring-2 focus:ring-emerald-500/20" 
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-amber-50/50 rounded-3xl border border-amber-100 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Alokasi Per Batch</p>
              <p className="text-2xl font-black text-slate-900 mt-1">Rp {recipe.overhead_cost.toLocaleString('id-ID')}</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm shadow-amber-200/50">
              <Zap size={24} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationalCostsSection;
