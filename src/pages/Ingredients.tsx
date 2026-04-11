import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2, Edit2, Save, X, Search, Filter, Database, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Capacitor } from '@capacitor/core';
import { Ingredient } from '../types';
import { DataService } from '../services/dataService';
import ConfirmModal from '../components/ConfirmModal';

const schema = z.object({
  name: z.string().min(1, "Nama bahan wajib diisi"),
  category: z.enum(['perishable', 'dry_goods', 'condiment', 'processed', 'supplies', 'spices']),
  buy_price: z.number().min(0, "Harga beli tidak boleh negatif"),
  buy_unit: z.string().min(1, "Satuan beli wajib diisi"),
  conversion_qty: z.number().min(0.0001, "Isi per satuan harus lebih dari 0"),
  usage_unit: z.string().min(1, "Satuan pakai wajib diisi"),
});

type FormData = z.infer<typeof schema>;

const CATEGORY_LABELS: Record<string, string> = {
  perishable: 'Bahan Segar',
  dry_goods: 'Bahan Pokok',
  condiment: 'Bumbu & Saus',
  processed: 'Bahan Olahan',
  supplies: 'Kemasan & Lainnya',
  spices: 'Bahan Rempah & Aromatik',
};

const CATEGORY_COLORS: Record<string, string> = {
  perishable: 'bg-rose-50 text-rose-600 border-rose-100',
  dry_goods: 'bg-rose-50 text-rose-600 border-rose-100',
  condiment: 'bg-rose-50 text-rose-600 border-rose-100',
  processed: 'bg-rose-50 text-rose-600 border-rose-100',
  supplies: 'bg-rose-50 text-rose-600 border-rose-100',
  spices: 'bg-rose-50 text-rose-600 border-rose-100',
};

const UNIT_OPTIONS = [
  'kg', 'g', 'liter', 'ml', 'pcs',
  'karung', 'dus', 'pack', 'botol',
  'sachet', 'ikat', 'kaleng', 'galon', 'box'
];

export default function Ingredients() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | 'perishable' | 'dry_goods' | 'condiment' | 'processed' | 'supplies' | 'spices'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ingToDelete, setIngToDelete] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Correct Dexie live query
  const ingredients = useLiveQuery(() => DataService.getIngredients()) || [];

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'perishable' }
  });

  const onSubmit = async (data: FormData) => {
    try {
      await DataService.saveIngredient({ ...data, id: editingId || undefined });
      setEditingId(null);
      setIsAdding(false);
      reset({ category: 'perishable' });
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleDelete = (id: number) => {
    setIngToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (ingToDelete === null) return;
    try {
      await DataService.deleteIngredient(ingToDelete);
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus. Bahan mungkin sedang digunakan.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIngToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const startEdit = (ingredient: Ingredient) => {
    setEditingId(ingredient.id);
    reset({
      name: ingredient.name,
      category: ingredient.category || 'perishable',
      buy_price: ingredient.buy_price,
      buy_unit: ingredient.buy_unit,
      conversion_qty: ingredient.conversion_qty,
      usage_unit: ingredient.usage_unit,
    });
    setIsAdding(true);
  };

  const filteredIngredients = ingredients.filter(ing => {
    const matchesCategory = filterCategory === 'all' || (ing.category || 'perishable') === filterCategory;
    const matchesSearch = ing.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const generatePDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [210, 297] });
    const fileName = `Database_Bahan_Baku_${new Date().toISOString().split('T')[0]}`;
    
    doc.setProperties({
      title: "Database Bahan Baku",
      subject: "Inventory Report",
      author: "PSRestoCost",
      creator: "PSRestoCost ERP Engine"
    });
    
    // ── Branding & Header ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129); // emerald-500
    doc.text('PSRestoCost ERP Engine', 14, 15);
    
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.line(14, 17, 196, 17);

    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("DATABASE BAHAN BAKU", 14, 28);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 34);
    doc.text(`Total Kapasitas: ${filteredIngredients.length} Item Terdaftar`, 14, 39);
    
    // ── Database Table ──
    const tableData = filteredIngredients.map((ing, index) => [
      { content: (index + 1).toString(), styles: { halign: 'center' } },
      ing.name,
      CATEGORY_LABELS[ing.category] || ing.category,
      { content: `Rp ${ing.buy_price.toLocaleString('id-ID')}`, styles: { halign: 'right' } },
      ing.buy_unit,
      { 
        content: `Rp ${(ing.buy_price / (ing.conversion_qty || 1)).toLocaleString('id-ID', { maximumFractionDigits: 2 })}`, 
        styles: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] } 
      },
      ing.usage_unit
    ]);
    
    autoTable(doc, {
      startY: 48,
      head: [['No', 'Item / Nama Bahan', 'Kategori', 'Harga Beli', 'Unit', 'HPP / Unit', 'Pakai']],
      body: tableData,
      headStyles: { 
        fillColor: [15, 23, 42], 
        textColor: 255, 
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: 4
      },
      alternateRowStyles: { fillColor: [252, 252, 252] },
      styles: { 
        fontSize: 8, 
        cellPadding: 3, 
        font: 'helvetica',
        lineColor: [241, 245, 249],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 15 },
        3: { cellWidth: 30 },
        5: { cellWidth: 30 }
      }
    });
    
    // ── Footer ──
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text('Dokumen Master Data Bahan Baku ini dihasilkan oleh PSRestoCost ERP Engine.', 14, 285);
        doc.text(`Halaman ${i} dari ${pageCount}`, 196, 285, { align: 'right' });
    }

    const pdfBlob = doc.output('blob');
    const finalFileName = `Database_Bahan_Baku_${new Date().toISOString().split('T')[0]}`.replace(/\s+/g, '_') + '.pdf';
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-montserrat font-bold text-slate-900">Database Bahan Baku</h2>
          <p className="text-slate-500 font-medium mt-1">Master data semua komponen bahan baku dan kemasan.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={generatePDF}
            className="btn btn-secondary shadow-slate-100"
            aria-label="Simpan ke PDF"
            title="Simpan ke PDF"
          >
            <FileText size={20} />
            <span className="hidden sm:inline">Save PDF</span>
          </button>
          <button
            onClick={() => { setIsAdding(true); setEditingId(null); reset(); }}
            className="btn btn-primary shadow-emerald-200"
          >
            <Plus size={20} />
            <span>Tambah Item Baru</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-2xl flex justify-between items-center shadow-sm shadow-rose-100"
          >
            <p className="text-sm font-bold uppercase tracking-wider">{error}</p>
            <button onClick={() => setError(null)} aria-label="Tutup" title="Tutup" className="p-1 hover:bg-rose-100 rounded-lg transition-colors"><X size={18} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="card-premium !p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Cari item bahan baku..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
            <Filter size={16} className="text-slate-400 mr-1" />
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value as any)}
              aria-label="Filter kategori"
              title="Filter kategori"
              className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-emerald-500/20 outline-none"
            >
                <option value="all">Semua Kategori</option>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                ))}
            </select>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="glass-modal w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-900">{editingId ? 'Edit Item Bahan' : 'Item Bahan Baru'}</h3>
              <button onClick={() => setIsAdding(false)} aria-label="Tutup modal" title="Tutup modal" className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="label-premium">Nama Item</label>
                  <input {...register('name')} className="input-premium py-4" placeholder="Contoh: Daging Sapi Wagyu MB5" />
                  {errors.name && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 ml-1">{errors.name.message}</p>}
                </div>
                
                <div className="space-y-1.5">
                  <label className="label-premium">Kategori</label>
                  <select {...register('category')} className="input-premium py-4 appearance-none">
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="label-premium">Harga Beli (Rp)</label>
                  <input type="number" {...register('buy_price', { valueAsNumber: true })} className="input-premium py-4" placeholder="0" />
                </div>
                
                <div className="space-y-1.5">
                  <label htmlFor="buy-unit-select" className="label-premium">Satuan Beli</label>
                  <select id="buy-unit-select" {...register('buy_unit')} className="input-premium py-4 appearance-none" title="Pilih satuan beli">
                    <option value="">Pilih Unit</option>
                    {UNIT_OPTIONS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  {errors.buy_unit && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 ml-1">{errors.buy_unit.message}</p>}
                </div>
                
                <div className="space-y-1.5">
                  <label className="label-premium">Konversi (Isi per Satuan)</label>
                  <input type="number" step="any" {...register('conversion_qty', { valueAsNumber: true })} className="input-premium py-4" placeholder="10" />
                </div>
                
                <div className="space-y-1.5">
                  <label htmlFor="usage-unit-select" className="label-premium">Satuan Pakai (Usage)</label>
                  <select id="usage-unit-select" {...register('usage_unit')} className="input-premium py-4 appearance-none" title="Pilih satuan pakai">
                    <option value="">Pilih Unit</option>
                    {UNIT_OPTIONS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  {errors.usage_unit && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 ml-1">{errors.usage_unit.message}</p>}
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button type="submit" className="btn btn-primary flex-1 py-4">
                  <Save size={20} />
                  <span>{editingId ? 'Simpan Perubahan' : 'Tambahkan Ke Database'}</span>
                </button>
                <button type="button" onClick={() => setIsAdding(false)} className="btn btn-secondary px-8">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card-premium !p-0 overflow-hidden shadow-2xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Item / Bahan</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Harga Dasar Beli</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing per Unit</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {filteredIngredients.map((ing) => {
                const pricePerUnit = ing.buy_price / (ing.conversion_qty || 1);
                return (
                  <tr key={ing.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900 capitalize">{ing.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium mt-1">ID: #{ing.id?.toString().padStart(4, '0')}</div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${CATEGORY_COLORS[ing.category] || 'bg-slate-50 text-slate-400'}`}>
                        {CATEGORY_LABELS[ing.category] || ing.category}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900">Rp {ing.buy_price.toLocaleString('id-ID')}</div>
                      <div className="text-[10px] text-slate-400 font-medium leading-tight">Per {ing.buy_unit}</div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900">
                        Rp {pricePerUnit.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium leading-tight">Netto 1 {ing.usage_unit}</div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => startEdit(ing)} aria-label="Edit item" title="Edit item" className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Edit2 size={18} /></button>
                        <button onClick={() => handleDelete(ing.id!)} aria-label="Hapus item" title="Hapus item" className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredIngredients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Database size={32} className="text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Data tidak ditemukan</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus Dari Database"
        message="Anda akan menghapus item ini dari master data. Item yang sedang digunakan di resep mungkin akan menyebabkan error."
      />
    </div>
  );
}
