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

  const handleExport = () => {
    if (Object.keys(groupedItems).length === 0) return showToast('Pantry is empty!');
    const lines = ['🛒 MY PANTRY INVENTORY', ''];
    Object.entries(groupedItems).forEach(([cat, list]) => {
      lines.push(`[ ${cat.toUpperCase()} ]`);
      list.forEach(item => { lines.push(`• ${item.name} - ${item.quantity} ${item.unit}`); });
      lines.push('');
    });
    navigator.clipboard.writeText(lines.join('\r\n'));
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
            <button onClick={() => setShowAddPantryMenu(!showAddPantryMenu)} className="relative w-full px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium transition hover:bg-black/80 shadow-sm flex items-center justify-center border border-black/20">
              <span>Add Item</span>
              <span className="absolute right-4 text-[10px]">▼</span>
            </button>
            {showAddPantryMenu && (
              <div className="absolute left-0 md:left-auto md:right-0 mt-2 w-full md:w-[240px] max-w-[90vw] bg-[#1A1A1A] rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-[100] flex flex-col text-white">
                <button onClick={() => { setShowPantryInput(true); setShowAddPantryMenu(false); }} className="px-5 py-4 text-center text-sm font-semibold hover:bg-white/10 transition border-b border-white/5">Type Item Name</button>
                <button onClick={() => { fileInputRef.current?.click(); setShowAddPantryMenu(false); }} className="px-5 py-4 text-center text-sm font-semibold hover:bg-white/10 transition border-b border-white/5">Scan Receipt</button>
                <button onClick={() => { setShowBarcodeScanner(true); setShowAddPantryMenu(false); }} className="px-5 py-4 text-center text-sm font-semibold hover:bg-white/10 transition border-b border-white/5">Scan Barcode</button>
                <button onClick={() => { setVoiceContext('pantry'); setShowVoiceInputScreen(true); setShowAddPantryMenu(false); }} className="px-5 py-4 text-center text-sm font-semibold hover:bg-white/10 transition">Voice Input</button>
              </div>
            )}
          </div>
          
          <button onClick={handleExport} className="relative w-full px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium transition hover:bg-black/80 shadow-sm flex items-center justify-center gap-2 border border-black/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            <span>Export List</span>
          </button>
        </div>
      </div>

      {isScanning && <div className="text-center font-bold animate-pulse text-[#6B705C]">Reading Receipt...</div>}

      {/* NEW MODAL FOR ADDING ITEMS */}
      {showPantryInput && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-[32px] p-6 md:p-8 w-full max-w-md shadow-2xl flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-2 border-b border-black/10 pb-4 shrink-0">
              <h2 className="text-2xl font-bold text-black">Add Item Manually</h2>
              <button type="button" onClick={() => setShowPantryInput(false)} className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 text-black font-bold">✕</button>
            </div>
            
            <form id="addPantryForm" onSubmit={addItem} className="space-y-4 mt-2 overflow-y-auto pr-1 flex-1">
              <div className="space-y-1.5 relative z-20">
                <label className="text-xs font-bold uppercase tracking-wider text-black/60">Item Name</label>
                <FoodAutocomplete 
                  value={name} 
                  onChange={(val) => { useStateName(val); handleNameChange({ target: { value: val } } as any); }}
                  onSelect={(val, cat) => { useStateName(val); setCategory(cat !== 'Other' ? cat : val); setIsManualCategory(true); }}
                  placeholder="e.g. Crisp Lettuce"
                  className="w-full px-4 py-3 rounded-xl bg-black/5 focus:outline-none border border-transparent focus:border-[#6B705C] text-black font-medium text-base"
                  autoFocus
                />
              </div>
              <div className="flex gap-4 relative z-0">
                <div className="space-y-1.5 flex-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-black/60">Quantity</label>
                  <input type="number" step="any" min="0.01" placeholder="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-black/5 focus:outline-none border border-transparent focus:border-[#6B705C] text-black font-medium text-center text-base" required />
                </div>
                <div className="space-y-1.5 flex-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-black/60">Unit</label>
                  <CustomSelect 
                    value={unit} 
                    onChange={setUnit} 
                    options={COMMON_UNITS.map(u => ({label: u, value: u}))} 
                  />
                </div>
              </div>
            </form>
            
            <div className="pt-2 shrink-0">
              <button type="submit" form="addPantryForm" disabled={loading} className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-black/80 shadow-sm transition">
                {loading ? 'Adding...' : 'Add to Pantry'}
              </button>
            </div>
          </div>
        </div>
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