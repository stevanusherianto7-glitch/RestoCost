import { useState, useEffect, useRef } from 'react';
import { useController, Control, UseFormWatch } from 'react-hook-form';
import { Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { Ingredient } from '../types';
import clsx from 'clsx';

interface RecipeItemRowProps {
  control: Control<any>;
  index: number;
  remove: (index: number) => void;
  ingredients: Ingredient[];
  watch: UseFormWatch<any>;
  namePrefix: string;
}

export default function RecipeItemRow({ control, index, remove, ingredients, watch, namePrefix }: RecipeItemRowProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { field: idField } = useController({
    control,
    name: `${namePrefix}.${index}.ingredient_id`,
  });

  const { field: amountField } = useController({
    control,
    name: `${namePrefix}.${index}.amount`,
  });

  // Sync query with selected ingredient when loaded or changed externally
  useEffect(() => {
    const selected = ingredients.find(i => i.id === Number(idField.value));
    if (selected) {
      setQuery(selected.name);
    } else if (idField.value === 0) {
      setQuery('');
    }
  }, [idField.value, ingredients]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // If query doesn't match selection, revert or clear? 
        // Let's keep it simple: if valid ID is set, revert query to name. If not, clear.
        const selected = ingredients.find(i => i.id === Number(idField.value));
        if (selected) {
          setQuery(selected.name);
        } else {
          setQuery('');
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [idField.value, ingredients]);

  const filteredIngredients = query === ''
    ? ingredients
    : ingredients.filter((ing) =>
        ing.name.toLowerCase().includes(query.toLowerCase())
      );

  const handleSelect = (ing: Ingredient) => {
    idField.onChange(ing.id);
    setQuery(ing.name);
    setIsOpen(false);
  };

  const selectedIng = ingredients.find(i => i.id === Number(idField.value));
  const cost = selectedIng 
    ? (selectedIng.buy_price / selectedIng.conversion_qty) * (Number(amountField.value) || 0)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-50/50 p-4 rounded-xl border border-gray-100 group hover:bg-white hover:shadow-md transition-all duration-200">
      <div className="md:col-span-6 relative" ref={wrapperRef}>
        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
          {namePrefix === 'packaging' ? 'Bahan Kemasan' : 'Bahan Baku'}
        </label>
        <div className="relative">
          <input
            type="text"
            className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-4 py-2.5 border pr-10 bg-white transition-all"
            placeholder={namePrefix === 'packaging' ? 'Cari kemasan...' : 'Cari bahan baku...'}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              if (e.target.value === '') idField.onChange(0);
            }}
            onFocus={() => setIsOpen(true)}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronsUpDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        {isOpen && (
          <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-base shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-gray-100">
            {filteredIngredients.length === 0 ? (
              <li className="relative cursor-default select-none py-3 pl-4 pr-9 text-gray-500 italic">
                Tidak ditemukan.
              </li>
            ) : (
              filteredIngredients.map((ing) => (
                <li
                  key={ing.id}
                  className={clsx(
                    'relative cursor-default select-none py-2.5 pl-4 pr-9 hover:bg-emerald-50 cursor-pointer transition-colors',
                    ing.id === idField.value ? 'text-emerald-900 bg-emerald-50' : 'text-gray-900'
                  )}
                  onClick={() => handleSelect(ing)}
                >
                  <div className="flex flex-col">
                    <span className={clsx('block truncate', ing.id === idField.value ? 'font-bold' : 'font-medium')}>
                      {ing.name}
                    </span>
                    <span className="block truncate text-[10px] text-gray-500 uppercase tracking-tight">
                      {ing.usage_unit} • Rp {ing.buy_price.toLocaleString('id-ID')} / {ing.buy_unit}
                    </span>
                  </div>
                  {ing.id === idField.value && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-emerald-600">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <div className="md:col-span-2">
        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 truncate">
          Jumlah {selectedIng ? `(${selectedIng.usage_unit})` : ''}
        </label>
        <input
          type="number"
          step="any"
          {...amountField}
          value={Number.isNaN(amountField.value) ? '' : (amountField.value ?? '')}
          onChange={(e) => amountField.onChange(e.target.valueAsNumber)}
          className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-4 py-2.5 border bg-white transition-all"
          placeholder="0"
        />
      </div>

      <div className="md:col-span-3 text-right">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Subtotal</div>
        <div className="text-base font-bold text-emerald-600 leading-none">
          Rp {cost.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
        </div>
      </div>

      <div className="md:col-span-1 flex justify-end items-center">
        <button 
          type="button" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            remove(index);
          }} 
          className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2.5 rounded-xl transition-all duration-200 border border-transparent hover:border-red-100 shadow-sm hover:shadow-md active:scale-95"
          title="Hapus item"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
}
