import React from 'react';
import CustomSelect from '@/components/ui/CustomSelect';

interface ScannedItem {
  name: string;
  quantity: number | string;
  unit: string;
  category?: string;
}

interface ScannedItemsReviewModalProps {
  scannedItems: ScannedItem[];
  updateScannedItem: (index: number, field: string, value: string | number) => void;
  removeScannedItem: (index: number) => void;
  commitScannedItems: () => void;
  loading: boolean;
  onCancel: () => void;
  COMMON_UNITS: string[];
  dynamicCategories: string[];
}

export default function ScannedItemsReviewModal({
  scannedItems, updateScannedItem, removeScannedItem, commitScannedItems,
  loading, onCancel, COMMON_UNITS, dynamicCategories
}: ScannedItemsReviewModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
       <div className="bg-white rounded-[32px] w-full max-w-2xl p-6 md:p-8 flex flex-col max-h-[90vh] animate-in zoom-in-95">
         <h2 className="text-2xl font-bold mb-4">Review Scanned Items</h2>
         <div className="overflow-y-auto flex-1 space-y-3 pr-2 w-full">
           {scannedItems.map((item, index) => (
              <div key={index} className="flex flex-col gap-2 bg-black/5 p-3 rounded-2xl relative z-0 hover:z-10 w-full">
                <div className="flex gap-2 w-full">
                  <input value={item.name} onChange={e => updateScannedItem(index, 'name', e.target.value)} className="flex-1 w-full min-w-0 px-4 py-3 rounded-xl font-bold focus:outline-none bg-white placeholder:text-black/50" placeholder="Item Name" />
                  <button onClick={() => removeScannedItem(index)} className="w-12 h-12 flex items-center justify-center bg-red-500/80 text-white rounded-xl font-bold hover:bg-red-500 transition shrink-0">✕</button>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full">
                  <input type="number" step="any" value={item.quantity || 1} onChange={e => updateScannedItem(index, 'quantity', e.target.value)} className="w-full px-4 py-3 rounded-xl text-center focus:outline-none bg-white" placeholder="Qty" />
                  <div className="w-full h-full"><CustomSelect value={item.unit || 'pcs'} onChange={v => updateScannedItem(index, 'unit', v)} options={COMMON_UNITS.map(u => ({label: u, value: u}))} className="bg-white rounded-xl w-full h-[48px]" /></div>
                </div>
                <div className="w-full mt-1">
                  <CustomSelect value={item.category || 'Other'} onChange={v => updateScannedItem(index, 'category', v)} options={dynamicCategories.map(c => ({label: c, value: c}))} className="bg-white rounded-xl w-full" />
                </div>
              </div>
           ))}
         </div>
         <div className="flex gap-3 mt-6 pt-4 border-t border-black/10 shrink-0">
            <button onClick={onCancel} className="flex-1 py-3.5 rounded-2xl font-bold border border-black/20 text-black hover:bg-black/5 transition">Cancel</button>
            <button onClick={commitScannedItems} disabled={loading} className="flex-1 py-3.5 rounded-2xl font-bold bg-black text-white hover:bg-black/80 transition shadow-sm">{loading ? 'Saving...' : 'Confirm & Add'}</button>
         </div>
       </div>
    </div>
  );
}