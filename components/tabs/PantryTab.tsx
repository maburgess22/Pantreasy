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
    const orig = item.original_quantity || item.quantity || 1;
    const newPct = orig > 0 ? Math.round((newQty / orig) * 100) : 100;

    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty, percentage_left: newPct, original_quantity: orig } : i));
    await supabase.from('pantry_items').update({ quantity: newQty, percentage_left: newPct, original_quantity: orig }).eq('id', item.id).eq('user_id', userId);
    
    if (pantryActionMenu.item && pantryActionMenu.item.id === item.id) { 
      setPantryActionMenu({ isOpen: true, item: { ...pantryActionMenu.item, quantity: newQty, percentage_left: newPct, original_quantity: orig } }); 
    }
  };

  const handlePercentageDrag = (item: PantryItem, newPct: number) => {
    const orig = item.original_quantity || item.quantity || 1;
    const newQty = Number(((orig * newPct) / 100).toFixed(2));
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty, percentage_left: newPct, original_quantity: orig } : i));
    if (pantryActionMenu.item && pantryActionMenu.item.id === item.id) {
      setPantryActionMenu(prev => ({ isOpen: true, item: { ...prev.item!, quantity: newQty, percentage_left: newPct, original_quantity: orig } }));
    }
  };

  const handlePercentageSave = async (id: string) => {
    const currentItem = items.find(i => i.id === id);
    if (currentItem) {
      await supabase.from('pantry_items').update({ 
        quantity: currentItem.quantity, 
        percentage_left: currentItem.percentage_left, 
        original_quantity: currentItem.original_quantity 
      }).eq('id', currentItem.id).eq('user_id', userId);
    }
  };

  const togglePercentageView = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newVal = item.show_percentage === false ? true : false;
    
    setItems(prev => prev.map(i => i.id === id ? { ...i, show_percentage: newVal } : i));
    if (pantryActionMenu.item && pantryActionMenu.item.id === id) {
       setPantryActionMenu(prev => ({ isOpen: true, item: { ...prev.item!, show_percentage: newVal } }));
    }
    await supabase.from('pantry_items').update({ show_percentage: newVal }).eq('id', id).eq('user_id', userId);
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
    const qty = parseFloat(editQuantity) || 0;
    const updatedItem = { 
      name: (editName || '').trim(), 
      category: cleanCat, 
      quantity: qty, 
      unit: editUnit,
      expiration_date: editExpirationDate || null,
      original_quantity: qty, 
      percentage_left: 100 
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Object.keys(groupedItems).length > 0 ? (
          Object.entries(groupedItems).map(([groupCategory, groupList]) => {
            return (
              <div key={groupCategory} className="space-y-3 mb-4">
                <div className="flex items-center gap-2 pb-1.5 border-b-2 border-black/10 pl-1">
                  <span className="text-sm font-extrabold tracking-widest uppercase text-black">{groupCategory}</span>
                </div>
                
                <div className="space-y-2">
                  {groupList.map((item) => {
                    const expiry = getExpiryStatus(item.expiration_date);
                    const isMeasurable = ['ml', 'l', 'g', 'kg', 'oz', 'lbs', 'fl oz'].includes((item.unit || '').toLowerCase());
                    const pctLeft = item.percentage_left ?? 100;
                    const showPct = item.show_percentage !== false;
                    
                    return (
                      <div key={item.id} className="flex items-center p-3 rounded-[20px] transition bg-white border border-black/10 shadow-sm relative z-0 hover:z-10 gap-2">
                        
                        <div className="flex flex-col justify-center min-w-0 pr-2" style={{ flex: 2 }}>
                          <div className="flex flex-col items-start gap-1">
                            <h3 className="font-semibold text-sm capitalize text-black leading-tight break-words m-0">
                              {item.name}
                            </h3>
                            {expiry.color !== 'none' && (
                              <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                                expiry.color === 'expired' ? 'bg-red-600 text-white' :
                                expiry.color === 'warning' ? 'bg-amber-500 text-white' :
                                'bg-black/10 text-black/70'
                              }`}>
                                {expiry.label}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex justify-center items-center px-1" style={{ flex: 1 }}>
                          <span className="text-xs font-bold text-black/60 normal-case whitespace-nowrap text-center">
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                          
                        <div className="flex justify-end items-center pl-1" style={{ flex: 1 }}>
                          {isMeasurable && showPct && (
                            <div className="flex items-center gap-1.5 w-full max-w-[80px]">
                              <div className="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-300 ${pctLeft < 25 ? 'bg-red-600' : 'bg-[#6B705C]'}`} 
                                  style={{ width: `${pctLeft}%` }}
                                />
                              </div>
                              <span className={`text-[10px] font-bold w-6 text-right shrink-0 ${pctLeft < 25 ? 'text-red-600' : 'text-black/50'}`}>
                                {pctLeft}%
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <button onClick={() => setPantryActionMenu({isOpen: true, item})} className="p-2 hover:bg-black/5 rounded-full text-black/40 hover:text-black transition shrink-0 ml-1">
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
              
              <div className="bg-black/5 rounded-2xl p-4 mb-4 flex flex-col gap-3 shadow-sm">
                 <div className="flex items-center justify-between">
                   <span className="font-semibold text-xs uppercase tracking-wider text-black/60">Amount</span>
                   <div className="flex items-center gap-3">
                      <button onClick={() => adjustQuantity(pantryActionMenu.item!, -1)} className="w-8 h-8 rounded-lg bg-white shadow-sm font-bold flex items-center justify-center hover:bg-black/5">-</button>
                      <span className="font-bold min-w-[3rem] text-center text-sm">{pantryActionMenu.item.quantity} {pantryActionMenu.item.unit}</span>
                      <button onClick={() => adjustQuantity(pantryActionMenu.item!, 1)} className="w-8 h-8 rounded-lg bg-white shadow-sm font-bold flex items-center justify-center hover:bg-black/5">+</button>
                   </div>
                 </div>

                 {['ml', 'l', 'g', 'kg', 'oz', 'lbs', 'fl oz'].includes((pantryActionMenu.item.unit || '').toLowerCase()) && (
                   <div className="pt-3 border-t border-black/10 flex flex-col gap-2 mt-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-[10px] uppercase tracking-wider text-black/60">Estimated Remaining</span>
                        <span className={`font-bold text-xs ${(pantryActionMenu.item.percentage_left ?? 100) < 25 ? 'text-red-600' : 'text-[#6B705C]'}`}>
                           {pantryActionMenu.item.percentage_left ?? 100}%
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={pantryActionMenu.item.percentage_left ?? 100} 
                        onChange={(e) => handlePercentageDrag(pantryActionMenu.item!, parseInt(e.target.value))}
                        onMouseUp={() => handlePercentageSave(pantryActionMenu.item!.id)}
                        onTouchEnd={() => handlePercentageSave(pantryActionMenu.item!.id)}
                        className={`w-full h-2 bg-black/10 rounded-lg appearance-none cursor-pointer ${(pantryActionMenu.item.percentage_left ?? 100) < 25 ? 'accent-red-600' : 'accent-black'}`}
                      />
                   </div>
                 )}
              </div>

              <div className="flex flex-col gap-2">
                 {/* Updated Checkbox Toggle */}
                 {['ml', 'l', 'g', 'kg', 'oz', 'lbs', 'fl oz'].includes((pantryActionMenu.item.unit || '').toLowerCase()) && (
                   <button onClick={() => togglePercentageView(pantryActionMenu.item!.id)} className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl transition shadow-sm flex items-center justify-between px-5">
                     <span className="font-bold text-black text-sm">Show % Bar on List</span>
                     <div className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-md border-2 transition ${pantryActionMenu.item.show_percentage !== false ? 'border-black bg-black' : 'border-black/20 bg-white'}`}>
                       {pantryActionMenu.item.show_percentage !== false && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                     </div>
                   </button>
                 )}
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