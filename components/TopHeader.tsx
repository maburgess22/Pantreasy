// components/TopHeader.tsx
import React from 'react';

interface TopHeaderProps {
  activeTab: string;
  handleTabChange: (tab: string) => void;
  setShowAccountModal: (show: boolean) => void;
}

export default function TopHeader({ activeTab, handleTabChange, setShowAccountModal }: TopHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-black/10">
      <div className="flex items-center justify-between w-full sm:w-auto">
        <div className="flex items-center gap-3 md:gap-4">
          <img src="/logo.png" alt="Pantreasy Logo" className="w-[72px] h-[72px] md:w-20 md:h-20 object-contain shrink-0 mix-blend-multiply" />
          <div>
            <h1 className="text-4xl md:text-6xl font-mogena tracking-tight text-black mt-1">Pantreasy</h1>
            <p className="text-sm md:text-base text-black/70 mt-1 font-normal hidden md:block">Keep track of your ingredients & dinner plans</p>
          </div>
        </div>
        
        <button onClick={() => setShowAccountModal(true)} className="md:hidden text-black hover:opacity-70 transition p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </button>
      </div>
      
      <nav className="hidden md:flex flex-wrap items-center gap-1 p-1.5">
        {[{ id: 'dashboard', label: 'Dashboard' }, { id: 'pantry', label: 'Pantry' }, { id: 'recipes', label: 'Recipes' }, { id: 'shopping', label: 'Shopping List' }, { id: 'planner', label: 'Planner' }].map((tab) => (
          <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`px-4 py-2 rounded-xl text-sm transition ${activeTab === tab.id ? 'bg-black text-white font-medium' : 'text-black/80 hover:text-black font-normal'}`}>
            {tab.label}
          </button>
        ))}
        <div className="w-px h-6 bg-black/20 mx-1"></div>
        
        <button onClick={() => setShowAccountModal(true)} className="px-3 py-2 text-black hover:opacity-70 transition flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </button>
      </nav>
    </header>
  );
}