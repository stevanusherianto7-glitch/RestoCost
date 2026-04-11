import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  TrendingUp, 
  AlertTriangle, 
  Package, 
  DollarSign, 
  Search,
  ShoppingCart
} from 'lucide-react';
import { ERPService } from '../services/erpService';
import { DataService } from '../services/dataService';
import { Ingredient, Recipe } from '../types';

export default function ERPDashboard() {
  const [command, setCommand] = useState('');
  const [lowStock, setLowStock] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [plData, setPlData] = useState<{ revenue: number; hpp: number; grossProfit: number; salesCount: number } | null>(null);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<number | ''>('');
  const [saleQty, setSaleQty] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const low = await ERPService.getLowStockAlerts();
      setLowStock(low);
      const allRecipes = await DataService.getRecipes();
      setRecipes(allRecipes);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const pl = await ERPService.calculateProfitLoss(today, tomorrow);
      setPlData(pl);
    } catch (err) {
      console.error('Gagal memuat data dashboard.', err);
    }
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = command.trim().toUpperCase();
    setCommand('');

    if (cmd === '[SALES_SYNC]') {
      setShowSalesModal(true);
    } else if (cmd === '[STOCK_CHECK]') {
      await loadDashboardData();
    } else if (cmd === '[PROFIT_LOSS]') {
      await loadDashboardData();
    }
  };

  const processSale = async () => {
    if (!selectedRecipe || saleQty <= 0) return;
    setIsProcessing(true);
    try {
      await ERPService.processSale(Number(selectedRecipe), saleQty);
      setShowSalesModal(false);
      setSelectedRecipe('');
      setSaleQty(1);
      await loadDashboardData();
    } catch (err: any) {
      console.error('Gagal memproses penjualan:', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header with Title & Command Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-montserrat font-bold text-slate-900 flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-2xl">
              <Terminal className="text-emerald-700 w-8 h-8" />
            </div>
            Resto ERP Engine
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Pusat Kendali Penjualan & Stok Gudang Real-time</p>
        </div>

        <form onSubmit={handleCommand} className="relative w-full md:w-96 group">
          <input 
            type="text" 
            placeholder="Ketik Perintah (e.g. [SALES_SYNC])"
            className="input-premium !pl-12 pr-4 py-4 font-mono text-sm bg-slate-900 text-emerald-400 placeholder:text-slate-600 focus:ring-emerald-500/30 border-slate-800"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
        </form>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-premium border-l-4 border-emerald-500 overflow-hidden relative group">
          <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-500">
             <DollarSign size={120} />
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="label-premium">Omzet Hari Ini</p>
              <h3 className="text-2xl font-bold text-slate-900">
                Rp {plData?.revenue.toLocaleString('id-ID') || '0'}
              </h3>
            </div>
          </div>
        </div>

        <div className="card-premium border-l-4 border-rose-500 overflow-hidden relative group">
          <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-500">
             <Package size={120} />
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-rose-50 p-3 rounded-xl text-rose-600">
              <ShoppingCart size={24} />
            </div>
            <div>
              <p className="label-premium">HPP (COGS) Hari Ini</p>
              <h3 className="text-2xl font-bold text-slate-900">
                Rp {plData?.hpp.toLocaleString('id-ID') || '0'}
              </h3>
            </div>
          </div>
        </div>

        <div className="card-premium border-l-4 border-amber-500 overflow-hidden relative group">
          <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-500">
             <AlertTriangle size={120} />
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
              <Package size={24} />
            </div>
            <div>
              <p className="label-premium">Low Stock Alert</p>
              <h3 className="text-2xl font-bold text-slate-900">{lowStock.length} Item</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alerts - Full Width */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Critical Alerts
        </h2>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-3 max-h-[400px] overflow-y-auto">
          {lowStock.length === 0 ? (
             <div className="py-12 text-center text-slate-400">
                <Package className="mx-auto mb-2 opacity-20" size={40} />
                <p>Semua stok aman.</p>
             </div>
          ) : (
            lowStock.map(ing => (
              <div key={ing.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 capitalize">{ing.name}</p>
                  <p className="text-xs text-rose-600 font-medium">Sisa: {ing.current_stock} {ing.buy_unit}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Safety</p>
                  <p className="font-bold text-slate-700">{ing.safety_stock} {ing.buy_unit}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sales Input Modal */}
      {showSalesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowSalesModal(false)}></div>
          <div className="glass-modal w-full max-w-md p-8 relative animate-in zoom-in-95 duration-200">
             <h1 className="text-3xl lg:text-4xl font-montserrat font-bold text-slate-800 flex items-center gap-3 mb-6">
                <ShoppingCart className="text-emerald-600" />
                Sales Sync Engine
             </h1>
             <div className="space-y-6">
                <div>
                   <label htmlFor="recipe-select" className="label-premium">Pilih Menu Terjual</label>
                   <select 
                     id="recipe-select"
                     title="Pilih Menu Terjual"
                     className="input-premium appearance-none"
                     value={selectedRecipe}
                     onChange={(e) => setSelectedRecipe(e.target.value)}
                   >
                      <option value="">-- Pilih Menu --</option>
                      {recipes.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                   </select>
                </div>
                <div>
                   <label htmlFor="sale-qty" className="label-premium">Jumlah Porsi</label>
                   <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setSaleQty(Math.max(1, saleQty - 1))}
                        className="btn-secondary w-12 h-12 rounded-full flex items-center justify-center"
                        title="Kurangi Jumlah"
                      >-</button>
                      <input 
                        id="sale-qty"
                        type="number" 
                        title="Jumlah Porsi"
                        className="input-premium text-center text-xl font-bold" 
                        value={saleQty}
                        onChange={(e) => setSaleQty(Number(e.target.value))}
                      />
                      <button 
                        onClick={() => setSaleQty(saleQty + 1)}
                        className="btn-secondary w-12 h-12 rounded-full flex items-center justify-center"
                      >+</button>
                   </div>
                </div>

                <div className="pt-4 flex gap-3">
                   <button 
                     onClick={() => setShowSalesModal(false)}
                     className="btn-secondary flex-1"
                   >Batal</button>
                   <button 
                     disabled={!selectedRecipe || isProcessing}
                     onClick={processSale}
                     className="btn-primary flex-1 bg-emerald-700 hover:bg-emerald-800"
                   >
                     {isProcessing ? 'Syncing...' : 'Submit Sale'}
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
