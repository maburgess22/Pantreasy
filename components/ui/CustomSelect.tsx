// components/ui/CustomSelect.tsx
import React, { useState, useEffect, useRef } from 'react';

export default function CustomSelect({ value, options, onChange, placeholder = "Select...", className = "", menuClassName = "" }: { value: string, options: {label: string, value: string}[], onChange: (val: string) => void, placeholder?: string, className?: string, menuClassName?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

  return (
    <div className={`relative ${className}`} ref={ref}>
      <div onClick={() => setIsOpen(!isOpen)} className="w-full h-full flex items-center justify-between cursor-pointer focus:outline-none select-none px-3 py-2">
        <span className="truncate capitalize text-black text-sm">{selectedLabel}</span>
        <span className="text-[10px] ml-2 opacity-50 text-black">▼</span>
      </div>
      {isOpen && (
        <div className={`absolute top-full left-0 mt-2 min-w-full w-max max-h-48 overflow-y-auto bg-[#1A1A1A] text-white rounded-2xl shadow-2xl z-[100] border border-white/10 flex flex-col ${menuClassName}`}>
          {options.length === 0 ? (
            <div className="px-5 py-3 text-sm text-white/50 italic">No options</div>
          ) : (
            options.map(opt => (
              <button type="button" key={opt.value} onClick={(e) => { e.preventDefault(); onChange(opt.value); setIsOpen(false); }} className="px-5 py-3 text-left text-sm font-semibold hover:bg-white/10 transition border-b border-white/5 last:border-0 capitalize">
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}