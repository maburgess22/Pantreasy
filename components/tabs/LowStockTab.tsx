import React from 'react';
import { PantryItem } from '@/utils/types';
import CustomSelect from '@/components/ui/CustomSelect';
import { getAisle } from '@/utils/helpers';

interface LowStockTabProps {
  handleBackNavigation: () => void;
  showAddTrackMenu: boolean;
  setShowAddTrackMenu: (val: boolean) => void;
  setShowTrackPantryInput: (val: boolean) => void;
  setShowTrackNewInput: (val: boolean) => void;
  addLowStockToShopping: () => void;
  lowStockItems: PantryItem[];
  showTrackPantryInput: boolean;
  itemToTrackId: string;
  setItemToTrackId: (val: string) => void;
  untrackedItemsList: PantryItem[];
  enableTrackingForId: (id: string) => void;
  showTrackNewInput: boolean;
  addNewTrackedItem: (e: React.FormEvent) => void;
  newTrackName: string;
  setNewTrackName: (val: string) => void;
  handleNewTrackNameChange: (e: any) => void;
  newTrackUnit: string;
  setNewTrackUnit: (val: string) => void;
  COMMON_UNITS: string[];
  loading: boolean;
  trackedItemsList: PantryItem[];
  updateLowStockThreshold: (id: string, threshold: number) => void;
  disableTrackingForId: (id: string) => void;
  adjustQuantity: (item: PantryItem, delta: number) => void;
}

export default function LowStockTab({
  handleBackNavigation, showAddTrackMenu, setShowAddTrackMenu,
  setShowTrackPantryInput, setShowTrackNewInput, addLowStockToShopping, lowStockItems,
  showTrackPantryInput, itemToTrackId, setItemToTrackId, untrackedItemsList,
  enableTrackingForId, showTrackNewInput, addNewTrackedItem, newTrackName,
  setNewTrackName, handleNewTrackNameChange, newTrackUnit, setNewTrackUnit, COMMON_UNITS, loading,
  trackedItemsList, updateLowStockThreshold, disableTrackingForId, adjustQuantity
}: LowStockTabProps) {
  return (
    <div className="space-y-6">
      <button onClick={handleBackNavigation} className="flex items-center gap-2 text-black/70 hover:text-black font-semibold transition">
        &larr; Back to Dashboard
      </button>
      
      <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-black/10">
        <div className="bg-[#6B705C] text-white p-6 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold leading-snug">Low Stock Management</h2>
            <p className="text-white/80 text-sm mt-2 font-medium">Set thresholds to trigger alerts when essential items run low.</p>
          </div>
          <div className="flex flex-col gap-3 shrink-0 w-full md:w-56">
            <button onClick={() => setShowAddTrackMenu(true)} className="w-full px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium transition hover:bg-black/80 shadow-sm flex items-center justify-center border border-black/20">
              Add Item to Track
            </button>
            
            {/* NEW BOTTOM SHEET FOR ADD TRACK */}
            {showAddTrackMenu && (
              <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity" onClick={() => setShowAddTrackMenu(false)}>
                <div className="bg-white w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-6 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95" onClick={e => e.stopPropagation()}>
                   <h3 className="font-bold text-xl mb-6 text-center border-b border-black/10 pb-4">Track an Item</h3>
                   <div className="flex flex-col gap-2">
                     <button onClick={() => { setShowTrackPantryInput(true); setShowTrackNewInput(false); setShowAddTrackMenu(false); }} className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition shadow-sm">Add Item from Pantry</button>
                     <button onClick={() => { setShowTrackNewInput(true); setShowTrackPantryInput(false); setShowAddTrackMenu(false); }} className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition shadow-sm">Add New Item</button>
                   </div>
                </div>
              </div>
            )}
            
            <button onClick={addLowStockToShopping} disabled={lowStockItems.length === 0} className="w-full px-5 py-2.5 bg-white text-black rounded-xl text-sm font-bold transition hover:bg-gray-100 disabled:opacity-50 shadow-sm border border-black/20 text-center">
              + Restock Alerts to List
            </button>
          </div>
        </div>

        <div className="p-6 md:p-10 space-y-10">
          
          {showTrackPantryInput && (
            <div className="bg-black/5 p-6 rounded-3xl border border-black/10 space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-black">Add from Pantry</h3>
                <button onClick={() => setShowTrackPantryInput(false)} className="text-sm font-bold text-black/40 hover:text-black">✕ Close</button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 relative z-0 hover:z-10">
                <div className="flex-1">
                  <CustomSelect 
                    value={itemToTrackId} 
                    onChange={setItemToTrackId} 
                    options={untrackedItemsList.map(i => ({label: i.name, value: i.id}))} 
                    placeholder="Select an untracked pantry item..."
                    className="bg-white shadow-sm"
                  />
                </div>
                <button onClick={() => { enableTrackingForId(itemToTrackId); setShowTrackPantryInput(false); }} disabled={!itemToTrackId} className="px-6 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/80 disabled:opacity-50 transition shadow-sm">Track Item</button>
              </div>
            </div>
          )}

          {showTrackNewInput && (
            <div className="bg-black/5 p-6 rounded-3xl border border-black/10 space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-black">Add New Item</h3>
                <button onClick={() => setShowTrackNewInput(false)} className="text-sm font-bold text-black/40 hover:text-black">✕ Close</button>
              </div>
              <form onSubmit={(e) => { addNewTrackedItem(e); setShowTrackNewInput(false); }} className="flex flex-col sm:flex-row gap-2 relative z-0 hover:z-10">
                <input
                  type="text"
                  value={newTrackName}
                  onChange={(e) => { setNewTrackName(e.target.value); handleNewTrackNameChange(e); }}
                  placeholder="New item name..."
                  className="w-full sm:flex-1 px-4 py-3 rounded-xl text-base focus:outline-none bg-white border border-black/20 text-black shadow-sm"
                  required
                />
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="flex-1 sm:w-28">
                    <CustomSelect 
                      value={newTrackUnit} 
                      onChange={setNewTrackUnit} 
                      options={COMMON_UNITS.map(u => ({label: u, value: u}))} 
                      placeholder="Unit"
                      className="bg-white shadow-sm"
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full sm:w-auto px-6 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/80 disabled:opacity-50 transition shadow-sm">Add & Track</button>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-black">Set Low Stock Amounts</h3>
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                {trackedItemsList.map(item => (
                   <div key={item.id} className="flex flex-row items-center gap-3 bg-black/5 p-3 rounded-2xl w-full transition hover:bg-black/10">
                     <div className="flex-1 min-w-[80px]">
                       <h4 className="font-semibold text-sm capitalize text-black truncate">{item.name}</h4>
                       <p className="text-[10px] text-black/50 uppercase font-bold truncate">Stock: {item.quantity} {item.unit}</p>
                     </div>
                     <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-xl border border-black/10 shrink-0 shadow-sm">
                       <span className="text-[10px] font-bold text-black/50 uppercase tracking-wider hidden sm:block pl-1">Alert at:</span>
                       <input type="number" step="any" min="0" value={item.low_stock_threshold || 0} onChange={(e) => updateLowStockThreshold(item.id, parseFloat(e.target.value) || 0)} className="w-12 text-center text-sm font-bold focus:outline-none bg-transparent" />
                       <span className="text-sm font-bold text-black pr-1">{item.unit}</span>
                     </div>
                     <button onClick={() => disableTrackingForId(item.id)} className="w-8 h-8 shrink-0 flex items-center justify-center bg-red-500/10 text-red-600 rounded-xl font-bold hover:bg-red-500 hover:text-white transition">✕</button>
                   </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-red-800">Actively Low Items</h3>
              {lowStockItems.length > 0 ? (
                <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-2">
                  {lowStockItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-4 rounded-2xl bg-red-50 border border-red-200 shadow-sm">
                      <div>
                        <h4 className="font-semibold text-base capitalize text-black">{item.name}</h4>
                        <p className="text-sm text-red-800 font-medium">Have {item.quantity} {item.unit} (Alert at {item.low_stock_threshold || 1})</p>
                      </div>
                      <button onClick={() => adjustQuantity(item, 1)} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-black text-white shadow-sm hover:bg-black/80 transition">+ Add 1</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 rounded-3xl border-2 border-dashed border-black/10 text-center bg-white/50">
                  <p className="text-sm font-medium text-black/50">All tracked items are well stocked!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}