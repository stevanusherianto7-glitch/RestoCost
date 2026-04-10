import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, FileText, ChevronLeft, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Recipe, RecipeItem, Ingredient } from '../types';
import { DataService } from '../services/dataService';
import { calculateHPP } from '../utils/calculations';
import RecipeItemsSection from '../components/recipe/RecipeItemsSection';
import OperationalCostsSection from '../components/recipe/OperationalCostsSection';
import HPPSummarySection from '../components/recipe/HPPSummarySection';
import HPPAnalysisBar from '../components/recipe/HPPAnalysisBar';

const CATEGORY_LABELS: Record<string, string> = {
  perishable: 'Bahan Segar',
  dry_goods: 'Bahan Pokok',
  condiment: 'Bumbu & Saus',
  processed: 'Bahan Olahan',
  supplies: 'Kemasan & Lainnya',
  spices: 'Rempah & Aromatik',
};

const fmtRp = (n: number) => `Rp ${n.toLocaleString('id-ID', { maximumFractionDigits: 2 })}`;

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
      await loadRecipe(recipe.id);
    } catch (error) {
      console.error('Error saving recipe:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const generatePDF = () => {
    if (!recipe) return;
    setIsExporting(true);

    try {
      const hpp = calculateHPP(recipe, ingredients);
      const doc = new jsPDF();
      const fileName = `Resep_${recipe.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}`;

      doc.setProperties({
        title: `Resep - ${recipe.name}`,
        subject: 'Recipe & HPP Analysis',
        author: 'RestoCost',
        creator: 'RestoCost App',
      });

      // ── Header ──
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42);
      doc.text(recipe.name, 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 30);
      doc.text(`Buffer: ${recipe.buffer_percentage}%  |  Target: ${recipe.target_portions} porsi`, 14, 36);

      // ── BOM Table ──
      const bomData = recipe.items.map((item, i) => {
        const ing = ingredients.find(x => x.id === item.ingredient_id);
        const costPerUnit = ing && ing.conversion_qty > 0 ? ing.buy_price / ing.conversion_qty : 0;
        const subtotal = costPerUnit * item.amount;
        return [
          i + 1,
          ing?.name || '-',
          CATEGORY_LABELS[ing?.category || ''] || ing?.category || '-',
          `${item.amount} ${ing?.usage_unit || ''}`,
          fmtRp(costPerUnit),
          fmtRp(subtotal),
        ];
      });

      autoTable(doc, {
        startY: 44,
        head: [['No', 'Bahan', 'Kategori', 'Takaran', 'Harga/Unit', 'Subtotal']],
        body: bomData,
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 10 },
          4: { halign: 'right' },
          5: { halign: 'right' },
        },
      });

      // ── Cost Summary ──
      const summaryY = (doc as any).lastAutoTable.finalY + 12;

      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text('Ringkasan HPP', 14, summaryY);

      const summaryRows = [
        ['Biaya Bahan Baku', fmtRp(hpp.rawMaterialCost)],
        ['Biaya Kemasan', fmtRp(hpp.packagingCost)],
        ['Biaya Tenaga Kerja', fmtRp(recipe.labor_cost || 0)],
        ['Overhead per Porsi', fmtRp(recipe.overhead_cost || 0)],
        ['Buffer / Waste (' + recipe.buffer_percentage + '%)', fmtRp(hpp.bufferCost)],
        ['TOTAL HPP', fmtRp(hpp.totalHPP)],
      ];

      autoTable(doc, {
        startY: summaryY + 4,
        body: summaryRows,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 80 },
          1: { halign: 'right' },
        },
        didParseCell: (data: any) => {
          if (data.row.index === summaryRows.length - 1) {
            data.cell.styles.fillColor = [16, 185, 129];
            data.cell.styles.textColor = 255;
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 12;
          }
        },
      });

      // ── Pricing Analysis ──
      const pricingY = (doc as any).lastAutoTable.finalY + 12;

      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text('Analisis Harga Jual', 14, pricingY);

      const pricingRows = [
        ['Harga Jual', fmtRp(recipe.selling_price || 0)],
        ['Laba Kotor', fmtRp(hpp.grossProfit)],
        ['Food Cost %', `${hpp.foodCostPercentage.toFixed(1)}%`],
        ['Margin', `${hpp.currentMargin.toFixed(1)}%`],
        ['Harga Rekomendasi', fmtRp(hpp.recommendedPrice)],
      ];

      autoTable(doc, {
        startY: pricingY + 4,
        body: pricingRows,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 80 },
          1: { halign: 'right' },
        },
      });

      // ── Footer ──
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(180);
        doc.text(`RestoCost — ${recipe.name} — Hal ${i}/${pageCount}`, 14, doc.internal.pageSize.height - 10);
      }

      // ── Save with explicit filename ──
      const pdfBlob = doc.output('blob');
      const cleanName = `Resep_${recipe.name}_${new Date().toISOString().split('T')[0]}`
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_\-]/g, '')
        + '.pdf';

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = cleanName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsExporting(false);
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
            aria-label="Kembali ke daftar resep"
            title="Kembali ke daftar resep"
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
            onClick={generatePDF}
            disabled={isExporting}
            className="btn btn-secondary flex-1 md:flex-none border-slate-200 bg-white"
            aria-label="Save PDF"
            title="Simpan sebagai PDF"
          >
            <FileText size={20} />
            <span>{isExporting ? 'Exporting...' : 'Save PDF'}</span>
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
