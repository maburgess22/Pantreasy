// components/tabs/ShoppingTab.tsx
import React from 'react';
import { ShoppingItem, PantryItem } from '@/utils/types';
import FoodAutocomplete from '@/components/ui/FoodAutocomplete';
import CustomSelect from '@/components/ui/CustomSelect';

interface ShoppingTabProps {
  shoppingDropdownRef: React.RefObject<HTMLDivElement>;
  showAddShoppingMenu: boolean;
  setShowAddShoppingMenu: (val: boolean) => void;
  showShoppingInput: boolean;
  setShowShoppingInput: (val: boolean) => void;
  shoppingInputName: string;
  setShoppingInputName: (val: string) => void;
  shoppingInputQty: string;
  setShoppingInputQty: (val: string) => void;
  shoppingInputUnit: string;
  setShoppingInputUnit: (val: string) => void;
  COMMON_UNITS: string[];
  loading: boolean;
  handleAddShoppingItem: (e: React.FormEvent) => void;
  setVoiceContext: (val: 'pantry' | 'shopping') => void;
  setShowVoiceInputScreen: (val: boolean) => void;
  addLowStockToShopping: () => void;
  lowStockItems: PantryItem[];
  hasCheckedShoppingItems: boolean;
  removeCheckedShoppingItems: () => void;
  groupedShoppingList: Record<string, ShoppingItem[]>;
  toggleShoppingItem: (id: string) => void;
  deleteShoppingItem: (id: string) => void;
  showToast: (msg: string) => void;
}

export default function ShoppingTab({
  shoppingDropdownRef, showAddShoppingMenu, setShowAddShoppingMenu, showShoppingInput, setShowShoppingInput,
  shoppingInputName, setShoppingInputName, shoppingInputQty, setShoppingInputQty, shoppingInputUnit, setShoppingInputUnit,
  COMMON_UNITS, loading, handleAddShoppingItem, setVoiceContext, setShowVoiceInputScreen,
  addLowStockToShopping, lowStockItems, hasCheckedShoppingItems, removeCheckedShoppingItems,
  groupedShoppingList, toggleShoppingItem, deleteShoppingItem, showToast
}: ShoppingTabProps) {

  // Updated Export Logic for crisp line breaks
  const handleExport = () => {
    if (Object.keys(groupedShoppingList).length === 0) return showToast('Shopping list is empty!');
    const lines = ['📋 MY SHOPPING LIST', ''];
    Object.entries(groupedShoppingList).forEach(([cat, list]) => {
      lines.push(`[ ${cat.toUpperCase()} ]`);
      list.forEach(item => { lines.push(`${item.checked ? '[x]' : '[ ]'} ${item.name} (${item.quantity} ${item.unit})`); });
      lines.push('');
    });
    navigator.clipboard.writeText(lines.join('\n'));
    showToast('Shopping list copied to clipboard!');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-[#6B705C] text-white p-6 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 rounded-[32px] shadow-sm border border-black/10">
        <div>
          <h2 className="text-4xl md:text-5xl font-bold leading-snug">Shopping List</h2>
          <p className="text-white/80 text-sm mt-2 font-medium">Keep track of what you need to buy.</p>
        </div>
        
        <div className="flex flex-col gap-3 shrink-0 w-full md:w-56">
          <div className="relative w-full" ref={shoppingDropdownRef}>
            <button onClick={() => setShowAddShoppingMenu(!showAddShoppingMenu)} className="w-full px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium transition hover:bg-black/80 shadow-sm flex items-center justify-between md:justify-center gap-2 border border-black/20">
              Add Item ▾
            </button>
            {showAddShoppingMenu && (
              <div className="absolute left-0 md:left-auto md:right-0 mt-2 w-full md:w-[240px] max-w-[90vw] bg-[#1A1A1A] rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-[100] flex flex-col text-white">
                <button onClick={() => { setShowShoppingInput(true); setShowAddShoppingMenu(false); }} className="px-5 py-4 text-left text-sm font-semibold hover:bg-white/10 transition border-b border-white/5">Type Item Name</button>
                <button onClick={() => { setVoiceContext('shopping'); setShowVoiceInputScreen(true); setShowAddShoppingMenu(false); }} className="px-5 py-4 text-left text-sm font-semibold hover:bg-white/10 transition">Voice Input</button>
              </div>
            )}
          </div>

          <button onClick={handleExport} className="w-full px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium transition hover:bg-black/80 shadow-sm flex items-center justify-center gap-2 border border-black/20">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
             Export List
          </button>

          <button onClick={addLowStockToShopping} disabled={lowStockItems.length === 0} className="w-full px-5 py-2.5 bg-white text-black rounded-xl text-sm font-bold transition hover:bg-gray-100 disabled:opacity-50 shadow-sm border border-black/20 text-center">
            + Restock Alerts
          </button>
        </div>
      </div>

      {showShoppingInput && (
        <form onSubmit={handleAddShoppingItem} className="flex flex-col gap-3 mb-8 animate-in fade-in slide-in-from-top-2 p-6 bg-[#6B705C]/10 border border-black/10 rounded-[28px] relative z-0 hover:z-10">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B705C]">Add Manually</h3>
            <button type="button" onClick={() => setShowShoppingInput(false)} className="text-sm font-bold text-black/40 hover:text-black">✕ Close</button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full relative z-0 hover:z-10">
            <FoodAutocomplete 
              value={shoppingInputName} 
              onChange={setShoppingInputName} 
              onSelect={(val, cat) => setShoppingInputName(val)}
              placeholder="Type product name..."
              className="w-full px-4 py-3 rounded-2xl text-base focus:outline-none bg-white border border-black/20 text-black shadow-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <input type="number" step="any" min="0.01" value={shoppingInputQty} onChange={(e) => setShoppingInputQty(e.target.value)} className="w-16 md:w-20 px-2 py-3 rounded-2xl text-center text-base focus:outline-none bg-white border border-black/20 text-black shadow-sm" />
              <CustomSelect 
                value={shoppingInputUnit} 
                onChange={setShoppingInputUnit} 
                options={COMMON_UNITS.map(u => ({label: u, value: u}))} 
                className="w-24 md:w-28 bg-white rounded-2xl border border-black/20 shadow-sm"
              />
            </div>
          </div>
          <button type="submit" className="w-full px-6 py-3 font-medium rounded-2xl bg-black text-white hover:bg-black/80 shadow-sm mt-2">Add Item</button>
        </form>
      )}

      {hasCheckedShoppingItems && (
        <button onClick={removeCheckedShoppingItems} className="w-full mb-4 px-6 py-3.5 bg-red-50 text-red-700 border border-red-200 rounded-2xl font-bold hover:bg-red-100 transition shadow-sm">
          Remove all crossed off Items
        </button>
      )}

      <div className="space-y-6">
        {Object.keys(groupedShoppingList).length === 0 ? (
          <p className="text-center text-black/60 py-8">Your list is empty.</p>
        ) : (
          Object.entries(groupedShoppingList).map(([aisle, aisleItems]) => (
            <div key={aisle} className="bg-white rounded-[24px] p-5 border border-black/10 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B705C] mb-4 pb-2 border-b border-black/10">{aisle}</h3>
              <div className="space-y-2">
                {aisleItems.map(item => (
                  <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border border-black/10 transition ${item.checked ? 'bg-black/5 opacity-60' : 'bg-white shadow-sm'}`}>
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input type="checkbox" checked={item.checked} onChange={() => toggleShoppingItem(item.id)} className="w-5 h-5 accent-black rounded cursor-pointer shrink-0" />
                      <span className={`font-medium ${item.checked ? 'line-through text-black/50' : ''}`}>
                        {item.name} <span className="text-xs font-normal text-black/60 ml-1">({item.quantity || 1} {item.unit || 'pcs'})</span>
                      </span>
                    </label>
                    <button onClick={() => deleteShoppingItem(item.id)} className="text-black/40 hover:text-red-600 font-bold px-2 text-sm shrink-0">✕</button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}