// components/BottomNav.tsx
import React from 'react';

interface BottomNavProps {
  activeTab: string;
  handleTabChange: (tab: string) => void;
  showVoiceInputScreen: boolean;
}

export default function BottomNav({ activeTab, handleTabChange, showVoiceInputScreen }: BottomNavProps) {
  if (showVoiceInputScreen) return null;

  const tabs = [
    { id: 'dashboard', label: 'Home', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
    { id: 'pantry', label: 'Pantry', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /> },
    { id: 'recipes', label: 'Recipes', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /> },
    { id: 'shopping', label: 'List', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /> },
    { id: 'planner', label: 'Plan', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> }
  ];

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-black/10 px-6 pt-3 pb-6 flex justify-between items-center z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabChange(tab.id)}
          className={`flex flex-col items-center gap-1 transition ${activeTab === tab.id ? 'text-[#6B705C] scale-110' : 'text-black/40 hover:text-black/70'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{tab.svg}</svg>
          <span className="text-[10px] font-bold tracking-wide">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}