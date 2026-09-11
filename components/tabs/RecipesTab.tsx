// components/tabs/RecipesTab.tsx
import React from 'react';
import { Recipe } from '@/utils/types';
import CustomSelect from '@/components/ui/CustomSelect';

interface RecipesTabProps {
  recipeSearchQuery: string;
  setRecipeSearchQuery: (val: string) => void;
  recipeCategoryFilter: string;
  setRecipeCategoryFilter: (val: string) => void;
  uniqueRecipeCategories: string[];
  recipeViewMode: 'grid' | 'list';
  setRecipeViewMode: (val: 'grid' | 'list') => void;
  recipeDropdownRef: React.RefObject<HTMLDivElement>;
  showAddRecipeMenu: boolean;
  setShowAddRecipeMenu: (val: boolean) => void;
  setShowManualAddRecipe: (val: boolean) => void;
  showImportInput: boolean;
  setShowImportInput: (val: boolean) => void;
  handleImportRecipe: (e: React.FormEvent) => void;
  importUrl: string;
  setImportUrl: (val: string) => void;
  isImporting: boolean;
  filteredRecipes: Recipe[];
  handleOpenRecipe: (recipe: Recipe) => void;
  setRecipeActionMenu: (val: { isOpen: boolean; recipe: Recipe | null }) => void;
}

export default function RecipesTab({
  recipeSearchQuery, setRecipeSearchQuery, recipeCategoryFilter, setRecipeCategoryFilter,
  uniqueRecipeCategories, recipeViewMode, setRecipeViewMode, recipeDropdownRef,
  showAddRecipeMenu, setShowAddRecipeMenu, setShowManualAddRecipe, showImportInput,
  setShowImportInput, handleImportRecipe, importUrl, setImportUrl, isImporting,
  filteredRecipes, handleOpenRecipe, setRecipeActionMenu
}: RecipesTabProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] p-6 bg-[#6B705C] text-white border border-black/10 shadow-sm flex flex-col gap-4 relative z-0 hover:z-10">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:flex-1 min-w-0">
            <input 
              type="text" 
              placeholder="Search recipes..." 
              value={recipeSearchQuery}
              onChange={(e) => setRecipeSearchQuery(e.target.value)}
              className="w-full min-w-0 px-4 py-3 rounded-2xl text-base focus:outline-none bg-white border border-black/20 text-black placeholder:text-black/50 shadow-sm"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <CustomSelect 
              value={recipeCategoryFilter} 
              onChange={setRecipeCategoryFilter} 
              options={uniqueRecipeCategories.map(c => ({label: c, value: c}))} 
              className="flex-1 sm:w-48 bg-white rounded-2xl border border-black/20 shadow-sm text-black"
            />
            
            <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-black/20 shrink-0">
              <button onClick={() => setRecipeViewMode('grid')} className={`px-3 flex items-center justify-center rounded-xl transition ${recipeViewMode === 'grid' ? 'bg-[#6B705C] text-white' : 'text-black/40 hover:text-black'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              </button>
              <button onClick={() => setRecipeViewMode('list')} className={`px-3 flex items-center justify-center rounded-xl transition ${recipeViewMode === 'list' ? 'bg-[#6B705C] text-white' : 'text-black/40 hover:text-black'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-white/20 my-2"></div>

        <div className="flex justify-end relative z-10">
          <div className="relative w-full md:w-56" ref={recipeDropdownRef}>
            <button onClick={() => setShowAddRecipeMenu(!showAddRecipeMenu)} className="relative w-full px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium transition hover:bg-black/80 shadow-sm flex items-center justify-center border border-black/20">
              <span>Add Recipe</span>
              <span className="absolute right-4 text-[10px]">▼</span>
            </button>
            {showAddRecipeMenu && (
              <div className="absolute left-0 md:left-auto md:right-0 mt-2 w-full md:w-[240px] max-w-[90vw] bg-[#1A1A1A] rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-[100] flex flex-col text-white">
                <button onClick={() => { setShowManualAddRecipe(true); setShowAddRecipeMenu(false); setShowImportInput(false); }} className="px-5 py-4 text-center text-sm font-semibold hover:bg-white/10 transition border-b border-white/5">Create New Recipe</button>
                <button onClick={() => { setShowImportInput(true); setShowAddRecipeMenu(false); }} className="px-5 py-4 text-center text-sm font-semibold hover:bg-white/10 transition border-b border-white/5">Add using Recipe URL</button>
              </div>
            )}
          </div>
        </div>
        
        {showImportInput && (
          <form onSubmit={handleImportRecipe} className="flex flex-col sm:flex-row gap-3 pt-2">
            <input type="url" placeholder="Paste recipe URL (e.g. foodnetwork.com/...)" value={importUrl} onChange={(e) => setImportUrl(e.target.value)} className="flex-1 min-w-0 px-4 py-3 rounded-2xl text-base focus:outline-none bg-white border border-black/20 text-black placeholder:text-black/50 shadow-sm" required />
            <button type="submit" disabled={isImporting} className="px-8 font-medium py-3.5 rounded-2xl transition text-base shadow-md active:scale-95 disabled:opacity-50 bg-black text-white hover:bg-black/80 shrink-0">
              {isImporting ? 'Importing...' : 'Import'}
            </button>
          </form>
        )}
      </div>
      
      <div className={recipeViewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" : "flex flex-col gap-3"}>
        {filteredRecipes.map((recipe) => (
          recipeViewMode === 'grid' ? (
            <div key={recipe.id} onClick={() => handleOpenRecipe(recipe)} className="rounded-[24px] overflow-hidden cursor-pointer transition border border-black/10 hover:border-black/40 flex flex-col justify-between bg-white shadow-sm hover:shadow-md">
              {recipe.image && <img src={recipe.image} alt={recipe.title} className="w-full h-40 object-cover" />}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-xl text-black leading-tight mb-1">{recipe.title}</h3>
                    <p className="text-sm mt-1 text-black/70">{recipe.cook_time} &bull; {recipe.portions || 4} portions</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setRecipeActionMenu({isOpen: true, recipe}); }} className="p-2 text-black/40 hover:text-black shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div key={recipe.id} onClick={() => handleOpenRecipe(recipe)} className="flex items-center gap-4 p-2 rounded-[20px] bg-white border border-black/10 shadow-sm cursor-pointer hover:shadow-md transition">
              {recipe.image ? (
                <img src={recipe.image} alt={recipe.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-[#6B705C]/10 flex items-center justify-center shrink-0 border border-black/5"><span className="text-[10px] font-semibold text-black/40">No Img</span></div>
              )}
              <div className="flex-1 min-w-0 py-1">
                 <h3 className="font-bold text-base text-black leading-tight mb-1">{recipe.title}</h3>
                 <p className="text-xs text-black/60 truncate">{recipe.cook_time} &bull; {recipe.category}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setRecipeActionMenu({isOpen: true, recipe}); }} className="p-4 text-black/40 hover:text-black shrink-0">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
              </button>
            </div>
          )
        ))}
      </div>
    </div>
  );
}