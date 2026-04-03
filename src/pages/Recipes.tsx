import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, ChefHat, ArrowRight } from 'lucide-react';
import { Recipe } from '../types';
import ConfirmModal from '../components/ConfirmModal';

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newRecipeName, setNewRecipeName] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    const res = await fetch('/api/recipes');
    const data = await res.json();
    setRecipes(data);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newRecipeName.trim()) return;

    const capitalizedName = newRecipeName.replace(/\b\w/g, (char) => char.toUpperCase());

    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: capitalizedName, items: [] }),
    });

    if (res.ok) {
      setNewRecipeName('');
      setIsCreating(false);
      fetchRecipes();
    }
  };

  const handleDelete = (id: number) => {
    setRecipeToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (recipeToDelete === null) return;
    await fetch(`/api/recipes/${recipeToDelete}`, { method: 'DELETE' });
    fetchRecipes();
    setRecipeToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Daftar Resep Menu</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="btn btn-primary w-full md:w-max"
        >
          <Plus size={20} /> Buat Resep Baru
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Menu</label>
            <input
              type="text"
              value={newRecipeName}
              onChange={(e) => setNewRecipeName(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
              placeholder="Contoh: Nasi Goreng Spesial"
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Simpan
          </button>
          <button type="button" onClick={() => setIsCreating(false)} className="btn btn-secondary">
            Batal
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600">
                <ChefHat size={24} />
              </div>
              <button onClick={() => handleDelete(recipe.id)} className="btn-icon text-gray-400 hover:text-red-500">
                <Trash2 size={20} />
              </button>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{recipe.name}</h3>
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-500">Buffer: {recipe.buffer_percentage}%</span>
              <Link
                to={`/recipes/${recipe.id}`}
                className="text-emerald-600 font-medium flex items-center gap-1 hover:gap-2 transition-all"
              >
                Detail & Hitung <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ))}
        {recipes.length === 0 && !isCreating && (
          <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            Belum ada resep. Mulai dengan membuat resep baru.
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus Resep"
        message="Apakah Anda yakin ingin menghapus resep ini? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  );
}
