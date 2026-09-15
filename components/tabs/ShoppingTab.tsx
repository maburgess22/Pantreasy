import React, { useState } from 'react';
import { ShoppingItem, PantryItem } from '@/utils/types';
import CustomSelect from '@/components/ui/CustomSelect';
import { createClient } from '@/utils/supabase/client';
import { getAisle } from '@/utils/helpers';

interface ShoppingTabProps {
  userId: string;
  shoppingList: ShoppingItem[];
  setShoppingList: React.Dispatch<React.SetStateAction<ShoppingItem[]>>;
  addOrMergeShoppingItem: (newItem: { name: string; quantity: number; unit: string }) => Promise<void>;
  lowStockItems: PantryItem[];
  COMMON_UNITS: string[];
  setVoiceContext: (val: 'shopping' | 'pantry') => void;
  setShowVoiceInputScreen: (val: boolean) => void;
  addLowStockToShopping: () => Promise<void>;
  showToast: (msg: string) => void;
}

export default function ShoppingTab({
  userId, shoppingList, setShoppingList, addOrMergeShoppingItem, lowStockItems,
  COMMON_UNITS, setVoiceContext, setShowVoiceInputScreen, addLowStockToShopping, showToast
}: ShoppingTabProps) {

  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  // --- STATE FOR ADDING MENUS ---
  const [showAddShoppingMenu, setShowAddShoppingMenu] = useState(false);
  const [showShoppingInput, setShowShoppingInput] = useState(false);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');

  // --- STATE FOR 3-DOT MENU AND EDITING ---
  const [shoppingActionMenu, setShoppingActionMenu] = useState<{isOpen: boolean, item: ShoppingItem | null}>({isOpen: false, item: null});
  const [editingShoppingItem, setEditingShoppingItem] = useState<ShoppingItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await addOrMergeShoppingItem({ name: name.trim(), quantity: parseFloat(quantity) || 1, unit });
    setName('');
    setQuantity('1');
    showToast('Added to shopping list!');
    setLoading(false);
  };

  const toggleChecked = async (id: string, current: boolean) => {
    setShoppingList(prev => prev.map(i => i.id === id ? { ...i, checked: !current } : i));
    await supabase.from('shopping_list').update({ checked: !current }).eq('id', id).eq('user_id', userId);
  };

  const deleteItem = async (id: string) => {
    setShoppingList(prev => prev.filter(i => i.id !== id));
    await supabase.from('shopping_list').delete().eq('id', id).eq('user_id', userId);
  };

  const clearChecked = async () => {
    const toDelete = shoppingList.filter(i => i.checked).map(i => i.id);
    if (toDelete.length === 0) return showToast('No completed items to clear.');
    setLoading(true);
    setShoppingList(prev => prev.filter(i => !i.checked));
    await supabase.from('shopping_list').delete().in('id', toDelete).eq('user_id', userId);
    showToast('Cleared completed items!');
    setLoading(false);
  };

  const adjustQuantity = async (item: ShoppingItem, delta: number) => {
    const newQty = Math.max(0, Number(((item.quantity || 1) + delta).toFixed(2))); 
    setShoppingList(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));
    await supabase.from('shopping_list').update({ quantity: newQty }).eq('id', item.id).eq('user_id', userId);
    if (shoppingActionMenu.item && shoppingActionMenu.item.id === item.id) { 
      setShoppingActionMenu({ isOpen: true, item: { ...shoppingActionMenu.item, quantity: newQty } }); 
    }
  };

  const startEditing = (item: ShoppingItem) => { 
    setEditingShoppingItem(item); 
    setEditName(item.name || ''); 
    setEditQuantity(item.quantity != null ? item.quantity.toString() : '1'); 
    setEditUnit(item.unit || 'pcs'); 
  };

  const saveEdit = async (id: string) => {
    const updatedItem = { 
      name: (editName || '').trim(), 
      quantity: parseFloat(editQuantity) || 0, 
      unit: editUnit
    };
    if (!updatedItem.name) return showToast("Item name cannot be empty.");
    setShoppingList(prev => prev.map(item => item.id === id ? { ...item, ...updatedItem } : item));
    setEditingShoppingItem(null); 
    await supabase.from('shopping_list').update(updatedItem).eq('id', id).eq('user_id', userId);
    showToast('Item updated!');
  };

  // Group shopping list by supermarket aisles on the fly
  const groupedList = shoppingList.reduce((acc, item) => {
    const cat = getAisle(item.name);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const sortedCategories = Object.keys(groupedList).sort();
  const hasCheckedItems = shoppingList.some(i => i.checked);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-[#6B705C] text-white py-8 shadow-sm mb-6 border-b border-black/10 -mt-4 md:-mt-8">
        <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col items-center text-center gap-5 pt-4 md:pt-0">
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-snug font-mogena text-center">Shopping List</h2>
            <p className="text-white/80 text-sm mt-2 font-medium text-center">Plan your next grocery run.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto justify-center flex-wrap">
            <button onClick={() => setShowAddShoppingMenu(true)} className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium transition hover:bg-black/80 shadow-sm flex items-center justify-center border border-black/20">
              Add Item
            </button>
            {lowStockItems.length > 0 && (
              <button onClick={addLowStockToShopping} className="px-6 py-2.5 bg-white text-amber-600 rounded-xl text-sm font-bold transition hover:bg-amber-50 shadow-sm flex items-center justify-center border border-black/20">
                Add {lowStockItems.length} Low Stock Items
              </button>
            )}
            {hasCheckedItems && (
               <button onClick={clearChecked} disabled={loading} className="px-6 py-2.5 bg-white text-black rounded-xl text-sm font-medium transition hover:bg-gray-100 shadow-sm flex items-center justify-center border border-black/20 disabled:opacity-50">
                 Clear Completed
               </button>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM-UP MENU FOR ADDING */}
      {showAddShoppingMenu && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity" onClick={() => setShowAddShoppingMenu(false)}>
          <div className="bg-white w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-6 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95" onClick={e => e.stopPropagation()}>
             <h3 className="font-bold text-xl mb-6 text-center border-b border-black/10 pb-4">Add to Shopping List</h3>
             <div className="flex flex-col gap-2">
               <button onClick={() => { setShowShoppingInput(true); setShowAddShoppingMenu(false); }} className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition shadow-sm">Type Item Name</button>
               <button onClick={() => { setVoiceContext('shopping'); setShowVoiceInputScreen(true); setShowAddShoppingMenu(false); }} className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition shadow-sm">Voice Input</button>
             </div>
          </div>
        </div>
      )}

      {/* MANUAL INPUT MODAL */}
      {showShoppingInput && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-[32px] p-6 md:p-8 w-full max-w-md shadow-2xl flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-2 border-b border-black/10 pb-4 shrink-0">
              <h2 className="text-2xl font-bold text-black">Add to List Manually</h2>
              <button type="button" onClick={() => setShowShoppingInput(false)} className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 text-black font-bold">✕</button>
            </div>
            
            <form id="addShoppingForm" onSubmit={(e) => { addItem(e); setShowShoppingInput(false); }} className="space-y-4 mt-2 overflow-y-auto pr-1 flex-1">
              <div className="space-y-1.5 relative z-20">
                <label className="text-xs font-bold uppercase tracking-wider text-black/60">Item Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Almond Milk"
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
              <button type="submit" form="addShoppingForm" disabled={loading} className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-black/80 shadow-sm transition">
                {loading ? 'Adding...' : 'Add to List'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY GRID */}
      {shoppingList.length === 0 ? (
        <p className="text-center text-black/50 py-12">Your shopping list is empty.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCategories.map(category => (
            <div key={category} className="rounded-[28px] p-5 space-y-3 bg-[#6B705C]/10 border border-[#6B705C]/20 shadow-sm">
              <div className="flex items-center gap-2 pb-2 border-b border-[#6B705C]/20">
                <span className="text-sm font-semibold tracking-wider uppercase text-black">{category}</span>
                <span className="text-xs font-bold text-black/40 bg-black/5 px-2 py-0.5 rounded-full">{groupedList[category].length}</span>
              </div>
              <div className="space-y-2">
                {groupedList[category]
                  .sort((a, b) => Number(a.checked) - Number(b.checked))
                  .map(item => (
                  <div key={item.id} className={`flex items-center justify-between p-3 rounded-[20px] transition border shadow-sm relative z-0 hover:z-10 gap-3 ${item.checked ? 'bg-black/5 border-transparent opacity-60' : 'bg-white border-black/10'}`}>
                    
                    {/* CHECKBOX */}
                    <button onClick={() => toggleChecked(item.id, !!item.checked)} className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full border-2 border-[#6B705C] transition focus:outline-none hover:bg-[#6B705C]/20">
                      {item.checked && <div className="w-3 h-3 bg-[#6B705C] rounded-full" />}
                    </button>

                    {/* ITEM DETAILS */}
                    <div className="flex-1 min-w-0" onClick={() => toggleChecked(item.id, !!item.checked)}>
                      <h3 className={`font-semibold text-sm capitalize leading-tight whitespace-normal break-words m-0 cursor-pointer select-none ${item.checked ? 'line-through text-black/60' : 'text-black'}`}>
                        {item.name} <span className="text-xs font-normal normal-case whitespace-nowrap ml-1 text-black/50">- {item.quantity} {item.unit}</span>
                      </h3>
                    </div>

                    {/* 3 DOT MENU BUTTON */}
                    <button onClick={() => setShoppingActionMenu({isOpen: true, item})} className="p-2 hover:bg-black/5 rounded-full text-black/40 hover:text-black transition shrink-0">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3-DOT ACTION MENU MODAL */}
      {shoppingActionMenu.isOpen && shoppingActionMenu.item && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity" onClick={() => setShoppingActionMenu({isOpen: false, item: null})}>
           <div className="bg-white w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-6 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-xl mb-6 text-center border-b border-black/10 pb-4">{shoppingActionMenu.item.name}</h3>
              <div className="bg-black/5 rounded-2xl p-4 mb-4 flex items-center justify-between shadow-sm">
                 <span className="font-semibold text-xs uppercase tracking-wider text-black/60">Amount</span>
                 <div className="flex items-center gap-3">
                    <button onClick={() => adjustQuantity(shoppingActionMenu.item!, -1)} className="w-8 h-8 rounded-lg bg-white shadow-sm font-bold flex items-center justify-center hover:bg-black/5">-</button>
                    <span className="font-bold min-w-[3rem] text-center text-sm">{shoppingActionMenu.item.quantity || 1} {shoppingActionMenu.item.unit || 'pcs'}</span>
                    <button onClick={() => adjustQuantity(shoppingActionMenu.item!, 1)} className="w-8 h-8 rounded-lg bg-white shadow-sm font-bold flex items-center justify-center hover:bg-black/5">+</button>
                 </div>
              </div>
              <div className="flex flex-col gap-2">
                 <button onClick={() => { startEditing(shoppingActionMenu.item!); setShoppingActionMenu({isOpen: false, item: null}); }} className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition shadow-sm">Edit Details</button>
                 <button onClick={() => { deleteItem(shoppingActionMenu.item!.id); setShoppingActionMenu({isOpen: false, item: null}); }} className="w-full py-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl font-bold transition mt-2 shadow-sm">Remove Item</button>
              </div>
           </div>
        </div>
      )}

      {/* EDIT ITEM MODAL */}
      {editingShoppingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-[32px] p-6 md:p-8 w-full max-w-md shadow-2xl flex flex-col gap-4 animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-2 border-b border-black/10 pb-4 shrink-0">
               <h2 className="text-2xl font-bold text-black">Edit Item</h2>
               <button onClick={() => setEditingShoppingItem(null)} className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 text-black font-bold">✕</button>
             </div>
             
             <div className="space-y-4 mt-2 overflow-y-auto pr-1 flex-1">
               <div className="space-y-1.5 relative z-20">
                 <label className="text-xs font-bold uppercase tracking-wider text-black/60">Item Name</label>
                 <input
                    type="text"
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)}
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
             </div>
             
             <div className="pt-2 shrink-0">
                <button onClick={() => saveEdit(editingShoppingItem.id)} className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-black/80 shadow-sm transition">Save Changes</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}