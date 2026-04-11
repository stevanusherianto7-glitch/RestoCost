import React from 'react';
import { Calculator } from 'lucide-react';
import { CalculationResult } from '../../utils/calculations';

interface HPPSummarySectionProps {
  hppResult: CalculationResult;
}

const HPPSummarySection: React.FC<HPPSummarySectionProps> = ({ hppResult }) => {
  const laborCost = hppResult.primeCost - hppResult.rawMaterialCost - hppResult.packagingCost;
  const overheadCost = hppResult.totalOperationalCost - laborCost;

  return (
    <div className="bg-emerald-600 p-8 rounded-3xl shadow-xl shadow-emerald-100 space-y-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
        <Calculator size={100} className="text-white" />
      </div>
      
      <div className="relative z-10">
        <h3 className="text-xs font-black text-emerald-100 uppercase tracking-widest mb-6 opacity-80">Ringkasan Struktur Biaya</h3>
        
        <div className="space-y-6">
          {/* COGS */}
          <div className="space-y-3 text-sm">
            <p className="text-[10px] font-black text-emerald-50 uppercase tracking-widest border-b border-emerald-500/50 pb-1">HPP (COGS)</p>
            {[
              { label: 'Bahan Baku', value: hppResult.rawMaterialCost },
              { label: 'Kemasan', value: hppResult.packagingCost },
              { label: 'Waste Buffer', value: hppResult.bufferCost },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-emerald-50">
                <span className="font-medium opacity-80">{item.label}</span>
                <span className="font-bold">Rp {item.value.toLocaleString('id-ID')}</span>
              </div>
            ))}
            <div className="flex justify-between items-center text-white mt-2 pt-2 border-t border-emerald-500/50">
              <span className="font-black">Total HPP</span>
              <span className="font-black text-xl">Rp {hppResult.totalHPP.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* OPEX */}
          <div className="space-y-3 text-sm">
            <p className="text-[10px] font-black text-emerald-50 uppercase tracking-widest border-b border-emerald-500/50 pb-1">Beban Operasi (OPEX)</p>
            {[
              { label: 'Tenaga Kerja', value: laborCost },
              { label: 'Overhead', value: overheadCost },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-emerald-50">
                <span className="font-medium opacity-80">{item.label}</span>
                <span className="font-bold">Rp {item.value.toLocaleString('id-ID')}</span>
              </div>
            ))}
            <div className="flex justify-between items-center text-white mt-2 pt-2 border-t border-emerald-500/50">
              <span className="font-black opacity-90">Total OPEX</span>
              <span className="font-black text-xl">Rp {hppResult.totalOperationalCost.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* PROFIT */}
          <div className="space-y-3 text-sm bg-black/10 -mx-4 p-4 rounded-2xl">
            <p className="text-[10px] font-black text-amber-200 uppercase tracking-widest border-b border-emerald-500/30 pb-1 mb-2">Estimasi Laba per Porsi</p>
            <div className="flex justify-between items-center text-emerald-50">
               <span className="font-bold opacity-90">Gross Profit (Kotor)</span>
               <span className="font-bold">Rp {hppResult.grossProfit.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center text-white pt-1">
               <span className="font-black">Net Profit (Bersih)</span>
               <span className="font-black text-amber-400 text-2xl">Rp {hppResult.netProfit.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HPPSummarySection;
