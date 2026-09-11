// components/ui/CustomSelect.tsx
import React, { useState, useEffect } from 'react';

export default function CustomSelect({ value, options, onChange, placeholder = "Select...", className = "" }: { value: string, options: {label: string, value: string}[], onChange: (val: string) => void, placeholder?: string, className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button type="button" onClick={(e) => { e.preventDefault(); setIsOpen(true); }} className={`w-full flex items-center justify-center relative focus:outline-none select-none px-4 py-3 bg-black/5 rounded-xl border border-transparent focus:border-[#6B705C] transition ${className}`}>
        <span className="truncate capitalize text-black font-medium text-base">{selectedLabel}</span>
        <span className="absolute right-4 text-[10px] opacity-50 text-black">▼</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity" onClick={() => setIsOpen(false)}>
          <div className="bg-white w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-6 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 shrink-0 border-b border-black/10 pb-4">
              <h3 className="font-bold text-xl text-center w-full">{placeholder}</h3>
            </div>
            <div className="overflow-y-auto flex-1 pr-2 space-y-2">
              {options.length === 0 ? (
                <div className="px-5 py-3 text-base text-black/50 italic text-center">No options</div>
              ) : (
                options.map(opt => (
                  <button type="button" key={opt.value} onClick={(e) => { e.preventDefault(); onChange(opt.value); setIsOpen(false); }} className={`w-full py-4 px-6 rounded-2xl font-bold transition flex justify-between items-center text-left ${value === opt.value ? 'bg-[#6B705C] text-white' : 'bg-black/5 hover:bg-black/10 text-black capitalize'}`}>
                    {opt.label}
                    {value === opt.value && <span>✓</span>}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}