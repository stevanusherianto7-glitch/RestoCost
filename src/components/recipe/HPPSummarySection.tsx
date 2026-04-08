import React from 'react';
import { Calculator } from 'lucide-react';
import { CalculationResult } from '../../utils/calculations';

interface HPPSummarySectionProps {
  hppResult: CalculationResult;
}

const HPPSummarySection: React.FC<HPPSummarySectionProps> = ({ hppResult }) => {
  return (
    <div className="bg-emerald-600 p-8 rounded-3xl shadow-xl shadow-emerald-100 space-y-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
        <Calculator size={100} className="text-white" />
      </div>
      
      <div className="relative z-10">
        <h3 className="text-xs font-black text-emerald-100 uppercase tracking-widest mb-6 opacity-80">Ringkasan HPP</h3>
        <div className="space-y-4 text-sm">
          {[
            { label: 'Bahan Baku', value: hppResult.rawMaterialCost },
            { label: 'Kemasan', value: hppResult.packagingCost },
            { label: 'Biaya Produksi & Labor', value: hppResult.primeCost - hppResult.rawMaterialCost - hppResult.packagingCost },
            { label: 'Biaya Buffer (Marging)', value: hppResult.bufferCost },
          ].map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-emerald-50 border-b border-emerald-500/30 pb-2">
              <span className="font-medium opacity-80">{item.label}</span>
              <span className="font-bold">Rp {item.value.toLocaleString('id-ID')}</span>
            </div>
          ))}
          
          <div className="pt-6 flex flex-col items-end gap-1">
            <span className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">TOTAL ESTIMASI HPP</span>
            <div className="text-4xl font-black text-white drop-shadow-sm">
              Rp {hppResult.totalHPP.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HPPSummarySection;
