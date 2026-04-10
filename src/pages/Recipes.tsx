import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, ChefHat, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Recipe } from '../types';
import { DataService } from '../services/dataService';
import ConfirmModal from '../components/ConfirmModal';

export default function Recipes() {
  const [isCreating, setIsCreating] = useState(false);
  const [newRecipeName, setNewRecipeName] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<number | null>(null);

  // Live query for recipes
  const recipes = useLiveQuery(() => DataService.getRecipes()) || [];

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newRecipeName.trim()) return;

    const capitalizedName = newRecipeName.replace(/\b\w/g, (char) => char.toUpperCase());

    try {
      await DataService.saveRecipe({ 
        name: capitalizedName, 
        items: [],
        buffer_percentage: 5,
        target_margin: 65,
        selling_price: 0,
        target_portions: 1,
        labor_cost_type: 'manual',
        labor_cost: 0,
        overhead_cost: 0
      });
      setNewRecipeName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating recipe:', error);
    }
  };

  const handleDelete = (id: number) => {
    setRecipeToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (recipeToDelete === null) return;
    try {
      await DataService.deleteRecipe(recipeToDelete);
    } catch (error) {
      console.error('Error deleting recipe:', error);
    } finally {
      setRecipeToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-montserrat font-bold text-slate-900">Katalog Resep & BOM</h2>
          <p className="text-slate-500 font-medium mt-1">Kelola daftar resep dan analisis harga jual menu Anda.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="btn btn-primary group shadow-emerald-200"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          <span>Buat Resep Baru</span>
        </button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          >
            <div className="glass-modal w-full max-w-md p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-900">Resep Baru</h3>
                <button onClick={() => setIsCreating(false)} aria-label="Tutup" title="Tutup" className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-2">
                  <label className="label-premium">Nama Menu / Produk</label>
                  <input
                    type="text"
                    value={newRecipeName}
                    onChange={(e) => setNewRecipeName(e.target.value)}
                    className="input-premium py-4 text-lg font-bold"
                    placeholder="Contoh: Burger Wagyu Spesial"
                    autoFocus
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn btn-primary flex-1 shadow-none">
                    Buat Sekarang
                  </button>
                  <button type="button" onClick={() => setIsCreating(false)} className="btn btn-secondary">
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {recipes.map((recipe, index) => (
          <motion.div 
            key={recipe.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group card-premium hover:border-emerald-200 hover:shadow-2xl transition-all duration-500 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                  <ChefHat size={28} />
                </div>
                <button 
                  onClick={() => handleDelete(recipe.id!)} 
                  aria-label="Hapus resep"
                  title="Hapus"
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              
              <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">{recipe.name}</h3>
              
              <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Margin</span>
                  <span className="text-lg font-black text-slate-900">{recipe.buffer_percentage}%</span>
                </div>
                <Link
                  to={`/recipes/${recipe.id}`}
                  className="btn btn-secondary !py-2 !px-4 !rounded-xl text-sm border-transparent bg-slate-50 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-none"
                >
                  Detail <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
        
        {recipes.length === 0 && !isCreating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200"
          >
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <ChefHat size={40} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-bold">Katalog resep masih kosong.</p>
            <button 
              onClick={() => setIsCreating(true)}
              className="text-emerald-600 font-black mt-2 hover:underline"
            >
              Mulai buat resep pertama sekarang
            </button>
          </motion.div>
        )}
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus Resep"
        message="Resep ini akan dihapus permanen beserta rincian item di dalamnya. Lanjutkan?"
      />
    </div>
  );
}
