import React, { useState, useEffect } from 'react';
import { ShoppingItem, PantryItem } from '@/utils/types';
import CustomSelect from '@/components/ui/CustomSelect';
import { createClient } from '@/utils/supabase/client';
import { getAisle } from '@/utils/helpers';

interface ShoppingTabProps {
  userId: string;
  shoppingList: ShoppingItem[];
  setShoppingList: React.Dispatch<React.SetStateAction<ShoppingItem[]>>;
  addOrMergeShoppingItem: (newItem: { name: string; quantity: number; unit: string; }) => Promise<void>;
  lowStockItems: PantryItem[];
  COMMON_UNITS: string[];
  setVoiceContext: (val: 'pantry' | 'shopping') => void;
  setShowVoiceInputScreen: (val: boolean) => void;
  addLowStockToShopping: () => void;
  showToast: (msg: string) => void;
}

export default function ShoppingTab({
  userId, shoppingList, setShoppingList, addOrMergeShoppingItem, lowStockItems,
  COMMON_UNITS, setVoiceContext, setShowVoiceInputScreen,
  addLowStockToShopping, showToast
}: ShoppingTabProps) {

  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const [showAddShoppingMenu, setShowAddShoppingMenu] = useState(false);
  const [showShoppingInput, setShowShoppingInput] = useState(false);
  const [shoppingInputName, setShoppingInputName] = useState('');
  const [shoppingInputQty, setShoppingInputQty] = useState('1');
  const [shoppingInputUnit, setShoppingInputUnit] = useState('pcs');

  const [shoppingActionMenu, setShoppingActionMenu] = useState<{isOpen: boolean, item: ShoppingItem | null}>({isOpen: false, item: null});
  const [editingShoppingItem, setEditingShoppingItem] = useState<ShoppingItem | null>(null);
  const [editShoppingName, setEditShoppingName] = useState('');
  const [editShoppingQuantity, setEditShoppingQuantity] = useState('');
  const [editShoppingUnit, setEditShoppingUnit] = useState('');

  useEffect(() => {
    if (showAddShoppingMenu || showShoppingInput || shoppingActionMenu.isOpen || editingShoppingItem) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [showAddShoppingMenu, showShoppingInput, shoppingActionMenu.isOpen, editingShoppingItem]);

  const hasCheckedShoppingItems = shoppingList.some(item => item.checked);
  
  const groupedShoppingList = shoppingList.reduce((acc, item) => { 
    const aisle = getAisle(item.name); 
    acc[aisle] = acc[aisle] || []; 
    acc[aisle].push(item); 
    return acc; 
  }, {} as Record<string, ShoppingItem[]>);

  const handleAddShoppingItem = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!shoppingInputName.trim()) return; 
    setLoading(true);
    await addOrMergeShoppingItem({ name: shoppingInputName.trim(), quantity: parseFloat(shoppingInputQty) || 1, unit: shoppingInputUnit }); 
    setShoppingInputName(''); setShoppingInputQty('1'); setShoppingInputUnit('pcs'); setShowShoppingInput(false); showToast('Added to list!'); 
    setLoading(false);
  };

  const toggleShoppingItem = async (id: string) => { 
    const item = shoppingList.find(i => i.id === id); if (!item) return; 
    setShoppingList(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i)); 
    await supabase.from('shopping_list').update({ checked: !item.checked }).eq('id', id).eq('user_id', userId); 
  };
  
  const deleteShoppingItem = async (id: string) => { 
    setShoppingList(prev => prev.filter(item => item.id !== id)); 
    await supabase.from('shopping_list').delete().eq('id', id).eq('user_id', userId); 
  };
  
  const removeCheckedShoppingItems = async () => { 
    const checkedIds = shoppingList.filter(item => item.checked).map(item => item.id); 
    if (checkedIds.length === 0) return; 
    setShoppingList(prev => prev.filter(item => !item.checked)); 
    await supabase.from('shopping_list').delete().in('id', checkedIds).eq('user_id', userId); 
    showToast('Checked items removed.'); 
  };

  const adjustShoppingQuantity = async (item: ShoppingItem, delta: number) => {
    const newQty = Math.max(0, Number(((item.quantity || 1) + delta).toFixed(2))); 
    setShoppingList(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));
    await supabase.from('shopping_list').update({ quantity: newQty }).eq('id', item.id).eq('user_id', userId);
    if (shoppingActionMenu.item && shoppingActionMenu.item.id === item.id) { 
       setShoppingActionMenu({ isOpen: true, item: { ...shoppingActionMenu.item, quantity: newQty } }); 
    }
  };

  const startEditingShopping = (item: ShoppingItem) => { 
    setEditingShoppingItem(item); 
    setEditShoppingName(item.name || ''); 
    setEditShoppingQuantity(item.quantity != null ? item.quantity.toString() : '1'); 
    setEditShoppingUnit(item.unit || 'pcs'); 
  };

  const saveShoppingEdit = async (id: string) => {
    const updatedItem = { name: (editShoppingName || '').trim(), quantity: parseFloat(editShoppingQuantity) || 0, unit: editShoppingUnit };
    if (!updatedItem.name) return showToast("Item name cannot be empty.");
    setShoppingList(prev => prev.map(item => item.id === id ? { ...item, ...updatedItem } : item));
    setEditingShoppingItem(null); 
    await supabase.from('shopping_list').update(updatedItem).eq('id', id).eq('user_id', userId);
  };

  const handleExport = () => {
    if (Object.keys(groupedShoppingList).length === 0) return showToast('Shopping list is empty!');
    const lines = ['📋 MY SHOPPING LIST', ''];
    Object.entries(groupedShoppingList).forEach(([cat, list]) => {
      lines.push(`[ ${cat.toUpperCase()} ]`);
      list.forEach(item => { lines.push(`${item.checked ? '[x]' : '[ ]'} ${item.name} - ${item.quantity} ${item.unit}`); });
      lines.push('');
    });
    navigator.clipboard.writeText(lines.join('\r\n'));
    showToast('Shopping list copied to clipboard!');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-[#6B705C] text-white py-8 shadow-sm mb-6 border-b border-black/10 -mt-4 md:-mt-8">
        <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col items-center text-center gap-5 pt-4 md:pt-0">
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-snug font-mogena text-center">Shopping List</h2>
            <p className="text-white/80 text-sm mt-2 font-medium text-center">Keep track of what you need to buy.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto justify-center">
            <button onClick={() => setShowAddShoppingMenu(true)} className="px-8 py-2.5 bg-black text-white rounded-xl text-sm font-medium transition hover:bg-black/80 shadow-sm flex items-center justify-center border border-black/20">
              Add Item
            </button>
            <button onClick={handleExport} className="px-8 py-2.5 bg-black text-white rounded-xl text-sm font-medium transition hover:bg-black/80 shadow-sm flex items-center justify-center gap-2 border border-black/20">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
               <span>Export List</span>
            </button>
          </div>
        </div>
      </div>

      {showAddShoppingMenu && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity" onClick={() => setShowAddShoppingMenu(false)}>
          <div className="bg-white w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-6 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95" onClick={e => e.stopPropagation()}>
             <h3 className="font-bold text-xl mb-6 text-center border-b border-black/10 pb-4">Add to List</h3>
             <div className="flex flex-col gap-2">
               <button onClick={() => { setShowShoppingInput(true); setShowAddShoppingMenu(false); }} className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition shadow-sm">Type Item Name</button>
               <button onClick={() => { setVoiceContext('shopping'); setShowVoiceInputScreen(true); setShowAddShoppingMenu(false); }} className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition shadow-sm">Voice Input</button>
               <button onClick={() => { addLowStockToShopping(); setShowAddShoppingMenu(false); }} disabled={lowStockItems.length === 0} className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">Add Items from Restock Alerts</button>
             </div>
          </div>
        </div>
      )}

      {showShoppingInput && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-[32px] p-6 md:p-8 w-full max-w-md shadow-2xl flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-2 border-b border-black/10 pb-4 shrink-0">
              <h2 className="text-2xl font-bold text-black font-mogena">Add Item Manually</h2>
              <button type="button" onClick={() => setShowShoppingInput(false)} className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 text-black font-bold">✕</button>
            </div>
            
            <form id="addShoppingForm" onSubmit={handleAddShoppingItem} className="space-y-4 mt-2 overflow-y-auto pr-1 flex-1">
              <div className="space-y-1.5 relative z-20">
                <label className="text-xs font-bold uppercase tracking-wider text-black/60">Item Name</label>
                <input
                  type="text"
                  value={shoppingInputName}
                  onChange={(e) => setShoppingInputName(e.target.value)}
                  placeholder="e.g. Crisp Lettuce"
                  className="w-full px-4 py-3 rounded-xl bg-black/5 focus:outline-none border border-transparent focus:border-[#6B705C] text-black font-medium text-base"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-4 relative z-0">
                <div className="space-y-1.5 flex-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-black/60">Quantity</label>
                  <input type="number" step="any" min="0.01" placeholder="1" value={shoppingInputQty} onChange={(e) => setShoppingInputQty(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-black/5 focus:outline-none border border-transparent focus:border-[#6B705C] text-black font-medium text-center text-base" required />
                </div>
                <div className="space-y-1.5 flex-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-black/60">Unit</label>
                  <CustomSelect 
                    value={shoppingInputUnit} 
                    onChange={setShoppingInputUnit} 
                    options={COMMON_UNITS.map(u => ({label: u, value: u}))} 
                    placeholder="Unit"
                  />
                </div>
              </div>
            </form>
            
            <div className="pt-2 shrink-0">
              <button type="submit" form="addShoppingForm" disabled={loading} className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-black/80 shadow-sm transition">
                {loading ? 'Adding...' : 'Add to List'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHOPPING ITEM EDIT MENUS */}
      {shoppingActionMenu.isOpen && shoppingActionMenu.item && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity" onClick={() => setShoppingActionMenu({isOpen: false, item: null})}>
           <div className="bg-white w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-6 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-xl mb-6 text-center border-b border-black/10 pb-4">{shoppingActionMenu.item.name}</h3>
              <div className="bg-black/5 rounded-2xl p-4 mb-4 flex items-center justify-between shadow-sm">
                 <span className="font-semibold text-xs uppercase tracking-wider text-black/60">Amount</span>
                 <div className="flex items-center gap-3">
                    <button onClick={() => adjustShoppingQuantity(shoppingActionMenu.item!, -1)} className="w-8 h-8 rounded-lg bg-white shadow-sm font-bold flex items-center justify-center hover:bg-black/5">-</button>
                    <span className="font-bold min-w-[3rem] text-center text-sm">{shoppingActionMenu.item.quantity} {shoppingActionMenu.item.unit}</span>
                    <button onClick={() => adjustShoppingQuantity(shoppingActionMenu.item!, 1)} className="w-8 h-8 rounded-lg bg-white shadow-sm font-bold flex items-center justify-center hover:bg-black/5">+</button>
                 </div>
              </div>
              <div className="flex flex-col gap-2">
                 <button onClick={() => { startEditingShopping(shoppingActionMenu.item!); setShoppingActionMenu({isOpen: false, item: null}); }} className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition shadow-sm">Edit Details</button>
                 <button onClick={() => { deleteShoppingItem(shoppingActionMenu.item!.id); setShoppingActionMenu({isOpen: false, item: null}); }} className="w-full py-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl font-bold transition mt-2 shadow-sm">Remove Item</button>
              </div>
           </div>
        </div>
      )}

      {editingShoppingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-[32px] p-6 md:p-8 w-full max-w-md shadow-2xl flex flex-col gap-4 animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-2 border-b border-black/10 pb-4 shrink-0">
               <h2 className="text-2xl font-bold text-black font-mogena">Edit Item</h2>
               <button onClick={() => setEditingShoppingItem(null)} className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 text-black font-bold">✕</button>
             </div>
             
             <div className="space-y-4 mt-2 overflow-y-auto pr-1 flex-1">
               <div className="space-y-1.5 relative z-20">
                 <label className="text-xs font-bold uppercase tracking-wider text-black/60">Item Name</label>
                 <input
                    type="text"
                    value={editShoppingName} 
                    onChange={(e) => setEditShoppingName(e.target.value)}
                    placeholder="Item name"
                    className="w-full px-4 py-3 rounded-xl bg-black/5 focus:outline-none border border-transparent focus:border-[#6B705C] text-black font-medium text-base"
                    required
                  />
               </div>
               
               <div className="grid grid-cols-2 gap-4 relative z-0">
                 <div className="space-y-1.5 w-full">
                   <label className="text-xs font-bold uppercase tracking-wider text-black/60">Quantity</label>
                   <input type="number" step="any" min="0.01" value={editShoppingQuantity} onChange={e => setEditShoppingQuantity(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-black/5 focus:outline-none border border-transparent focus:border-[#6B705C] text-black font-medium text-center text-base" />
                 </div>
                 <div className="space-y-1.5 w-full">
                   <label className="text-xs font-bold uppercase tracking-wider text-black/60">Unit</label>
                   <CustomSelect 
                      value={editShoppingUnit} 
                      onChange={setEditShoppingUnit} 
                      options={COMMON_UNITS.map(u => ({label: u, value: u}))}
                      className="w-full h-[48px]"
                   />
                 </div>
               </div>
             </div>
             
             <div className="pt-2 shrink-0">
                <button onClick={() => saveShoppingEdit(editingShoppingItem.id)} className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-black/80 shadow-sm transition">Save Changes</button>
             </div>
          </div>
        </div>
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
                    <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 pr-2">
                      <input type="checkbox" checked={item.checked} onChange={() => toggleShoppingItem(item.id)} className="w-5 h-5 accent-black rounded cursor-pointer shrink-0" />
                      <span className={`font-medium capitalize whitespace-normal break-words ${item.checked ? 'line-through text-black/50' : ''}`}>
                        {item.name} <span className="text-black/60 font-normal normal-case whitespace-nowrap ml-1">- {item.quantity || 1} {item.unit || 'pcs'}</span>
                      </span>
                    </label>
                    <button onClick={() => setShoppingActionMenu({isOpen: true, item})} className="p-2 hover:bg-black/5 rounded-full text-black/40 hover:text-black transition shrink-0">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                    </button>
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