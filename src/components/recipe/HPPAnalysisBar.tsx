import React from 'react';
import { Target, TrendingUp, HandCoins } from 'lucide-react';
import { motion } from 'motion/react';
import { Recipe } from '../../types';

interface HPPAnalysisBarProps {
  recipe: Recipe;
  hppResult: any;
  onUpdateRecipe: (updates: Partial<Recipe>) => void;
}

const HPPAnalysisBar: React.FC<HPPAnalysisBarProps> = ({
  recipe, hppResult, onUpdateRecipe
}) => {
  const { totalHPP, recommendedPrice, currentMargin, foodCostPercentage } = hppResult;

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-40 p-4 md:p-6"
    >
      <div className="max-w-7xl mx-auto">
        <div className="glass-modal !rounded-[2.5rem] p-4 md:p-6 shadow-2xl border-emerald-100/50 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1/3 h-1 bg-gradient-to-r from-emerald-500 to-transparent opacity-50"></div>
          
          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className="hidden md:flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Food Cost</span>
              <div className="flex items-end gap-2">
                 <span className="text-2xl font-black text-slate-900 leading-none">
                    {foodCostPercentage.toFixed(1)}%
                 </span>
                 <div className={`h-2 w-2 rounded-full mb-1 ${foodCostPercentage > 40 ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`}></div>
              </div>
            </div>
            
            <div className="h-10 w-px bg-slate-100 hidden md:block"></div>

            <div className="flex-1 md:flex-none">
              <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1.5 justify-center md:justify-start">
                <Target size={12} /> Target Margin (%)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="5"
                  max="80"
                  step="1"
                  value={recipe.target_margin || 65}
                  onChange={(e) => onUpdateRecipe({ target_margin: parseInt(e.target.value) })}
                  title="Target Margin (%)"
                  aria-label="Target Margin Percentage"
                  className="w-32 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <span className="text-lg font-black text-slate-900 w-10">{recipe.target_margin || 65}%</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-10 w-full md:w-auto">
             <div className="text-center md:text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rekomendasi Harga Jual</p>
                <div className="flex items-center gap-2 justify-center md:justify-end">
                   <TrendingUp size={16} className="text-emerald-500" />
                   <span className="text-2xl font-black text-emerald-600">
                     Rp {recommendedPrice.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                   </span>
                </div>
             </div>

             <div className="w-full md:w-48 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 justify-center md:justify-start md:ml-1">
                   <HandCoins size={12} /> Harga Jual Aktual (Porsi)
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    value={recipe.selling_price}
                    onChange={(e) => onUpdateRecipe({ selling_price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border-2 border-emerald-100 rounded-2xl py-3 px-4 text-base font-black text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                    placeholder="0"
                  />
                </div>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HPPAnalysisBar;
