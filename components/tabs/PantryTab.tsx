import React, { useState } from 'react';
import { PantryItem } from '@/utils/types';
import CustomSelect from '@/components/ui/CustomSelect';
import { createClient } from '@/utils/supabase/client';
import { getAisle, getExpiryStatus } from '@/utils/helpers';

interface PantryTabProps {
  userId: string;
  items: PantryItem[];
  setItems: React.Dispatch<React.SetStateAction<PantryItem[]>>;
  addOrMergePantryItem: (newItem: { name: string; category: string; quantity: number; unit: string; track_low_stock: boolean; low_stock_threshold: number; expiration_date?: string | null }) => Promise<void>;
  dynamicCategories: string[];
  COMMON_UNITS: string[];
  setShowBarcodeScanner: (val: boolean) => void;
  setVoiceContext: (val: 'pantry' | 'shopping') => void;
  setShowVoiceInputScreen: (val: boolean) => void;
  isScanning: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  showToast: (msg: string) => void;
}

export default function PantryTab({
  userId, items, setItems, addOrMergePantryItem, dynamicCategories, COMMON_UNITS,
  setShowBarcodeScanner, setVoiceContext, setShowVoiceInputScreen, isScanning,
  fileInputRef, showToast
}: PantryTabProps) {

  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const [showAddPantryMenu, setShowAddPantryMenu] = useState(false);
  const [showPantryInput, setShowPantryInput] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Produce');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [isManualCategory, setIsManualCategory] = useState(false);

  const [pantryActionMenu, setPantryActionMenu] = useState<{isOpen: boolean, item: PantryItem | null}>({isOpen: false, item: null});
  const [editingPantryItem, setEditingPantryItem] = useState<PantryItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editExpirationDate, setEditExpirationDate] = useState('');

  const visiblePantryItems = items.filter(i => i.quantity > 0);
  const groupedItems = visiblePantryItems.reduce((acc, item) => { 
    acc[item.category] = acc[item.category] || []; 
    acc[item.category].push(item); 
    return acc; 
  }, {} as Record<string, PantryItem[]>);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const val = e.target.value; 
    setName(val); 
    if (!isManualCategory && val.length > 2) setCategory(getAisle(val)); 
  };
  
  const addItem = async (e: React.FormEvent) => {
    e.preventDefault(); if (!name.trim()) return; setLoading(true);
    await addOrMergePantryItem({ 
      name: name.trim(), 
      category, 
      quantity: parseFloat(quantity) || 1, 
      unit, 
      track_low_stock: false, 
      low_stock_threshold: 1,
      expiration_date: null 
    });
    setName(''); setQuantity('1'); setIsManualCategory(false); setLoading(false); setShowPantryInput(false); showToast('Item added to pantry!');
  };

  const deleteItem = async (id: string) => { 
    const item = items.find(i => i.id === id);
    if (item?.track_low_stock) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: 0 } : i));
      await supabase.from('pantry_items').update({ quantity: 0 }).eq('id', id).eq('user_id', userId);
      showToast('Item removed from pantry (still tracked).');
    } else {
      setItems(prev => prev.filter(item => item.id !== id)); 
      await supabase.from('pantry_items').delete().eq('id', id).eq('user_id', userId); 
      showToast('Item deleted.'); 
    }
  };

  const adjustQuantity = async (item: PantryItem, delta: number) => {
    const newQty = Math.max(0, Number((item.quantity + delta).toFixed(2))); 
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));
    await supabase.from('pantry_items').update({ quantity: newQty }).eq('id', item.id).eq('user_id', userId);
    if (pantryActionMenu.item && pantryActionMenu.item.id === item.id) { 
      setPantryActionMenu({ isOpen: true, item: { ...pantryActionMenu.item, quantity: newQty } }); 
    }
  };

  const startEditing = (item: PantryItem) => { 
    setEditingPantryItem(item); 
    setEditName(item.name || ''); 
    setEditQuantity(item.quantity != null ? item.quantity.toString() : '1'); 
    setEditUnit(item.unit || 'pcs'); 
    setEditExpirationDate(item.expiration_date || ''); 
  };

  const saveEdit = async (id: string) => {
    const cleanCat = getAisle(editName.trim());
    const updatedItem = { 
      name: (editName || '').trim(), 
      category: cleanCat, 
      quantity: parseFloat(editQuantity) || 0, 
      unit: editUnit,
      expiration_date: editExpirationDate || null 
    };
    if (!updatedItem.name) return showToast("Item name cannot be empty.");
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updatedItem } : item));
    setEditingPantryItem(null); 
    await supabase.from('pantry_items').update(updatedItem).eq('id', id).eq('user_id', userId);
    showToast('Item updated!');
  };

  const handleExport = () => {
    if (Object.keys(groupedItems).length === 0) return showToast('Pantry is empty!');
    const lines = ['🛒 MY PANTRY INVENTORY', ''];
    Object.entries(groupedItems).forEach(([cat, list]) => {
      lines.push(`[ ${cat.toUpperCase()} ]`);
      list.forEach(item => { lines.push(`• ${item.name} - ${item.quantity} ${item.unit}${item.expiration_date ? ` (Exp: ${item.expiration_date})` : ''}`); });
      lines.push('');
    });
    navigator.clipboard.writeText(lines.join('\r\n'));
    showToast('Pantry copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-[#6B705C] text-white py-8 shadow-sm mb-6 border-b border-black/10 -mt-4 md:-mt-8">
        <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col items-center text-center gap-5 pt-4 md:pt-0">
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-snug font-mogena text-center">Pantry Inventory</h2>
            <p className="text-white/80 text-sm mt-2 font-medium text-center">Keep track of your ingredients.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto justify-center flex-wrap">
            <button onClick={() => setShowAddPantryMenu(true)} className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium transition hover:bg-black/80 shadow-sm flex items-center justify-center border border-black/20">
              Add Item
            </button>
            <button onClick={handleExport} className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium transition hover:bg-black/80 shadow-sm flex items-center justify-center gap-2 border border-black/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              <span>Export List</span>
            </button>
          </div>
        </div>
      </div>

      {showAddPantryMenu && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity" onClick={() => setShowAddPantryMenu(false)}>
          <div className="bg-white w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-6 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95" onClick={e => e.stopPropagation()}>
             <h3 className="font-bold text-xl mb-6 text-center border-b border-black/10 pb-4">Add Pantry Item</h3>
             <div className="flex flex-col gap-2">
               <button onClick={() => { setShowPantryInput(true); setShowAddPantryMenu(false); }} className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition shadow-sm">Type Item Name</button>
               <button onClick={() => { fileInputRef.current?.click(); setShowAddPantryMenu(false); }} className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition shadow-sm">Scan Receipt</button>
               <button onClick={() => { setShowBarcodeScanner(true); setShowAddPantryMenu(false); }} className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition shadow-sm">Scan Barcode</button>
               <button onClick={() => { setVoiceContext('pantry'); setShowVoiceInputScreen(true); setShowAddPantryMenu(false); }} className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition shadow-sm">Voice Input</button>
             </div>
          </div>
        </div>
      )}

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
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="e.g. Crisp Lettuce"
                  className="w-full px-4 py-3 rounded-xl bg-black/5 focus:outline-none border border-transparent focus:border-[#6B705C] text-black font-medium text-base"
                  required
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
                    placeholder="Unit"
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
                  {groupList.map((item) => {
                    const expiry = getExpiryStatus(item.expiration_date);
                    return (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-[20px] transition bg-white border border-black/10 shadow-sm relative z-0 hover:z-10 gap-2">
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="font-semibold text-base capitalize text-black leading-tight whitespace-normal break-words m-0">
                            {item.name} <span className="text-sm font-normal text-black/60 normal-case whitespace-nowrap">- {item.quantity} {item.unit}</span>
                          </h3>
                        </div>
                        {expiry.color !== 'none' && (
                          <div className="shrink-0 flex items-center pr-1">
                            <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              expiry.color === 'expired' ? 'bg-red-600 text-white' :
                              expiry.color === 'warning' ? 'bg-amber-500 text-white' :
                              'bg-black/10 text-black/70'
                            }`}>
                              {expiry.label}
                            </span>
                          </div>
                        )}
                        <button onClick={() => setPantryActionMenu({isOpen: true, item})} className="p-2 hover:bg-black/5 rounded-full text-black/40 hover:text-black transition shrink-0">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-base py-6 col-span-full text-black/60">No pantry items stored.</p>
        )}
      </div>

      {pantryActionMenu.isOpen && pantryActionMenu.item && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity" onClick={() => setPantryActionMenu({isOpen: false, item: null})}>
           <div className="bg-white w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-6 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-xl mb-6 text-center border-b border-black/10 pb-4">{pantryActionMenu.item.name}</h3>
              <div className="bg-black/5 rounded-2xl p-4 mb-4 flex items-center justify-between shadow-sm">
                 <span className="font-semibold text-xs uppercase tracking-wider text-black/60">Amount</span>
                 <div className="flex items-center gap-3">
                    <button onClick={() => adjustQuantity(pantryActionMenu.item!, -1)} className="w-8 h-8 rounded-lg bg-white shadow-sm font-bold flex items-center justify-center hover:bg-black/5">-</button>
                    <span className="font-bold min-w-[3rem] text-center text-sm">{pantryActionMenu.item.quantity} {pantryActionMenu.item.unit}</span>
                    <button onClick={() => adjustQuantity(pantryActionMenu.item!, 1)} className="w-8 h-8 rounded-lg bg-white shadow-sm font-bold flex items-center justify-center hover:bg-black/5">+</button>
                 </div>
              </div>
              <div className="flex flex-col gap-2">
                 <button onClick={() => { startEditing(pantryActionMenu.item!); setPantryActionMenu({isOpen: false, item: null}); }} className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition shadow-sm">Edit Details</button>
                 <button onClick={() => { deleteItem(pantryActionMenu.item!.id); setPantryActionMenu({isOpen: false, item: null}); }} className="w-full py-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl font-bold transition mt-2 shadow-sm">Remove Item</button>
              </div>
           </div>
        </div>
      )}

      {editingPantryItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-[32px] p-6 md:p-8 w-full max-w-md shadow-2xl flex flex-col gap-4 animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-2 border-b border-black/10 pb-4 shrink-0">
               <h2 className="text-2xl font-bold text-black">Edit Item</h2>
               <button onClick={() => setEditingPantryItem(null)} className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 text-black font-bold">✕</button>
             </div>
             
             <div className="space-y-4 mt-2 overflow-y-auto pr-1 flex-1">
               <div className="space-y-1.5 relative z-20">
                 <label className="text-xs font-bold uppercase tracking-wider text-black/60">Item Name</label>
                 <input
                    type="text"
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Item name"
                    className="w-full px-4 py-3 rounded-xl bg-black/5 focus:outline-none border border-transparent focus:border-[#6B705C] text-black font-medium text-base"
                    required
                  />
               </div>
               
               <div className="grid grid-cols-2 gap-4 relative z-0">
                 <div className="space-y-1.5 w-full">
                   <label className="text-xs font-bold uppercase tracking-wider text-black/60">Quantity</label>
                   <input type="number" step="any" min="0.01" value={editQuantity} onChange={e => setEditQuantity(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-black/5 focus:outline-none border border-transparent focus:border-[#6B705C] text-black font-medium text-center text-base" />
                 </div>
                 <div className="space-y-1.5 w-full">
                   <label className="text-xs font-bold uppercase tracking-wider text-black/60">Unit</label>
                   <CustomSelect 
                      value={editUnit} 
                      onChange={setEditUnit} 
                      options={COMMON_UNITS.map(u => ({label: u, value: u}))}
                      className="w-full h-[48px]"
                   />
                 </div>
               </div>

               <div className="space-y-1.5 relative z-0">
                 <label className="text-xs font-bold uppercase tracking-wider text-black/60">Expiration Date</label>
                 <input 
                   type="date" 
                   value={editExpirationDate} 
                   onChange={e => setEditExpirationDate(e.target.value)} 
                   className="w-full px-4 py-3 rounded-xl bg-black/5 focus:outline-none border border-transparent focus:border-[#6B705C] text-black font-medium text-base"
                 />
               </div>
             </div>
             
             <div className="pt-2 shrink-0">
                <button onClick={() => saveEdit(editingPantryItem.id)} className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-black/80 shadow-sm transition">Save Changes</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}