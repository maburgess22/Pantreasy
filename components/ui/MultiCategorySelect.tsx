import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function MultiCategorySelect({ 
  selected, 
  options, 
  onChange, 
  placeholder = "Select Categories..." 
}: { 
  selected: string, 
  options: string[], 
  onChange: (val: string) => void, 
  placeholder?: string 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [newCat, setNewCat] = useState('');

  const selectedArr = selected ? selected.split(',').map(s => s.trim()).filter(Boolean) : [];

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const toggleOption = (opt: string) => {
    if (selectedArr.includes(opt)) {
      onChange(selectedArr.filter(item => item !== opt).join(', '));
    } else {
      onChange([...selectedArr, opt].join(', '));
    }
  };

  const handleAddNew = () => {
    if (!newCat.trim()) return;
    onChange([...selectedArr, newCat.trim()].join(', '));
    setNewCat('');
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity" onClick={() => setIsOpen(false)}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-6 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 shrink-0 border-b border-black/10 pb-4">
          <h3 className="font-bold text-xl text-center w-full">Manage Categories</h3>
        </div>

        <div className="flex gap-2 mb-4 shrink-0">
          <input 
            type="text" 
            placeholder="Create custom category..." 
            value={newCat} 
            onChange={(e) => setNewCat(e.target.value)} 
            className="flex-1 px-4 py-3 rounded-xl bg-black/5 focus:outline-none text-sm font-medium" 
          />
          <button onClick={handleAddNew} className="px-4 bg-[#6B705C] text-white font-bold rounded-xl text-sm">+</button>
        </div>

        <div className="overflow-y-auto flex-1 pr-2 space-y-2 overscroll-contain">
          {options.length === 0 ? (
            <div className="px-5 py-3 text-base text-black/50 italic text-center">No options</div>
          ) : (
            options.map(opt => {
              const isSelected = selectedArr.includes(opt);
              return (
                <button type="button" key={opt} onClick={(e) => { e.preventDefault(); toggleOption(opt); }} className={`w-full py-4 px-6 rounded-2xl font-bold transition flex justify-between items-center text-left ${isSelected ? 'bg-[#6B705C] text-white' : 'bg-black/5 hover:bg-black/10 text-black capitalize'}`}>
                  {opt}
                  {isSelected && <span>✓</span>}
                </button>
              )
            })
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-black/10 shrink-0">
            <button onClick={() => setIsOpen(false)} className="w-full py-4 bg-black text-white rounded-2xl font-bold transition hover:bg-black/80">Done</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-wrap gap-2 w-full">
        {selectedArr.map(cat => (
          <span key={cat} className="px-3 py-2 bg-[#6B705C] text-white rounded-full text-sm font-bold shadow-sm flex items-center gap-1.5">
            {cat}
            <button onClick={(e) => { e.preventDefault(); toggleOption(cat); }} className="hover:text-white/50 bg-black/20 rounded-full w-5 h-5 flex items-center justify-center text-[10px]">✕</button>
          </span>
        ))}
        <button type="button" onClick={(e) => { e.preventDefault(); setIsOpen(true); }} className="px-4 py-2 bg-black/5 hover:bg-black/10 text-black/70 rounded-full text-sm font-bold border border-black/5 transition flex items-center gap-1.5 shadow-sm">
          <span className="text-lg leading-none mb-0.5">+</span> {selectedArr.length === 0 ? placeholder : 'Add'}
        </button>
      </div>
      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
}