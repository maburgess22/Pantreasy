// components/tabs/PantryTab.tsx
import React from 'react';
import { PantryItem } from '@/utils/types';
import FoodAutocomplete from '@/components/ui/FoodAutocomplete';
import CustomSelect from '@/components/ui/CustomSelect';

interface PantryTabProps {
  pantryDropdownRef: React.RefObject<HTMLDivElement>;
  showAddPantryMenu: boolean;
  setShowAddPantryMenu: (val: boolean) => void;
  showPantryInput: boolean;
  setShowPantryInput: (val: boolean) => void;
  name: string;
  useStateName: (val: string) => void;
  handleNameChange: (e: any) => void;
  category: string;
  setCategory: (val: string) => void;
  setIsManualCategory: (val: boolean) => void;
  dynamicCategories: string[];
  quantity: string;
  setQuantity: (val: string) => void;
  unit: string;
  setUnit: (val: string) => void;
  COMMON_UNITS: string[];
  loading: boolean;
  addItem: (e: React.FormEvent) => void;
  setShowBarcodeScanner: (val: boolean) => void;
  setVoiceContext: (val: 'pantry' | 'shopping') => void;
  setShowVoiceInputScreen: (val: boolean) => void;
  isScanning: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  groupedItems: Record<string, PantryItem[]>;
  setPantryActionMenu: (val: { isOpen: boolean; item: PantryItem | null }) => void;
  showToast: (msg: string) => void;
}

export default function PantryTab({
  pantryDropdownRef, showAddPantryMenu, setShowAddPantryMenu, showPantryInput, setShowPantryInput,
  name, useStateName, handleNameChange, category, setCategory, setIsManualCategory, dynamicCategories,
  quantity, setQuantity, unit, setUnit, COMMON_UNITS, loading, addItem, setShowBarcodeScanner,
  setVoiceContext, setShowVoiceInputScreen, isScanning, fileInputRef, groupedItems, setPantryActionMenu, showToast
}: PantryTabProps) {

  // Updated Export Logic for crisp line breaks
  const handleExport = () => {
    if (Object.keys(groupedItems).length === 0) return showToast('Pantry is empty!');
    const lines = ['🛒 MY PANTRY INVENTORY', ''];
    Object.entries(groupedItems).forEach(([cat, list]) => {
      lines.push(`[ ${cat.toUpperCase()} ]`);
      list.forEach(item => { lines.push(`• ${item.name} - ${item.quantity} ${item.unit}`); });
      lines.push('');
    });
    navigator.clipboard.writeText(lines.join('\n'));
    showToast('Pantry copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#6B705C] text-white p-6 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 rounded-[32px] shadow-sm border border-black/10">
        <div>
          <h2 className="text-4xl md:text-5xl font-bold leading-snug">Pantry Inventory</h2>
          <p className="text-white/80 text-sm mt-2 font-medium">Keep track of your ingredients.</p>
        </div>
        
        <div className="flex flex-col gap-3 shrink-0 w-full md:w-48">
          <div className="relative w-full" ref={pantryDropdownRef}>
            <button onClick={() => setShowAddPantryMenu(!showAddPantryMenu)} className="w-full px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium transition hover:bg-black/80 shadow-sm flex items-center justify-between md:justify-center gap-2 border border-black/20">
              Add Item ▾
            </button>
            {showAddPantryMenu && (
              <div className="absolute left-0 md:left-auto md:right-0 mt-2 w-full md:w-[240px] max-w-[90vw] bg-[#1A1A1A] rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-[100] flex flex-col text-white">
                <button onClick={() => { setShowPantryInput(true); setShowAddPantryMenu(false); }} className="px-5 py-4 text-left text-sm font-semibold hover:bg-white/10 transition border-b border-white/5">Type Item Name</button>
                <button onClick={() => { fileInputRef.current?.click(); setShowAddPantryMenu(false); }} className="px-5 py-4 text-left text-sm font-semibold hover:bg-white/10 transition border-b border-white/5">Scan Receipt</button>
                <button onClick={() => { setShowBarcodeScanner(true); setShowAddPantryMenu(false); }} className="px-5 py-4 text-left text-sm font-semibold hover:bg-white/10 transition border-b border-white/5">Scan Barcode</button>
                <button onClick={() => { setVoiceContext('pantry'); setShowVoiceInputScreen(true); setShowAddPantryMenu(false); }} className="px-5 py-4 text-left text-sm font-semibold hover:bg-white/10 transition">Voice Input</button>
              </div>
            )}
          </div>
          
          <button onClick={handleExport} className="w-full px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium transition hover:bg-black/80 shadow-sm flex items-center justify-center gap-2 border border-black/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            Export List
          </button>
        </div>
      </div>

      {isScanning && <div className="text-center font-bold animate-pulse text-[#6B705C]">Reading Receipt...</div>}

      {showPantryInput && (
        <form onSubmit={addItem} className="flex flex-col gap-3 mb-8 animate-in fade-in slide-in-from-top-2 p-6 bg-[#6B705C]/10 border border-black/10 rounded-[28px] relative z-0 hover:z-10">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B705C]">Add Manually</h3>
            <button type="button" onClick={() => setShowPantryInput(false)} className="text-sm font-bold text-black/40 hover:text-black">✕ Close</button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <FoodAutocomplete 
              value={name} 
              onChange={(val) => { useStateName(val); handleNameChange({ target: { value: val } } as any); }}
              onSelect={(val, cat) => { useStateName(val); setCategory(cat !== 'Other' ? cat : val); setIsManualCategory(true); }}
              placeholder="Item name (e.g. Crisp Lettuce)"
              className="w-full sm:flex-1 px-4 py-3 rounded-2xl text-base focus:outline-none bg-white border border-black/20 text-black shadow-sm"
            />
            <CustomSelect 
              value={category} 
              onChange={(v) => { setCategory(v); setIsManualCategory(true); }} 
              options={dynamicCategories.map(c => ({label: c, value: c}))} 
              className="w-full sm:w-48 bg-white rounded-2xl border border-black/20 shadow-sm"
            />
            <div className="flex gap-2 w-full sm:w-auto">
              <input type="number" step="any" min="0.01" placeholder="Qty" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-16 px-2 py-3 rounded-2xl text-center text-base focus:outline-none bg-white border border-black/20 text-black shadow-sm" />
              <CustomSelect 
                value={unit} 
                onChange={setUnit} 
                options={COMMON_UNITS.map(u => ({label: u, value: u}))} 
                className="flex-1 sm:w-28 bg-white rounded-2xl border border-black/20 shadow-sm"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full sm:w-auto px-8 font-medium py-3.5 rounded-2xl transition text-base shadow-md active:scale-95 disabled:opacity-50 bg-black text-white hover:bg-black/80">Add</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.keys(groupedItems).length > 0 ? (
          Object.entries(groupedItems).map(([groupCategory, groupList]) => {
            return (
              <div key={groupCategory} className="rounded-[28px] p-5 space-y-3 bg-[#6B705C]/30 border border-black/10 shadow-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-black/10">
                  <span className="text-sm font-semibold tracking-wider uppercase text-black">{groupCategory}</span>
                </div>
                <div className="space-y-2">
                  {groupList.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-[20px] transition bg-white border border-black/10 shadow-sm relative z-0 hover:z-10">
                      <div>
                        <h3 className="font-semibold text-base capitalize text-black leading-tight mb-1">{item.name}</h3>
                        <p className="text-sm text-black/70 font-normal">{item.quantity} {item.unit}</p>
                      </div>
                      <button onClick={() => setPantryActionMenu({isOpen: true, item})} className="p-2 hover:bg-black/5 rounded-full text-black/40 hover:text-black transition shrink-0">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-base py-6 col-span-full text-black/60">No pantry items stored.</p>
        )}
      </div>
    </div>
  );
}