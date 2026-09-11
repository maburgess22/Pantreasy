// components/ui/FoodAutocomplete.tsx
import React, { useState, useEffect, useRef } from 'react';
import { searchFoodFacts } from '@/utils/helpers';

export default function FoodAutocomplete({ value, onChange, onSelect, placeholder, className, autoFocus = false }: { value: string, onChange: (val: string) => void, onSelect: (name: string, category: string) => void, placeholder: string, className: string, autoFocus?: boolean }) {
  const [suggestions, setSuggestions] = useState<{name: string, category: string}[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (value && value.length >= 2 && isOpen) {
        setIsSearching(true);
        const results = await searchFoodFacts(value);
        setSuggestions(results);
        setIsSearching(false);
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [value, isOpen]);

  return (
    <div className="relative flex-1 min-w-0" ref={ref}>
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
        placeholder={placeholder}
        className={className}
        required
        autoFocus={autoFocus}
        onFocus={() => { if (value && value.length >= 2) setIsOpen(true); }}
      />
      {isOpen && (suggestions.length > 0 || isSearching) && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white text-black border border-black/10 rounded-2xl shadow-2xl z-[100] overflow-hidden flex flex-col max-h-48">
          {isSearching && suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm italic text-black/50">Searching food database...</div>
          ) : (
            suggestions.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { onSelect(sug.name, sug.category); setIsOpen(false); }}
                className="px-4 py-3 text-left hover:bg-black/5 transition border-b border-black/5 last:border-0 truncate flex flex-col"
              >
                <span className="text-sm font-medium">{sug.name}</span>
                {sug.category !== 'Other' && <span className="text-[10px] text-black/40 uppercase font-bold">{sug.category}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}