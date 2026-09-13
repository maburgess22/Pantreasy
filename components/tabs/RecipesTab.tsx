import React, { useState, useEffect } from 'react';
import { Recipe } from '@/utils/types';

interface RecipesTabProps {
  recipes: Recipe[];
  allCombinedCategories: string[];
  handleCreateCategory: (name: string) => void;
  handleRenameCategory: (oldName: string, newName: string) => void;
  handleDeleteCategory: (name: string) => void;
  showAddRecipeMenu: boolean;
  setShowAddRecipeMenu: (val: boolean) => void;
  setShowManualAddRecipe: (val: boolean) => void;
  showImportInput: boolean;
  setShowImportInput: (val: boolean) => void;
  handleImportRecipe: (e: React.FormEvent) => void;
  importUrl: string;
  setImportUrl: (val: string) => void;
  isImporting: boolean;
  handleOpenRecipe: (recipe: Recipe) => void;
  setRecipeActionMenu: (val: { isOpen: boolean; recipe: Recipe | null }) => void;
}

export default function RecipesTab({
  recipes, allCombinedCategories, handleCreateCategory, handleRenameCategory, handleDeleteCategory,
  showAddRecipeMenu, setShowAddRecipeMenu, setShowManualAddRecipe, showImportInput,
  setShowImportInput, handleImportRecipe, importUrl, setImportUrl, isImporting,
  handleOpenRecipe, setRecipeActionMenu
}: RecipesTabProps) {
  
  const [viewingCategory, setViewingCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showTopMenu, setShowTopMenu] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  
  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingCatValue, setEditingCatValue] = useState('');

  useEffect(() => {
    if (showTopMenu || showCategoryManager || showAddRecipeMenu) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [showTopMenu, showCategoryManager, showAddRecipeMenu]);

  const categoryRecipes = recipes.filter(r => {
    const tags = (r.category || '').split(',').map(s => s.trim());
    const matchesCategory = viewingCategory === 'All Recipes' || tags.includes(viewingCategory!);
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoriesToDisplay = ['All Recipes', ...allCombinedCategories];

  return (
    <div className="space-y-6">
      
      {!viewingCategory ? (
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-[#6B705C] text-white py-8 shadow-sm mb-6 border-b border-black/10 -mt-6">
          <div className="max-w-6xl mx-auto px-4 md:px-8 flex justify-between items-center">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-snug font-mogena">Recipes</h2>
            <button onClick={() => setShowTopMenu(true)} className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition shrink-0 shadow-sm">
               <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-[#6B705C] text-white py-8 shadow-sm mb-6 border-b border-black/10 -mt-6">
          <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-4">
             <div className="flex items-center gap-4">
               <button onClick={() => { setViewingCategory(null); setSearchQuery(''); }} className="flex items-center justify-center text-black hover:text-black/60 transition shrink-0 -ml-2 p-2">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
               </button>
               <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-snug truncate font-mogena">{viewingCategory}</h2>
             </div>
             <input 
                type="text" 
                placeholder={`Search in ${viewingCategory}...`} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl text-base focus:outline-none bg-white border border-black/10 text-black placeholder:text-black/50 shadow-sm"
             />
          </div>
        </div>
      )}

      {!viewingCategory ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categoriesToDisplay.map(cat => {
            const firstRecipeWithImage = recipes.find(r => {
              if (!r.image) return false;
              if (cat === 'All Recipes') return true;
              return (r.category || '').split(',').map(s => s.trim()).includes(cat);
            });
            const img = firstRecipeWithImage?.image;

            return (
              <div key={cat} onClick={() => setViewingCategory(cat)} className="rounded-[28px] overflow-hidden cursor-pointer transition border border-black/10 hover:border-black/40 flex flex-col bg-white shadow-sm hover:shadow-md">
                 {img ? (
                   <img src={img} alt={cat} className="w-full h-32 md:h-40 object-cover" />
                 ) : (
                   <div className="w-full h-32 md:h-40 bg-[#6B705C]/10 flex items-center justify-center"><span className="text-black/30 font-medium text-sm">No Image</span></div>
                 )}
                 <div className="p-4 md:p-5 flex-1 flex items-center justify-center">
                    <h3 className="font-bold text-lg text-black leading-tight text-center truncate">{cat}</h3>
                 </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {categoryRecipes.length === 0 ? (
            <p className="text-center text-black/50 py-10">No recipes found.</p>
          ) : (
            categoryRecipes.map(recipe => {
              const tags = (recipe.category || 'Other').split(',').map(s => s.trim()).filter(Boolean);
              return (
                <div key={recipe.id} onClick={() => handleOpenRecipe(recipe)} className="flex items-center gap-4 p-2 rounded-[20px] bg-white border border-black/10 shadow-sm cursor-pointer hover:shadow-md transition">
                  {recipe.image ? (
                    <img src={recipe.image} alt={recipe.title} className="w-14 h-14 rounded-[16px] object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-[16px] bg-[#6B705C]/10 flex items-center justify-center shrink-0 border border-black/5"><span className="text-[10px] font-semibold text-black/40">No Img</span></div>
                  )}
                  <div className="flex-1 min-w-0 py-1">
                     <h3 className="font-bold text-base text-black leading-tight mb-1 truncate">{recipe.title}</h3>
                     <p className="text-xs text-black/60 truncate">{recipe.cook_time} &bull; {tags.join(', ')}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setRecipeActionMenu({isOpen: true, recipe}); }} className="p-4 text-black/40 hover:text-black shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}

      {showTopMenu && (
        <div className="fixed inset-0 bg-black/50 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity" onClick={() => setShowTopMenu(false)}>
           <div className="bg-white w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-6 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-xl mb-6 text-center border-b border-black/10 pb-4">Manage Recipes</h3>
              <div className="flex flex-col gap-2">
                 <button onClick={() => { setShowAddRecipeMenu(true); setShowTopMenu(false); }} className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition shadow-sm">
                   Add Recipe
                 </button>
                 <button onClick={() => { setShowCategoryManager(true); setShowTopMenu(false); }} className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition shadow-sm">
                   Category Manager
                 </button>
              </div>
           </div>
        </div>
      )}

      {showCategoryManager && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
           <div className="bg-white rounded-[32px] w-full max-w-md p-6 md:p-8 flex flex-col max-h-[90vh] animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-6 shrink-0">
               <h2 className="text-2xl font-bold text-black font-mogena">Categories</h2>
               <button onClick={() => setShowCategoryManager(false)} className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 text-black font-bold">✕</button>
             </div>
             
             <div className="flex gap-2 mb-4 shrink-0">
                <input 
                  type="text" 
                  placeholder="New Category..." 
                  value={newCatName} 
                  onChange={(e) => setNewCatName(e.target.value)} 
                  className="flex-1 px-4 py-3 rounded-xl bg-black/5 focus:outline-none text-base font-medium" 
                />
                <button onClick={() => { handleCreateCategory(newCatName); setNewCatName(''); }} className="px-5 bg-black text-white font-bold rounded-xl text-base shadow-sm">Add</button>
             </div>

             <div className="overflow-y-auto flex-1 space-y-2 pr-2">
               {allCombinedCategories.length === 0 ? <p className="text-center py-4 text-black/50">No custom categories.</p> : null}
               {allCombinedCategories.map(cat => (
                 <div key={cat} className="flex flex-col gap-2 bg-black/5 p-3 rounded-2xl">
                    {editingCat === cat ? (
                       <div className="flex gap-2 w-full">
                          <input type="text" value={editingCatValue} onChange={e => setEditingCatValue(e.target.value)} className="flex-1 px-3 py-2 rounded-xl focus:outline-none bg-white font-bold" />
                          <button onClick={() => { handleRenameCategory(cat, editingCatValue); setEditingCat(null); }} className="px-3 bg-[#6B705C] text-white rounded-xl font-bold text-sm">Save</button>
                          <button onClick={() => setEditingCat(null)} className="px-3 bg-black/10 text-black rounded-xl font-bold text-sm hover:bg-black/20">Cancel</button>
                       </div>
                    ) : (
                       <div className="flex justify-between items-center w-full">
                          <span className="font-bold px-2">{cat}</span>
                          <div className="flex gap-2">
                             <button onClick={() => { setEditingCat(cat); setEditingCatValue(cat); }} className="px-3 py-2 bg-white rounded-xl text-xs font-bold shadow-sm hover:bg-gray-50">Edit</button>
                             <button onClick={() => { if(window.confirm(`Delete "${cat}"? Recipes with this tag will lose it.`)) handleDeleteCategory(cat); }} className="px-3 py-2 bg-red-100 text-red-600 rounded-xl text-xs font-bold hover:bg-red-200">Delete</button>
                          </div>
                       </div>
                    )}
                 </div>
               ))}
             </div>
             
             <div className="mt-6 pt-4 border-t border-black/10 shrink-0">
                <button onClick={() => setShowCategoryManager(false)} className="w-full py-4 bg-black text-white rounded-2xl font-bold transition hover:bg-black/80">Done</button>
             </div>
           </div>
        </div>
      )}

      {showAddRecipeMenu && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity" onClick={() => setShowAddRecipeMenu(false)}>
          <div className="bg-white w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-6 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95" onClick={e => e.stopPropagation()}>
             <h3 className="font-bold text-xl mb-6 text-center border-b border-black/10 pb-4">Add Recipe</h3>
             <div className="flex flex-col gap-2">
               <button onClick={() => { setShowManualAddRecipe(true); setShowAddRecipeMenu(false); setShowImportInput(false); }} className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition shadow-sm">
                 Create New Recipe
               </button>
               <button onClick={() => { setShowImportInput(true); setShowAddRecipeMenu(false); }} className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition shadow-sm">
                 Add using Recipe URL
               </button>
             </div>
          </div>
        </div>
      )}

      {showImportInput && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4 transition-opacity">
           <div className="bg-white rounded-[32px] w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 flex flex-col gap-4">
             <div className="flex justify-between items-center shrink-0 border-b border-black/10 pb-4">
               <h2 className="text-xl font-bold text-black font-mogena">Import Recipe</h2>
               <button onClick={() => setShowImportInput(false)} className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 text-black font-bold">✕</button>
             </div>
             <form onSubmit={handleImportRecipe} className="flex flex-col gap-3 mt-2">
               <input type="url" placeholder="Paste recipe URL (e.g. foodnetwork.com/...)" value={importUrl} onChange={(e) => setImportUrl(e.target.value)} className="w-full px-4 py-4 rounded-2xl text-base focus:outline-none bg-black/5 border border-transparent focus:border-black/20 text-black placeholder:text-black/50" required />
               <button type="submit" disabled={isImporting} className="w-full font-bold py-4 rounded-2xl transition text-lg shadow-sm disabled:opacity-50 bg-black text-white hover:bg-black/80">
                 {isImporting ? 'Importing...' : 'Import Recipe'}
               </button>
             </form>
           </div>
        </div>
      )}

    </div>
  );
}