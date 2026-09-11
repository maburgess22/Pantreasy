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
    <div className={`relative w-full ${className}`} ref={ref}>
      <button type="button" onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }} className="w-full flex items-center justify-center relative focus:outline-none select-none px-4 py-3 bg-black/5 rounded-xl border border-transparent focus:border-[#6B705C] transition">
        <span className="truncate capitalize text-black font-medium text-base">{selectedLabel}</span>
        <span className="absolute right-4 text-[10px] opacity-50 text-black">▼</span>
      </button>
      {isOpen && (
        <div className={`absolute top-full left-0 mt-2 min-w-full w-max max-h-48 overflow-y-auto bg-[#1A1A1A] text-white rounded-2xl shadow-2xl z-[100] border border-white/10 flex flex-col ${menuClassName}`}>
          {options.length === 0 ? (
            <div className="px-5 py-3 text-base text-white/50 italic text-center">No options</div>
          ) : (
            options.map(opt => (
              <button type="button" key={opt.value} onClick={(e) => { e.preventDefault(); onChange(opt.value); setIsOpen(false); }} className="px-5 py-3 text-center text-base font-semibold hover:bg-white/10 transition border-b border-white/5 last:border-0 capitalize">
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}