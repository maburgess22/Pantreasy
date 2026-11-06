import React from 'react';
import CustomSelect from '@/components/ui/CustomSelect';

interface VoiceItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
}

interface VoiceInputModalProps {
  isListening: boolean;
  toggleListening: () => void;
  voiceParsedItems: VoiceItem[];
  updateVoiceItem: (index: number, field: string, value: string | number) => void;
  removeVoiceItem: (index: number) => void;
  commitVoiceItems: () => void;
  loading: boolean;
  voiceContext: 'shopping' | 'pantry';
  COMMON_UNITS: string[];
  onCancel: () => void;
}

export default function VoiceInputModal({
  isListening, toggleListening, voiceParsedItems, updateVoiceItem,
  removeVoiceItem, commitVoiceItems, loading, voiceContext, COMMON_UNITS, onCancel
}: VoiceInputModalProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="bg-[#6B705C] p-6 md:p-8 rounded-[32px] shadow-2xl w-full max-w-2xl flex flex-col gap-6 text-white border border-black/10 animate-in fade-in zoom-in-95">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Voice Entry</h2>
          <p className="text-white/80 text-sm">Say something like: "3 bananas and 200g of flour"</p>
        </div>
        <div className="flex justify-center mt-2">
          <button onClick={toggleListening} className={`px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all shadow-sm ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-black text-white hover:bg-black/80'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            {isListening ? 'Tap to Stop...' : 'Tap to Speak'}
          </button>
        </div>
        {voiceParsedItems.length > 0 && (
          <div className="flex flex-col gap-3 mt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80 border-b border-white/20 pb-2 mb-2">Review Items</h3>
            {voiceParsedItems.map((item, index) => (
              <div key={item.id} className="flex flex-row items-center gap-2 bg-white/10 p-2 rounded-2xl w-full relative z-0 hover:z-10">
                <input value={item.name} onChange={e => updateVoiceItem(index, 'name', e.target.value)} className="flex-1 min-w-[80px] bg-white text-black px-2 py-2 rounded-xl text-sm focus:outline-none placeholder:text-black/50" placeholder="Item Name" />
                <input type="number" step="any" value={item.quantity} onChange={e => updateVoiceItem(index, 'quantity', e.target.value)} className="w-12 bg-white text-black px-1 py-2 rounded-xl text-sm text-center focus:outline-none" />
                <div className="w-[75px]"><CustomSelect value={item.unit} onChange={v => updateVoiceItem(index, 'unit', v)} options={COMMON_UNITS.map(u => ({label: u, value: u}))} className="bg-white rounded-xl" /></div>
                <button onClick={() => removeVoiceItem(index)} className="w-8 h-8 shrink-0 flex items-center justify-center bg-red-500/80 text-white rounded-xl font-bold hover:bg-red-500 transition">✕</button>
              </div>
            ))}
            <button onClick={commitVoiceItems} disabled={loading} className="w-full py-4 mt-4 bg-black text-white rounded-2xl font-bold hover:bg-black/80 shadow-sm transition">
              {loading ? 'Saving...' : `Confirm & Add to ${voiceContext === 'shopping' ? 'List' : 'Pantry'}`}
            </button>
          </div>
        )}
        <div className="border-t border-white/20 pt-4 mt-2">
          <button onClick={onCancel} className="w-full py-3 bg-transparent text-white font-bold hover:bg-white/10 rounded-2xl transition">Cancel</button>
        </div>
      </div>
    </div>
  );
}