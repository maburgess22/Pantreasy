import React, { useState, useEffect } from 'react';
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
  
  const [selectedId, setSelectedId] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Pantry Staples');
  const [newUnit, setNewUnit] = useState('pcs');
  const [newThreshold, setNewThreshold] = useState('1');

  const [actionMenu, setActionMenu] = useState<{isOpen: boolean, item: PantryItem | null}>({isOpen: false, item: null});
  const [showEditThreshold, setShowEditThreshold] = useState(false);
  const [editThresholdVal, setEditThresholdVal] = useState('1');

  useEffect(() => {
    if (showAddModal || showEditThreshold || actionMenu.isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [showAddModal, showEditThreshold, actionMenu.isOpen]);

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (addMode === 'existing') {
       const existing = untrackedItemsList.find(i => i.id === selectedId);
       if (!existing) return;
       handleAddTrackedItem(existing.name || 'Unknown Item', existing.category || 'Other', existing.unit || 'pcs', parseFloat(newThreshold) || 1);
    } else {
       if (!newName.trim()) return;
       handleAddTrackedItem(newName, newCategory, newUnit, parseFloat(newThreshold) || 1);
    }
    setShowAddModal(false); setNewName(''); setSelectedId(''); setNewThreshold('1');
  };

  const saveThreshold = () => {
    if (actionMenu.item) updateLowStockThreshold(actionMenu.item.id, parseFloat(editThresholdVal) || 1);
    setShowEditThreshold(false); setActionMenu({isOpen: false, item: null});
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-[#6B705C] text-white py-8 shadow-sm mb-6 border-b border-black/10 -mt-4 md:-mt-8">
        <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col relative w-full">
           <div className="w-full flex items-start justify-between">
              <div className="w-12 md:w-16">
                 <button onClick={handleBackNavigation} className="flex items-center justify-start text-white hover:text-white/60 transition shrink-0 p-2 -ml-2">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                 </button>
              </div>
              <div className="flex-1 flex flex-col items-center text-center">
                 <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-snug font-mogena text-center">Tracked Items</h2>
                 <p className="text-white/80 text-sm mt-2 font-medium text-center">Get alerted when essentials run low.</p>
              </div>
              <div className="w-12 md:w-16"></div>
           </div>
           
           <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto mt-6 justify-center">
              <button onClick={() => setShowAddModal(true)} className="px-8 py-2.5 bg-black text-white rounded-xl text-sm font-medium transition hover:bg-black/80 shadow-sm flex items-center justify-center border border-black/20">
                Add Item to Track
              </button>
              <button onClick={addLowStockToShopping} disabled={lowStockItems.length === 0} className="px-8 py-2.5 bg-white text-black rounded-xl text-sm font-bold transition hover:bg-gray-100 disabled:opacity-50 shadow-sm border border-black/20 text-center">
                + Restock Alerts to List
              </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {trackedItemsList.length === 0 ? (
          <p className="col-span-full text-center py-10 text-black/50">You aren't tracking any items yet.</p>
        ) : (
          trackedItemsList.map(item => {
            const currentQty = item.quantity || 0;
            const threshold = item.low_stock_threshold || 1;
            const isLow = currentQty <= threshold;
            return (
              <div key={item.id} className={`p-5 rounded-[28px] border transition shadow-sm flex items-center justify-between ${isLow ? 'bg-red-50 border-red-200' : 'bg-white border-black/10'}`}>
                 <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1.5">
                       <h3 className="font-bold text-lg capitalize text-black truncate">{item.name || 'Unknown'}</h3>
                       {isLow && <span className="px-2.5 py-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shrink-0 shadow-sm">Low Stock</span>}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className={`text-sm font-semibold ${isLow ? 'text-red-800' : 'text-black/70'}`}>Currently have: {currentQty} {item.unit}</p>
                      <p className="text-xs text-black/40 font-medium">Alerts at {threshold} {item.unit} or below</p>
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

      {actionMenu.isOpen && actionMenu.item && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity" onClick={() => setActionMenu({isOpen: false, item: null})}>
           <div className="bg-white w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-6 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-xl mb-6 text-center border-b border-black/10 pb-4 capitalize">{actionMenu.item.name || 'Item'}</h3>
              <div className="flex flex-col gap-2">
                 <button onClick={() => { setEditThresholdVal((actionMenu.item?.low_stock_threshold || 1).toString()); setShowEditThreshold(true); }} className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition shadow-sm">
                   Edit Alert Threshold
                 </button>
                 <button onClick={() => { disableTrackingForId(actionMenu.item!.id); setActionMenu({isOpen: false, item: null}); }} className="w-full py-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl font-bold transition mt-2 shadow-sm">
                   Stop Tracking Item
                 </button>
              </div>
           </div>
        </div>
      )}

      {showEditThreshold && actionMenu.item && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[210] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-[32px] p-6 md:p-8 w-full max-w-sm shadow-2xl flex flex-col gap-4 animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-2 border-b border-black/10 pb-4 shrink-0">
               <h2 className="text-xl font-bold text-black font-mogena">Edit Threshold</h2>
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

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-[32px] p-6 md:p-8 w-full max-w-md shadow-2xl flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 border-b border-black/10 pb-4 shrink-0">
              <h2 className="text-2xl font-bold text-black font-mogena">Track Item</h2>
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
                    options={untrackedItemsList.map(i => ({label: i.name || 'Unknown', value: i.id}))} 
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
              <button type="submit" form="addTrackForm" disabled={loading} className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-black/80 shadow-sm transition disabled:opacity-50">
                {loading ? 'Saving...' : 'Start Tracking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}