import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import clsx from 'clsx';
import { Plus, Trash2, Save, ArrowLeft, Calculator, Image as ImageIcon, Upload, X, ChefHat, FileText } from 'lucide-react';
import { Recipe, Ingredient, RecipeItem } from '../types';
import RecipeItemRow from '../components/RecipeItemRow';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const schema = z.object({
  name: z.string().min(1, "Nama resep wajib diisi"),
  image_url: z.string().optional(),
  buffer_percentage: z.number().min(0, "Buffer tidak boleh negatif"),
  labor_cost: z.number().min(0, "Biaya tenaga kerja tidak boleh negatif"),
  labor_cost_type: z.enum(['manual', 'auto']),
  target_portions: z.number().min(1, "Target porsi minimal 1"),
  overhead_electricity: z.number().min(0, "Biaya tidak boleh negatif"),
  overhead_water_gas: z.number().min(0, "Biaya tidak boleh negatif"),
  overhead_internet: z.number().min(0, "Biaya tidak boleh negatif"),
  overhead_rent: z.number().min(0, "Biaya tidak boleh negatif"),
  overhead_cleaning: z.number().min(0, "Biaya tidak boleh negatif"),
  overhead_non_prod_salary: z.number().min(0, "Biaya tidak boleh negatif"),
  selling_price: z.number().min(0, "Harga jual tidak boleh negatif"),
  tax_percentage: z.number().min(0, "Pajak tidak boleh negatif"),
  service_percentage: z.number().min(0, "Service charge tidak boleh negatif"),
  raw_materials: z.array(z.object({
    ingredient_id: z.number().min(1, "Pilih bahan"),
    amount: z.number().min(0.0001, "Jumlah harus lebih dari 0"),
  })),
  packaging: z.array(z.object({
    ingredient_id: z.number().min(1, "Pilih bahan"),
    amount: z.number().min(0.0001, "Jumlah harus lebih dari 0"),
  })),
});

type FormData = z.infer<typeof schema>;

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [targetMargin, setTargetMargin] = useState(30);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      image_url: '',
      buffer_percentage: 5,
      labor_cost: 0,
      labor_cost_type: 'manual',
      target_portions: 1,
      overhead_electricity: 0,
      overhead_water_gas: 0,
      overhead_internet: 0,
      overhead_rent: 0,
      overhead_cleaning: 0,
      overhead_non_prod_salary: 0,
      selling_price: 0,
      tax_percentage: 10,
      service_percentage: 5,
      raw_materials: [],
      packaging: [],
    }
  });

  const { fields: rawMaterialFields, append: appendRawMaterial, remove: removeRawMaterial } = useFieldArray({
    control,
    name: "raw_materials"
  });

  const { fields: packagingFields, append: appendPackaging, remove: removePackaging } = useFieldArray({
    control,
    name: "packaging"
  });

  const watchedRawMaterials = watch("raw_materials") || [];
  const watchedPackaging = watch("packaging") || [];
  const bufferPercentage = watch("buffer_percentage");
  const laborCostType = watch("labor_cost_type");
  const targetPortions = watch("target_portions") || 1;
  const manualLaborCost = watch("labor_cost") || 0;

  const totalMonthlySalary = employees.reduce((sum, emp) => sum + emp.salary, 0);
  const autoLaborCost = targetPortions > 0 ? totalMonthlySalary / targetPortions : 0;
  const laborCost = laborCostType === 'auto' ? autoLaborCost : manualLaborCost;
  
  const overheadElectricity = watch("overhead_electricity") || 0;
  const overheadWaterGas = watch("overhead_water_gas") || 0;
  const overheadInternet = watch("overhead_internet") || 0;
  const overheadRent = watch("overhead_rent") || 0;
  const overheadCleaning = watch("overhead_cleaning") || 0;
  const overheadNonProdSalary = watch("overhead_non_prod_salary") || 0;
  
  const overheadCost = overheadElectricity + overheadWaterGas + overheadInternet + overheadRent + overheadCleaning + overheadNonProdSalary;
  
  const sellingPrice = watch("selling_price") || 0;
  const taxPercentage = watch("tax_percentage") || 0;
  const servicePercentage = watch("service_percentage") || 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recipeRes, ingredientsRes, employeesRes] = await Promise.all([
          fetch(`/api/recipes/${id}`),
          fetch('/api/ingredients'),
          fetch('/api/employees')
        ]);
        
        if (!recipeRes.ok) throw new Error('Recipe not found');
        
        const recipeData = await recipeRes.json();
        const ingredientsData = await ingredientsRes.json();
        const employeesData = await employeesRes.json();
        
        setRecipe(recipeData);
        setIngredients(ingredientsData);
        setEmployees(employeesData);
        
        const rawMaterials = recipeData.items.filter((item: any) => {
          const ing = ingredientsData.find((i: any) => i.id === item.ingredient_id);
          return ing?.category !== 'supplies';
        });
        
        const packaging = recipeData.items.filter((item: any) => {
          const ing = ingredientsData.find((i: any) => i.id === item.ingredient_id);
          return ing?.category === 'supplies';
        });

        reset({
          name: recipeData.name,
          image_url: recipeData.image_url || '',
          buffer_percentage: recipeData.buffer_percentage || 5,
          labor_cost: recipeData.labor_cost || 0,
          labor_cost_type: recipeData.labor_cost_type || 'manual',
          target_portions: recipeData.target_portions || 1,
          overhead_electricity: recipeData.overhead_electricity || 0,
          overhead_water_gas: recipeData.overhead_water_gas || 0,
          overhead_internet: recipeData.overhead_internet || 0,
          overhead_rent: recipeData.overhead_rent || 0,
          overhead_cleaning: recipeData.overhead_cleaning || 0,
          overhead_non_prod_salary: recipeData.overhead_non_prod_salary || 0,
          selling_price: recipeData.selling_price || 0,
          tax_percentage: recipeData.tax_percentage ?? 10,
          service_percentage: recipeData.service_percentage ?? 5,
          raw_materials: rawMaterials.map((item: any) => ({
            ingredient_id: item.ingredient_id,
            amount: item.amount
          })),
          packaging: packaging.map((item: any) => ({
            ingredient_id: item.ingredient_id,
            amount: item.amount
          }))
        });
      } catch (error) {
        console.error(error);
        navigate('/recipes');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, reset]);

  const calculateCost = () => {
    let rawMaterialCost = 0;
    let packagingCost = 0;
    
    watchedRawMaterials.forEach((item) => {
      const ingredient = ingredients.find(i => i.id === Number(item.ingredient_id));
      if (ingredient && ingredient.conversion_qty > 0) {
        const pricePerUnit = ingredient.buy_price / ingredient.conversion_qty;
        rawMaterialCost += pricePerUnit * (Number(item.amount) || 0);
      }
    });

    watchedPackaging.forEach((item) => {
      const ingredient = ingredients.find(i => i.id === Number(item.ingredient_id));
      if (ingredient && ingredient.conversion_qty > 0) {
        const pricePerUnit = ingredient.buy_price / ingredient.conversion_qty;
        packagingCost += pricePerUnit * (Number(item.amount) || 0);
      }
    });

    const primeCost = rawMaterialCost + packagingCost + Number(laborCost);
    const bufferCost = (rawMaterialCost + packagingCost) * (Number(bufferPercentage) / 100);
    const totalHPP = primeCost + Number(overheadCost) + bufferCost;
    
    const grossProfit = Number(sellingPrice) - totalHPP;
    const margin = Number(sellingPrice) > 0 ? (grossProfit / Number(sellingPrice)) * 100 : 0;
    const foodCostPercentage = Number(sellingPrice) > 0 ? (totalHPP / Number(sellingPrice)) * 100 : 0;
    
    const serviceNominal = Number(sellingPrice) * (Number(servicePercentage) / 100);
    const taxNominal = (Number(sellingPrice) + serviceNominal) * (Number(taxPercentage) / 100);
    const finalCustomerPrice = Number(sellingPrice) + serviceNominal + taxNominal;

    const marginFactor = 1 - (Number(targetMargin) / 100);
    const recommendedPrice = marginFactor !== 0 ? totalHPP / marginFactor : totalHPP;

    return { 
      rawMaterialCost: isFinite(rawMaterialCost) ? rawMaterialCost : 0,
      packagingCost: isFinite(packagingCost) ? packagingCost : 0,
      primeCost: isFinite(primeCost) ? primeCost : 0,
      bufferCost: isFinite(bufferCost) ? bufferCost : 0,
      totalHPP: isFinite(totalHPP) ? totalHPP : 0,
      grossProfit: isFinite(grossProfit) ? grossProfit : 0,
      margin: isFinite(margin) ? margin : 0,
      foodCostPercentage: isFinite(foodCostPercentage) ? foodCostPercentage : 0,
      serviceNominal: isFinite(serviceNominal) ? serviceNominal : 0,
      taxNominal: isFinite(taxNominal) ? taxNominal : 0,
      finalCustomerPrice: isFinite(finalCustomerPrice) ? finalCustomerPrice : 0,
      recommendedPrice: isFinite(recommendedPrice) ? recommendedPrice : 0
    };
  };

  const { 
    rawMaterialCost, 
    packagingCost, 
    bufferCost, 
    totalHPP, 
    grossProfit, 
    margin, 
    foodCostPercentage,
    serviceNominal,
    taxNominal,
    finalCustomerPrice,
    recommendedPrice
  } = calculateCost();

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Laporan Resep: ${watch('name')}`, 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Total HPP: Rp ${totalHPP.toLocaleString('id-ID')}`, 14, 30);
    doc.text(`Harga Jual: Rp ${sellingPrice.toLocaleString('id-ID')}`, 14, 37);
    doc.text(`Margin: ${margin.toFixed(1)}%`, 14, 44);

    const tableData = [
      ...watchedRawMaterials.map(item => {
        const ingredient = ingredients.find(i => i.id === Number(item.ingredient_id));
        return [ingredient?.name || '-', item.amount, ingredient?.usage_unit || '-'];
      }),
      ...watchedPackaging.map(item => {
        const ingredient = ingredients.find(i => i.id === Number(item.ingredient_id));
        return [ingredient?.name || '-', item.amount, ingredient?.usage_unit || '-'];
      })
    ];

    autoTable(doc, {
      startY: 55,
      head: [['Nama Bahan', 'Jumlah', 'Satuan']],
      body: tableData,
    });

    doc.save(`Resep_${watch('name')}.pdf`);
  };

  const onSubmit = async (data: FormData) => {
    data.name = data.name.replace(/\b\w/g, (char) => char.toUpperCase());
    const payload = {
      ...data,
      overhead_cost: overheadCost,
      tax_percentage: data.tax_percentage || 0,
      service_percentage: data.service_percentage || 0,
      items: [...data.raw_materials, ...data.packaging]
    };
    
    // @ts-ignore
    delete payload.raw_materials;
    // @ts-ignore
    delete payload.packaging;
    
    await fetch(`/api/recipes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    alert('Resep berhasil disimpan!');
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6 pb-32">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          <div className="space-y-3">
            <button 
              type="button" 
              onClick={() => navigate('/recipes')} 
              className="btn btn-secondary"
            >
              <ArrowLeft size={16} />
              <span>Kembali ke Daftar Resep</span>
            </button>
          </div>
          <button
            type="button"
            onClick={exportToPDF}
            className="btn btn-secondary w-full md:w-max"
          >
            <FileText size={20} /> Simpan PDF
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <button
            type="button"
            onClick={() => setShowResults(!showResults)}
            className="btn btn-secondary w-full md:w-max"
          >
            <Calculator size={20} /> {showResults ? 'Sembunyikan Hasil Kalkulasi' : 'Tampilkan Hasil Kalkulasi HPP'}
          </button>
          
          {showResults && (
            <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-gray-800 mb-2">Rincian Biaya</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Biaya Bahan Baku: Rp {rawMaterialCost.toLocaleString('id-ID')}</p>
                  <p>Biaya Kemasan: Rp {packagingCost.toLocaleString('id-ID')}</p>
                  <p>Biaya Tenaga Kerja: Rp {laborCost.toLocaleString('id-ID')}</p>
                  <p>Biaya Overhead: Rp {overheadCost.toLocaleString('id-ID')}</p>
                  <p>Buffer: Rp {bufferCost.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-2">Ringkasan HPP</h4>
                <div className="text-2xl font-bold text-emerald-600">
                  Total HPP: Rp {totalHPP.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Harga Jual: Rp {sellingPrice.toLocaleString('id-ID')}
                </p>
                <p className="text-sm text-gray-600">
                  Margin: {margin.toFixed(1)}%
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Top Section: Basic Info & Image */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Nama Menu</label>
              <input {...register('name')} className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-lg font-medium p-3 border transition-all" placeholder="Masukkan nama menu..." />
              {errors.name && <p className="text-red-500 text-xs mt-2 font-medium">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Foto Menu</label>
              <div className="flex gap-3">
                <input {...register('image_url')} className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-3 border transition-all" placeholder="URL Gambar atau Base64..." />
                <button 
                  type="button"
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="btn btn-secondary"
                >
                  <Upload size={18} />
                  <span className="text-sm">Unggah</span>
                </button>
              </div>
              {watch('image_url') && (
                <div className="mt-4 relative w-40 h-40 rounded-2xl overflow-hidden border-2 border-emerald-50 group shadow-inner">
                  <img src={watch('image_url')} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => setValue('image_url', '')}
                    className="btn-icon absolute top-2 right-2 bg-white/90 backdrop-blur-sm shadow-md text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ingredients & Cost Components */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Raw Materials List */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">Biaya Modal Bahan Baku</h3>
                <button
                  type="button"
                  onClick={() => appendRawMaterial({ ingredient_id: 0, amount: 0 })}
                  className="btn btn-secondary"
                >
                  <Plus size={18} /> Tambah Bahan
                </button>
              </div>

              <div className="space-y-4">
                {rawMaterialFields.map((field, index) => (
                  <div key={field.id}>
                    <RecipeItemRow
                      index={index}
                      control={control}
                      remove={removeRawMaterial}
                      ingredients={ingredients.filter(i => i.category !== 'supplies')}
                      watch={watch}
                      namePrefix="raw_materials"
                    />
                  </div>
                ))}
                {rawMaterialFields.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <ChefHat size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500 font-medium">Belum ada bahan baku. Tambahkan bahan baku untuk memulai.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Packaging List */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">Biaya Modal Kemasan</h3>
                <button
                  type="button"
                  onClick={() => appendPackaging({ ingredient_id: 0, amount: 0 })}
                  className="btn btn-secondary"
                >
                  <Plus size={18} /> Tambah Kemasan
                </button>
              </div>

              <div className="space-y-4">
                {packagingFields.map((field, index) => (
                  <div key={field.id}>
                    <RecipeItemRow
                      index={index}
                      control={control}
                      remove={removePackaging}
                      ingredients={ingredients.filter(i => i.category === 'supplies')}
                      watch={watch}
                      namePrefix="packaging"
                    />
                  </div>
                ))}
                {packagingFields.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <ImageIcon size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500 font-medium">Belum ada kemasan. Tambahkan kemasan jika diperlukan.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Costs */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Biaya Operasional (Per Porsi)</h3>
              
              <div className="space-y-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Metode Biaya Tenaga Kerja</label>
                    <select 
                      {...register('labor_cost_type')}
                      className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base font-medium p-3 border transition-all"
                    >
                      <option value="manual">Input Manual (Per Porsi)</option>
                      <option value="auto">Otomatis (Total Gaji / Target Porsi)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Target Porsi per Bulan</label>
                    <input 
                      type="number" 
                      {...register('target_portions', { valueAsNumber: true })} 
                      className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base font-medium p-3 border transition-all" 
                      placeholder="Contoh: 1000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                      {laborCostType === 'auto' ? 'Biaya Tenaga Kerja (Hasil Kalkulasi)' : 'Tenaga Kerja Langsung (Rp)'}
                    </label>
                    <div className="relative">
                      <input 
                        type="number" 
                        {...register('labor_cost', { valueAsNumber: true })} 
                        value={laborCostType === 'auto' ? autoLaborCost.toFixed(0) : (Number.isNaN(watch('labor_cost')) ? '' : (watch('labor_cost') ?? ''))} 
                        disabled={laborCostType === 'auto'}
                        className={clsx(
                          "block w-full rounded-xl border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base font-medium p-3 border transition-all",
                          laborCostType === 'auto' && "bg-gray-50 text-gray-500"
                        )} 
                      />
                      {laborCostType === 'auto' && (
                        <div className="mt-2 text-[10px] text-emerald-600 font-medium">
                          Berdasarkan total gaji Rp {totalMonthlySalary.toLocaleString('id-ID')} / {targetPortions} porsi
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Buffer / Waste (%)</label>
                    <input type="number" step="0.1" {...register('buffer_percentage', { valueAsNumber: true })} value={Number.isNaN(watch('buffer_percentage')) ? '' : (watch('buffer_percentage') ?? '')} className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base font-medium p-3 border transition-all" />
                  </div>
                </div>
              </div>

              <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-3">Rincian Biaya Overhead (Per Porsi)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Listrik & AC (Rp)</label>
                  <input type="number" {...register('overhead_electricity', { valueAsNumber: true })} value={Number.isNaN(watch('overhead_electricity')) ? '' : (watch('overhead_electricity') ?? '')} className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm font-medium p-2.5 border transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Air & Gas (Rp)</label>
                  <input type="number" {...register('overhead_water_gas', { valueAsNumber: true })} value={Number.isNaN(watch('overhead_water_gas')) ? '' : (watch('overhead_water_gas') ?? '')} className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm font-medium p-2.5 border transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Internet / WiFi (Rp)</label>
                  <input type="number" {...register('overhead_internet', { valueAsNumber: true })} value={Number.isNaN(watch('overhead_internet')) ? '' : (watch('overhead_internet') ?? '')} className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm font-medium p-2.5 border transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Sewa Tempat (Rp)</label>
                  <input type="number" {...register('overhead_rent', { valueAsNumber: true })} value={Number.isNaN(watch('overhead_rent')) ? '' : (watch('overhead_rent') ?? '')} className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm font-medium p-2.5 border transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Kebersihan (Rp)</label>
                  <input type="number" {...register('overhead_cleaning', { valueAsNumber: true })} value={Number.isNaN(watch('overhead_cleaning')) ? '' : (watch('overhead_cleaning') ?? '')} className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm font-medium p-2.5 border transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Gaji Non-Produksi (Rp)</label>
                  <input type="number" {...register('overhead_non_prod_salary', { valueAsNumber: true })} value={Number.isNaN(watch('overhead_non_prod_salary')) ? '' : (watch('overhead_non_prod_salary') ?? '')} className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm font-medium p-2.5 border transition-all" />
                </div>
              </div>
              <div className="mt-8 pt-4 border-t border-gray-50 flex justify-between items-center bg-gray-50/50 p-4 rounded-xl">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Total Overhead:</span>
                <span className="text-lg font-bold text-gray-900">Rp {overheadCost.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Summary & Pricing */}
          <div className="space-y-6">
            <div className="bg-emerald-600 p-8 rounded-2xl shadow-xl shadow-emerald-100 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Calculator size={80} className="text-white" />
              </div>
              <h3 className="text-xs font-semibold text-emerald-100 uppercase tracking-widest">Ringkasan HPP</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-emerald-50">
                  <span className="font-medium opacity-80">Bahan Baku</span>
                  <span className="font-semibold">Rp {rawMaterialCost.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-emerald-50">
                  <span className="font-medium opacity-80">Kemasan</span>
                  <span className="font-semibold">Rp {packagingCost.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-emerald-50">
                  <span className="font-medium opacity-80">Tenaga Kerja</span>
                  <span className="font-semibold">Rp {laborCost.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-emerald-50">
                  <span className="font-medium opacity-80">Overhead</span>
                  <span className="font-semibold">Rp {overheadCost.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-emerald-50">
                  <span className="font-medium opacity-80">Buffer ({bufferPercentage}%)</span>
                  <span className="font-semibold">Rp {bufferCost.toLocaleString('id-ID')}</span>
                </div>
                <div className="pt-4 mt-4 border-t border-emerald-500/50 flex justify-between items-end">
                  <span className="text-xs font-semibold text-emerald-200 uppercase tracking-widest">TOTAL HPP</span>
                  <span className="text-2xl font-bold text-white leading-none">Rp {totalHPP.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Harga Jual Menu (Rp)</label>
              <input 
                type="number" 
                {...register('selling_price', { valueAsNumber: true })} 
                value={Number.isNaN(watch('selling_price')) ? '' : (watch('selling_price') ?? '')}
                className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-2xl font-bold p-4 border transition-all text-emerald-600" 
                placeholder="0"
              />
              <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600">
                  <Calculator size={14} />
                </div>
                <div className="text-[10px] text-amber-700 font-semibold uppercase tracking-wider">
                  Rekomendasi (Margin {targetMargin}%): <span className="text-amber-900 ml-1">Rp {recommendedPrice.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-50">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Service (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    {...register('service_percentage', { valueAsNumber: true })} 
                    value={Number.isNaN(watch('service_percentage')) ? '' : (watch('service_percentage') ?? '')}
                    className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm font-semibold p-2.5 border transition-all" 
                  />
                  <div className="text-[10px] text-gray-400 mt-1.5 font-medium">Rp {serviceNominal.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Pajak / PB1 (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    {...register('tax_percentage', { valueAsNumber: true })} 
                    value={Number.isNaN(watch('tax_percentage')) ? '' : (watch('tax_percentage') ?? '')}
                    className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm font-semibold p-2.5 border transition-all" 
                  />
                  <div className="text-[10px] text-gray-400 mt-1.5 font-medium">Rp {taxNominal.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-50 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-400 uppercase tracking-widest">Harga Jual</span>
                  <span className="font-semibold text-gray-700">Rp {sellingPrice.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-400 uppercase tracking-widest">Service Charge</span>
                  <span className="font-semibold text-gray-700">Rp {serviceNominal.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-400 uppercase tracking-widest">Pajak</span>
                  <span className="font-semibold text-gray-700">Rp {taxNominal.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between items-center bg-red-600 p-4 rounded-2xl shadow-lg shadow-red-100 mt-4 transform hover:scale-[1.02] transition-transform">
                  <span className="text-xs font-bold text-red-100 uppercase tracking-widest">Harga Final</span>
                  <span className="text-xl font-bold text-white">Rp {finalCustomerPrice.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Sticky Bottom Analysis Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-gray-200 p-4 z-20 shadow-[0_-8px_30px_rgb(0,0,0,0.08)]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Target Margin Slider */}
          <div className="flex-1 w-full md:w-auto">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Opsi Target Margin</label>
              <span className="text-sm font-bold text-emerald-600">{targetMargin}%</span>
            </div>
            <input 
              type="range" 
              min="20" 
              max="200" 
              value={targetMargin} 
              onChange={(e) => setTargetMargin(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[8px] text-gray-400 font-bold mt-1">
              <span>20%</span>
              <span>200%</span>
            </div>
          </div>

          {/* Analysis Stats */}
          <div className="flex items-center gap-8 border-l border-gray-100 pl-8">
            <div className="text-center">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">HPP</span>
              <span className="text-sm font-bold text-gray-900">Rp {totalHPP.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="text-center">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Profit</span>
              <span className={`text-sm font-bold ${grossProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                Rp {grossProfit.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="text-center bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Margin Saat Ini</span>
              <span className={`text-xl font-bold tracking-tight ${margin >= 30 ? 'text-emerald-600' : margin >= 15 ? 'text-amber-500' : 'text-red-500'}`}>
                {margin.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Recommended Action */}
          <div className="hidden lg:block bg-emerald-50 p-3 rounded-xl border border-emerald-100">
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1">Rekomendasi Harga</div>
            <div className="text-lg font-bold text-emerald-900">Rp {recommendedPrice.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</div>
          </div>
        </div>
      </div>

      {/* Photo Upload Modal */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Unggah Foto Menu</h3>
              <button onClick={() => setIsPhotoModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 font-medium">Klik untuk memilih foto</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF hingga 5MB</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setValue('image_url', reader.result as string);
                        setIsPhotoModalOpen(false);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
