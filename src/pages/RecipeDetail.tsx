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
  supplies: 'Kemasan Take Away',
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
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const MARGIN = 20;
      const PAGE_WIDTH = 210;
      const CONTENT_WIDTH = PAGE_WIDTH - (2 * MARGIN); // 170mm

      doc.setProperties({
        title: `Resep - ${recipe.name}`,
        subject: 'Recipe & HPP Analysis',
        author: 'RestoCost',
        creator: 'RestoCost App',
      });

      // ── Branding & Header ──
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(16, 185, 129); // emerald-500
      doc.text('PSRestoCost ERP Engine', MARGIN + CONTENT_WIDTH, 10, { align: 'right' });
      
      doc.setDrawColor(241, 245, 249); // slate-100
      doc.line(MARGIN, 12, MARGIN + CONTENT_WIDTH, 12);

      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(recipe.name.toUpperCase(), MARGIN, 22);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`ID Resep: #${recipe.id.toString().padStart(4, '0')}`, MARGIN, 28);
      doc.text(`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`, MARGIN, 33);
      
      // Metadata Grid
      doc.setFillColor(248, 250, 252); // slate-50
      doc.roundedRect(MARGIN, 38, CONTENT_WIDTH, 12, 2, 2, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text('Waste Buffer:', MARGIN + 4, 45.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${recipe.buffer_percentage}%`, MARGIN + 31, 45.5);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Target Porsi:', MARGIN + 66, 45.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${recipe.target_portions} Porsi`, MARGIN + 91, 45.5);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Target Margin:', MARGIN + 126, 45.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${recipe.target_margin}%`, MARGIN + 156, 45.5);

      const fmtVal = (n: number) => n.toLocaleString('id-ID', { maximumFractionDigits: 1 });

      // ── BOM Table (Bill of Materials) ──
      const bomData = recipe.items.map((item, i) => {
        const ing = ingredients.find(x => x.id === item.ingredient_id);
        const costPerUnit = ing && ing.conversion_qty > 0 ? ing.buy_price / ing.conversion_qty : 0;
        const subtotal = costPerUnit * item.amount;
        const ingName = ing?.name ? ing.name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : '-';
        return [
          { content: (i + 1).toString(), styles: { halign: 'center' } },
          ingName,
          { content: CATEGORY_LABELS[ing?.category || ''] || ing?.category || '-', styles: { halign: 'center' } },
          { content: `${item.amount} ${ing?.usage_unit || ''}`, styles: { halign: 'center' } },
          { content: 'Rp', styles: { halign: 'left', textColor: [100, 116, 139] } },
          { content: fmtVal(costPerUnit), styles: { halign: 'center' } },
          { content: 'Rp', styles: { halign: 'left', textColor: [100, 116, 139] } },
          { content: fmtVal(subtotal), styles: { halign: 'center' } },
        ];
      });

      autoTable(doc, {
        startY: 54,
        margin: { left: MARGIN, right: MARGIN },
        head: [['No', 'Deskripsi Bahan Baku', 'Kategori', 'Takaran', '', 'Harga/Unit', '', 'Subtotal']],
        body: bomData,
        headStyles: { 
          fillColor: [30, 64, 175], 
          textColor: 255, 
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: 2,
          halign: 'center'
        },
        alternateRowStyles: { fillColor: [252, 252, 252] },
        styles: { 
          fontSize: 7, 
          cellPadding: 1.5, // Tighter padding for single-line focus
          font: 'helvetica',
          lineColor: [241, 245, 249],
          lineWidth: 0.1,
          overflow: 'ellipsize',
          valign: 'middle' // Ensure all cells in a row share the same baseline
        },
        columnStyles: {
          0: { cellWidth: 9, halign: 'center' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 32, halign: 'center' },
          3: { cellWidth: 18, halign: 'center' },
          4: { cellWidth: 5, halign: 'left', cellPadding: { left: 0.5, right: 0 } },
          5: { cellWidth: 22, halign: 'center' }, // Center align numeric value
          6: { cellWidth: 5, halign: 'left', cellPadding: { left: 0.5, right: 0 } },
          7: { cellWidth: 22, halign: 'center', fontStyle: 'bold' }, // Center align subtotal value
        },
      });

      // ── Cost Summary & Analysis ──
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      
      // Check if we need a new page
      let currentY = finalY;
      if (currentY > 220) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Rincian Biaya & Profitabilitas', MARGIN, currentY);

      const laborCost = hpp.primeCost - hpp.rawMaterialCost - hpp.packagingCost;
      const overheadCost = hpp.totalOperationalCost - laborCost;

      // Status Colors
      const EMERALD = [16, 185, 129];
      const ROSE = [225, 29, 72];
      const AMBER = [245, 158, 11];
      
      const profitColor = hpp.netProfit >= 0 ? EMERALD : ROSE;
      const marginColor = recipe.selling_price > hpp.totalHPP ? EMERALD : AMBER;

      const summaryData = [
        [{ content: 'HPP (COGS)', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } }, '', ''],
        ['Bahan Baku & Kemasan Take Away', 'Rp', fmtVal(hpp.rawMaterialCost + hpp.packagingCost)],
        [`Waste Buffer (${recipe.buffer_percentage}%)`, 'Rp', fmtVal(hpp.bufferCost)],
        [{ content: 'TOTAL HPP (COGS)', styles: { fontStyle: 'bold', fontSize: 11, fillColor: [241, 245, 249] } }, { content: 'Rp', styles: { fontStyle: 'bold', fontSize: 11, fillColor: [241, 245, 249] } }, { content: fmtVal(hpp.totalHPP), styles: { fontStyle: 'bold', fontSize: 11, fillColor: [241, 245, 249] } }],
        ['', '', ''],
        [{ content: 'BEBAN OPERASI (OPEX)', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } }, '', ''],
        ['Beban Tenaga Kerja', 'Rp', fmtVal(laborCost)],
        ['Beban Overhead', 'Rp', fmtVal(overheadCost)],
        [{ content: 'TOTAL OPEX', styles: { fontStyle: 'bold', fontSize: 11, fillColor: [241, 245, 249] } }, { content: 'Rp', styles: { fontStyle: 'bold', fontSize: 11, fillColor: [241, 245, 249] } }, { content: fmtVal(hpp.totalOperationalCost), styles: { fontStyle: 'bold', fontSize: 11, fillColor: [241, 245, 249] } }],
        ['', '', ''],
        [{ content: 'ESTIMASI LABA PER PORSI', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } }, '', ''],
        [{ content: 'HARGA JUAL (NETT)', styles: { fontStyle: 'bold', textColor: marginColor } }, { content: 'Rp', styles: { fontStyle: 'bold', textColor: marginColor } }, { content: fmtVal(recipe.selling_price || 0), styles: { fontStyle: 'bold', textColor: marginColor } }],
        [{ content: 'Gross Profit', styles: { fontStyle: 'bold' } }, { content: 'Rp', styles: { fontStyle: 'bold' } }, { content: fmtVal(hpp.grossProfit), styles: { fontStyle: 'bold' } }],
        [{ content: 'Net Profit', styles: { fontStyle: 'bold', fontSize: 12, fillColor: profitColor, textColor: 255 } }, { content: 'Rp', styles: { fontStyle: 'bold', fontSize: 12, fillColor: profitColor, textColor: 255 } }, { content: fmtVal(hpp.netProfit), styles: { fontStyle: 'bold', fontSize: 12, fillColor: profitColor, textColor: 255 } }],
      ];

      autoTable(doc, {
        startY: currentY + 5,
        body: summaryData,
        theme: 'plain',
        margin: { left: MARGIN, right: MARGIN },
        styles: { fontSize: 9, cellPadding: 3, halign: 'left' },
        columnStyles: {
          0: { cellWidth: CONTENT_WIDTH - 35, cellPadding: { left: 0, top: 3, bottom: 3 } },
          1: { cellWidth: 7, halign: 'left', cellPadding: { left: 0, top: 3, bottom: 3 } },
          2: { halign: 'right', cellWidth: 28, cellPadding: { right: 0, top: 3, bottom: 3 } },
        },
      });

      // ── Footer ──
      const pageCount = doc.getNumberOfPages();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        
        // Draw bottom-pinned footer
        const footerY = 287; // Optimized for A4 (297mm) to be absolute bottom but safe
        
        doc.setDrawColor(241, 245, 249);
        doc.line(MARGIN, footerY - 5, MARGIN + CONTENT_WIDTH, footerY - 5); // Separation line
        
        doc.text('Dokumen ini dihasilkan secara otomatis oleh PSRestoCost ERP Engine.', MARGIN, footerY);
        doc.text(`Halaman ${i} dari ${pageCount}`, MARGIN + CONTENT_WIDTH, footerY, { align: 'right' });
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
            aria-label="Kembali ke Daftar Resep"
            title="Kembali"
            className="p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm group"
          >
            <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h2 className="text-2xl md:text-3xl font-montserrat font-bold text-slate-900 capitalize">{recipe.name}</h2>
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
