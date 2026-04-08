import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, Printer, ChevronLeft, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Recipe, RecipeItem, Ingredient } from '../types';
import { DataService } from '../services/dataService';
import { calculateHPP } from '../utils/calculations';
import RecipeItemsSection from '../components/recipe/RecipeItemsSection';
import OperationalCostsSection from '../components/recipe/OperationalCostsSection';
import HPPSummarySection from '../components/recipe/HPPSummarySection';
import HPPAnalysisBar from '../components/recipe/HPPAnalysisBar';

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Live query for ingredients
  const ingredients = useLiveQuery(() => DataService.getIngredients()) || [];

  useEffect(() => {
    if (id) {
      loadRecipe(parseInt(id));
    }
  }, [id]);

  const loadRecipe = async (recipeId: number) => {
    try {
      const data = await DataService.getRecipe(recipeId);
      setRecipe(data);
    } catch (error) {
      console.error('Error loading recipe:', error);
    }
  };

  const handleSave = async () => {
    if (!recipe) return;
    setIsSaving(true);
    try {
      await DataService.saveRecipe(recipe);
      // Reload to ensure state is clean
      await loadRecipe(recipe.id);
    } catch (error) {
      console.error('Error saving recipe:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateRecipe = (updates: Partial<Recipe>) => {
    if (!recipe) return;
    setRecipe({ ...recipe, ...updates });
  };

  const handleAddItem = (ingredientId: number) => {
    if (!recipe) return;
    const item: RecipeItem = {
      recipe_id: recipe.id,
      ingredient_id: ingredientId,
      amount: 0,
    };
    setRecipe({ ...recipe, items: [...recipe.items, item] });
  };

  const handleRemoveItem = (index: number) => {
    if (!recipe) return;
    const newItems = [...recipe.items];
    newItems.splice(index, 1);
    setRecipe({ ...recipe, items: newItems });
  };

  const handleUpdateItem = (index: number, updates: Partial<RecipeItem>) => {
    if (!recipe) return;
    const newItems = [...recipe.items];
    newItems[index] = { ...newItems[index], ...updates };
    setRecipe({ ...recipe, items: newItems });
  };

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Memuat Resep...</p>
      </div>
    );
  }

  const hppResult = calculateHPP(recipe, ingredients);

  return (
    <div className="space-y-10 pb-32">
      {/* Header Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/recipes')} 
            className="p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm group"
          >
            <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{recipe.name}</h2>
            <div className="flex items-center gap-3 mt-1.5">
               <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100 rounded-lg">Draft BOM</span>
               <span className="text-slate-400 text-xs font-medium">Terakhir diupdate: Baru saja (Local)</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => window.print()}
            disabled={isExporting}
            className="btn btn-secondary flex-1 md:flex-none border-slate-200 bg-white"
          >
            <Printer size={20} />
            <span>Cetak / PDF</span>
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="btn btn-primary flex-1 md:flex-none shadow-emerald-200"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <Save size={20} />}
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: BOM & Costs */}
        <div className="lg:col-span-8 space-y-8">
          <RecipeItemsSection 
            recipe={recipe} 
            ingredients={ingredients}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onUpdateItem={handleUpdateItem}
          />
          
          <OperationalCostsSection 
            recipe={recipe} 
            onUpdateRecipe={updateRecipe}
          />
        </div>

        {/* Right Column: Calculations Summary */}
        <div className="lg:col-span-4 sticky top-10">
          <HPPSummarySection hppResult={hppResult} />
          
          <AnimatePresence>
            {recipe.items.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 p-6 bg-amber-50 border border-amber-100 rounded-3xl flex items-start gap-4"
              >
                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-amber-900 leading-tight">Resep Masih Kosong</p>
                  <p className="text-xs text-amber-700 mt-1 font-medium">Tambahkan bahan baku atau kemasan untuk mulai menghitung HPP.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Analysis Sticky Bar */}
      <HPPAnalysisBar 
        recipe={recipe} 
        hppResult={hppResult} 
        onUpdateRecipe={updateRecipe} 
      />
    </div>
  );
}
