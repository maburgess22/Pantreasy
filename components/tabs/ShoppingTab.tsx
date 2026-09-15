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
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');

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
            <button onClick={() => { setVoiceContext('shopping'); setShowVoiceInputScreen(true); }} className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium transition hover:bg-black/80 shadow-sm flex items-center justify-center gap-2 border border-black/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              <span>Voice Add</span>
            </button>
            {lowStockItems.length > 0 && (
              <button onClick={addLowStockToShopping} className="px-6 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold transition hover:bg-amber-600 shadow-sm flex items-center justify-center gap-2 border border-amber-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <span>Add {lowStockItems.length} Low Stock Items</span>
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

      {/* QUICK ADD FORM */}
      <form onSubmit={addItem} className="bg-white p-4 rounded-[24px] shadow-sm border border-black/10 flex flex-col sm:flex-row gap-3 items-center">
        <div className="flex-1 w-full relative z-20">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name (e.g. Almond Milk)"
            className="w-full px-4 py-3 rounded-xl bg-black/5 focus:outline-none border border-transparent focus:border-[#6B705C] text-black font-medium text-sm"
            required
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto relative z-10">
          <input
            type="number" step="any" min="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-20 px-3 py-3 rounded-xl bg-black/5 focus:outline-none border border-transparent focus:border-[#6B705C] text-black font-medium text-center text-sm"
            required
          />
          <div className="w-[90px]">
            <CustomSelect value={unit} onChange={setUnit} options={COMMON_UNITS.map(u => ({label: u, value: u}))} />
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full sm:w-auto px-6 py-3 bg-black text-white font-bold rounded-xl shadow-sm hover:bg-black/80 transition disabled:opacity-50">
          Add
        </button>
      </form>

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
                  // Sort so unchecked items are at the top of their category, checked at the bottom
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

                    {/* DELETE BUTTON */}
                    <button onClick={() => deleteItem(item.id)} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}