// components/tabs/LowStockTab.tsx
import React, { useState } from 'react';
import { PantryItem } from '@/utils/types';
import CustomSelect from '@/components/ui/CustomSelect';

interface LowStockTabProps {
  handleBackNavigation: () => void;
  addLowStockToShopping: () => void;
  lowStockItems: PantryItem[];
  untrackedItemsList: PantryItem[];
  trackedItemsList: PantryItem[];
  handleAddTrackedItem: (name: string, category: string, unit: string, threshold: number) => void;
  updateLowStockThreshold: (id: string, threshold: number) => void;
  disableTrackingForId: (id: string) => void;
  COMMON_UNITS: string[];
  dynamicCategories: string[];
  loading: boolean;
}

export default function LowStockTab({
  handleBackNavigation, addLowStockToShopping, lowStockItems,
  untrackedItemsList, trackedItemsList, handleAddTrackedItem,
  updateLowStockThreshold, disableTrackingForId, COMMON_UNITS, dynamicCategories, loading
}: LowStockTabProps) {

  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'existing' | 'new'>('existing');
  
  // Add State
  const [selectedId, setSelectedId] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Pantry Staples');
  const [newUnit, setNewUnit] = useState('pcs');
  const [newThreshold, setNewThreshold] = useState('1');

  // Action Menu State
  const [actionMenu, setActionMenu] = useState<{isOpen: boolean, item: PantryItem | null}>({isOpen: false, item: null});
  const [showEditThreshold, setShowEditThreshold] = useState(false);
  const [editThresholdVal, setEditThresholdVal] = useState('1');

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (addMode === 'existing') {
       const existing = untrackedItemsList.find(i => i.id === selectedId);
       if (!existing) return;
       handleAddTrackedItem(existing.name, existing.category, existing.unit, parseFloat(newThreshold) || 1);
    } else {
       if (!newName.trim()) return;
       handleAddTrackedItem(newName, newCategory, newUnit, parseFloat(newThreshold) || 1);
    }
    setShowAddModal(false); setNewName(''); setSelectedId(''); setNewThreshold('1');
  };

  const saveThreshold = () => {
    if (actionMenu.item) updateLowStockThreshold(actionMenu.item.id, parseFloat(editThresholdVal) || 1);
    setShowEditThreshold(false);
    setActionMenu({isOpen: false, item: null});
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button onClick={handleBackNavigation} className="flex items-center gap-2 text-black/70 hover:text-black font-semibold transition">
        &larr; Back to Dashboard
      </button>
      
      <div className="bg-[#6B705C] text-white p-6 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 rounded-[32px] shadow-sm border border-black/10">
        <div>
          <h2 className="text-4xl md:text-5xl font-bold leading-snug">Tracked Items</h2>
          <p className="text-white/80 text-sm mt-2 font-medium">Get alerted when essentials run low.</p>
        </div>
        <div className="flex flex-col gap-3 shrink-0 w-full md:w-56">
          <button onClick={() => setShowAddModal(true)} className="w-full px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium transition hover:bg-black/80 shadow-sm flex items-center justify-center border border-black/20">
            Add Item to Track
          </button>
          <button onClick={addLowStockToShopping} disabled={lowStockItems.length === 0} className="w-full px-5 py-2.5 bg-white text-black rounded-xl text-sm font-bold transition hover:bg-gray-100 disabled:opacity-50 shadow-sm border border-black/20 text-center">
            + Restock Alerts to List
          </button>
        </div>
      </div>

      {/* TRACKED ITEMS LIST */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {trackedItemsList.length === 0 ? (
          <p className="col-span-full text-center py-10 text-black/50">You aren't tracking any items yet.</p>
        ) : (
          trackedItemsList.map(item => {
            const isLow = item.quantity <= (item.low_stock_threshold || 1);
            return (
              <div key={item.id} className={`p-5 rounded-[28px] border transition shadow-sm flex items-center justify-between ${isLow ? 'bg-red-50 border-red-200' : 'bg-white border-black/10'}`}>
                 <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1.5">
                       <h3 className="font-bold text-lg capitalize text-black truncate">{item.name}</h3>
                       {isLow && <span className="px-2.5 py-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shrink-0 shadow-sm">Low Stock</span>}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className={`text-sm font-semibold ${isLow ? 'text-red-800' : 'text-black/70'}`}>Currently have: {item.quantity} {item.unit}</p>
                      <p className="text-xs text-black/40 font-medium">Alerts at {item.low_stock_threshold || 1} {item.unit} or below</p>
                    </div>
                 </div>
                 <button onClick={() => setActionMenu({isOpen: true, item})} className="p-3 hover:bg-black/5 rounded-full text-black/40 hover:text-black transition shrink-0">
                   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                 </button>
              </div>
            );
          })
        )}
      </div>

      {/* 3-DOT ACTION MENU */}
      {actionMenu.isOpen && actionMenu.item && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity" onClick={() => setActionMenu({isOpen: false, item: null})}>
           <div className="bg-white w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-6 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-xl mb-6 text-center border-b border-black/10 pb-4 capitalize">{actionMenu.item.name}</h3>
              <div className="flex flex-col gap-2">
                 <button onClick={() => { setEditThresholdVal((actionMenu.item?.low_stock_threshold || 1).toString()); setShowEditThreshold(true); }} className="w-full py-4 px-6 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition flex justify-between items-center text-left">
                   <span>Edit Alert Threshold</span><span className="text-black/40">→</span>
                 </button>
                 <button onClick={() => { disableTrackingForId(actionMenu.item!.id); setActionMenu({isOpen: false, item: null}); }} className="w-full py-4 px-6 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl font-bold transition mt-2 flex justify-between items-center text-left">
                   <span>Stop Tracking Item</span><span className="text-red-400">→</span>
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* EDIT THRESHOLD MODAL */}
      {showEditThreshold && actionMenu.item && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-[32px] p-6 md:p-8 w-full max-w-sm shadow-2xl flex flex-col gap-4 animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-2 border-b border-black/10 pb-4 shrink-0">
               <h2 className="text-xl font-bold text-black">Edit Threshold</h2>
               <button onClick={() => setShowEditThreshold(false)} className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 text-black font-bold">✕</button>
             </div>
             <p className="text-sm text-black/60">Alert me when {actionMenu.item.name} drops to...</p>
             <div className="flex gap-2 items-center">
               <input type="number" step="any" min="0" value={editThresholdVal} onChange={e => setEditThresholdVal(e.target.value)} className="w-24 px-4 py-3 rounded-xl bg-black/5 focus:outline-none border border-transparent focus:border-[#6B705C] text-black font-bold text-center text-xl" autoFocus />
               <span className="font-bold text-black/60 text-lg">{actionMenu.item.unit}</span>
             </div>
             <div className="pt-2">
                <button onClick={saveThreshold} className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-black/80 shadow-sm transition">Save Alert</button>
             </div>
          </div>
        </div>
      )}

      {/* ADD TRACKED ITEM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-[32px] p-6 md:p-8 w-full max-w-md shadow-2xl flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 border-b border-black/10 pb-4 shrink-0">
              <h2 className="text-2xl font-bold text-black">Track Item</h2>
              <button type="button" onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 text-black font-bold">✕</button>
            </div>
            
            <div className="flex bg-black/5 p-1 rounded-2xl mb-2 shrink-0">
              <button onClick={() => setAddMode('existing')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${addMode === 'existing' ? 'bg-white shadow-sm text-black' : 'text-black/60 hover:text-black'}`}>From Pantry</button>
              <button onClick={() => setAddMode('new')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${addMode === 'new' ? 'bg-white shadow-sm text-black' : 'text-black/60 hover:text-black'}`}>New Item</button>
            </div>

            <form id="addTrackForm" onSubmit={submitAdd} className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-[220px]">
              {addMode === 'existing' ? (
                <div className="space-y-1.5 relative z-20">
                  <label className="text-xs font-bold uppercase tracking-wider text-black/60">Select Item</label>
                  <CustomSelect 
                    value={selectedId} 
                    onChange={setSelectedId} 
                    options={untrackedItemsList.map(i => ({label: i.name, value: i.id}))} 
                    placeholder="Choose an item..."
                    className="bg-black/5"
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-1.5 relative z-20">
                    <label className="text-xs font-bold uppercase tracking-wider text-black/60">Item Name</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Toilet Paper"
                      className="w-full px-4 py-3 rounded-xl bg-black/5 focus:outline-none border border-transparent focus:border-[#6B705C] text-black font-medium text-base"
                      required={addMode === 'new'}
                    />
                  </div>
                  <div className="flex gap-4 relative z-10">
                    <div className="space-y-1.5 flex-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-black/60">Category</label>
                      <CustomSelect value={newCategory} onChange={setNewCategory} options={dynamicCategories.map(c => ({label: c, value: c}))} className="bg-black/5" />
                    </div>
                    <div className="space-y-1.5 w-28">
                      <label className="text-xs font-bold uppercase tracking-wider text-black/60">Unit</label>
                      <CustomSelect value={newUnit} onChange={setNewUnit} options={COMMON_UNITS.map(u => ({label: u, value: u}))} className="bg-black/5" />
                    </div>
                  </div>
                </>
              )}
              
              <div className="space-y-1.5 relative z-0">
                <label className="text-xs font-bold uppercase tracking-wider text-black/60">Alert me when it drops below:</label>
                <div className="flex items-center gap-3">
                   <input type="number" step="any" min="0" placeholder="1" value={newThreshold} onChange={(e) => setNewThreshold(e.target.value)} className="w-24 px-4 py-3 rounded-xl bg-black/5 focus:outline-none border border-transparent focus:border-[#6B705C] text-black font-bold text-center text-lg" required />
                   <span className="font-bold text-black/40">items / units</span>
                </div>
              </div>
            </form>
            
            <div className="pt-2 shrink-0">
              <button type="submit" form="addTrackForm" disabled={loading || (addMode === 'existing' && !selectedId)} className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-black/80 shadow-sm transition disabled:opacity-50">
                {loading ? 'Saving...' : 'Start Tracking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}