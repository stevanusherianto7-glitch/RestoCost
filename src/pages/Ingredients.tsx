import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { Ingredient } from '../types';
import ConfirmModal from '../components/ConfirmModal';

const schema = z.object({
  name: z.string().min(1, "Nama bahan wajib diisi"),
  category: z.enum(['perishable', 'dry_goods', 'condiment', 'processed', 'supplies']),
  buy_price: z.number().min(0, "Harga beli tidak boleh negatif"),
  buy_unit: z.string().min(1, "Satuan beli wajib diisi"),
  conversion_qty: z.number().min(0.0001, "Isi per satuan harus lebih dari 0"),
  usage_unit: z.string().min(1, "Satuan pakai wajib diisi"),
});

type FormData = z.infer<typeof schema>;

const CATEGORY_LABELS: Record<string, string> = {
  perishable: 'Bahan Segar (Perishables)',
  dry_goods: 'Bahan Kering & Bahan Pokok (Dry Goods & Staples)',
  condiment: 'Bumbu, Saus, & Bahan Pelengkap (Condiments & Pantry)',
  processed: 'Bahan Olahan & Setengah Jadi (Processed & Semi-Finished)',
  supplies: 'Bahan Penolong (Supplies & Non-Food)',
};

const CATEGORY_COLORS: Record<string, string> = {
  perishable: 'bg-red-100 text-red-800',
  dry_goods: 'bg-amber-100 text-amber-800',
  condiment: 'bg-orange-100 text-orange-800',
  processed: 'bg-blue-100 text-blue-800',
  supplies: 'bg-purple-100 text-purple-800',
};

export default function Ingredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | 'perishable' | 'dry_goods' | 'condiment' | 'processed' | 'supplies'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ingToDelete, setIngToDelete] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'perishable'
    }
  });

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    const res = await fetch('/api/ingredients');
    const data = await res.json();
    setIngredients(data);
  };

  const onSubmit = async (data: FormData) => {
    if (editingId) {
      await fetch(`/api/ingredients/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setEditingId(null);
    } else {
      await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setIsAdding(false);
    }
    reset({ category: 'perishable' });
    fetchIngredients();
  };

  const handleDelete = (id: number) => {
    setIngToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (ingToDelete === null) return;
    const res = await fetch(`/api/ingredients/${ingToDelete}`, { method: 'DELETE' });
    if (res.ok) {
      fetchIngredients();
    } else {
      setError('Gagal menghapus. Bahan mungkin sedang digunakan dalam resep.');
      setTimeout(() => setError(null), 5000);
    }
    setIngToDelete(null);
  };

  const startEdit = (ingredient: Ingredient) => {
    setEditingId(ingredient.id);
    setValue('name', ingredient.name);
    setValue('category', ingredient.category || 'perishable');
    setValue('buy_price', ingredient.buy_price);
    setValue('buy_unit', ingredient.buy_unit);
    setValue('conversion_qty', ingredient.conversion_qty);
    setValue('usage_unit', ingredient.usage_unit);
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    reset({ category: 'perishable' });
  };

  const filteredIngredients = ingredients.filter(ing => {
    const matchesCategory = filterCategory === 'all' || (ing.category || 'perishable') === filterCategory;
    const matchesSearch = ing.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Database Bahan Baku & Kemasan</h2>
        <div className="flex gap-3">
          <button
            onClick={() => { setIsAdding(true); setEditingId(null); reset({ category: 'perishable' }); }}
            className="btn btn-primary"
          >
            <Plus size={20} /> Tambah Item
          </button>
          {(isAdding || editingId) && (
            <button
              onClick={() => handleSubmit(onSubmit)()}
              className="btn btn-primary"
            >
              <Save size={20} /> Simpan
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex justify-between items-center">
          <p className="text-sm font-medium">{error}</p>
          <button onClick={() => setError(null)}><X size={16} /></button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Cari bahan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterCategory('all')}
            className={`btn-sm ${filterCategory === 'all' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Semua
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterCategory(key as any)}
              className={`btn-sm ${filterCategory === key ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {label.split(' (')[0]}
            </button>
          ))}
        </div>
      </div>

      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Nama Item</label>
              <input {...register('name')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border" placeholder="Contoh: Beras / Box Takeaway" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Kategori</label>
              <select {...register('category')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border">
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Harga Beli (Rp)</label>
              <input type="number" {...register('buy_price', { valueAsNumber: true })} value={Number.isNaN(watch('buy_price')) ? '' : (watch('buy_price') ?? '')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border" placeholder="50000" />
              {errors.buy_price && <p className="text-red-500 text-xs mt-1">{errors.buy_price.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Satuan Beli</label>
              <input {...register('buy_unit')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border" placeholder="Karung/Pack" />
              {errors.buy_unit && <p className="text-red-500 text-xs mt-1">{errors.buy_unit.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Isi per Satuan</label>
              <input type="number" step="any" {...register('conversion_qty', { valueAsNumber: true })} value={Number.isNaN(watch('conversion_qty')) ? '' : (watch('conversion_qty') ?? '')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border" placeholder="10" />
              {errors.conversion_qty && <p className="text-red-500 text-xs mt-1">{errors.conversion_qty.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Satuan Pakai</label>
              <input {...register('usage_unit')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border" placeholder="kg/liter/pcs" />
              {errors.usage_unit && <p className="text-red-500 text-xs mt-1">{errors.usage_unit.message}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={cancelEdit} className="btn btn-secondary">Batal</button>
            <button type="submit" className="btn btn-primary">
              <Save size={18} /> Simpan
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga Beli</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Konversi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga / Unit Pakai</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredIngredients.map((ing) => {
              const pricePerUnit = ing.buy_price / ing.conversion_qty;
              return (
                <tr key={ing.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ing.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[ing.category] || 'bg-gray-100 text-gray-800'}`}>
                      {CATEGORY_LABELS[ing.category] || ing.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Rp {ing.buy_price.toLocaleString('id-ID')} / {ing.buy_unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    1 {ing.buy_unit} = {ing.conversion_qty} {ing.usage_unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium">
                    Rp {pricePerUnit.toLocaleString('id-ID', { maximumFractionDigits: 2 })} / {ing.usage_unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => startEdit(ing)} className="btn-icon text-indigo-600 hover:text-indigo-900 mr-4"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(ing.id)} className="btn-icon text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                  </td>
                </tr>
              );
            })}
            {filteredIngredients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  Tidak ada data yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus Bahan Baku"
        message="Apakah Anda yakin ingin menghapus bahan ini? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  );
}
