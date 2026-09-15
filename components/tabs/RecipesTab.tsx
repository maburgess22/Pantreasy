import React, { useState, useEffect } from 'react';
import { Recipe } from '@/utils/types';
import CustomSelect from '@/components/ui/CustomSelect';
import MultiCategorySelect from '@/components/ui/MultiCategorySelect';
import { createClient } from '@/utils/supabase/client';

interface RecipesTabProps {
  userId: string;
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  allCombinedCategories: string[];
  handleCreateCategory: (name: string) => void;
  handleRenameCategory: (oldName: string, newName: string) => void;
  handleDeleteCategory: (name: string) => void;
  handleOpenRecipe: (recipe: Recipe) => void;
  startEditingRecipe: (recipe?: Recipe) => void;
  setRecipeActionMenu: (val: { isOpen: boolean; recipe: Recipe | null }) => void;
  handleTabChange: (tab: string) => void;
  showToast: (msg: string) => void;
  COMMON_UNITS: string[];
}

export default function RecipesTab({
  userId, recipes, setRecipes, allCombinedCategories, handleCreateCategory, handleRenameCategory, handleDeleteCategory,
  handleOpenRecipe, startEditingRecipe, setRecipeActionMenu, handleTabChange, showToast, COMMON_UNITS
}: RecipesTabProps) {
  
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const [viewingCategory, setViewingCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showTopMenu, setShowTopMenu] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingCatValue, setEditingCatValue] = useState('');

  const [showAddRecipeMenu, setShowAddRecipeMenu] = useState(false);
  const [showManualAddRecipe, setShowManualAddRecipe] = useState(false);
  const [showImportInput, setShowImportInput] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  
  const [manualRecipe, setManualRecipe] = useState({ title: '', category: '', cook_time: '30 mins', portions: 4, ingredientsList: [{id: 1, name: '', amount: '1', unit: 'pcs'}], instructionsText: '', image: '' });

  useEffect(() => {
    if (showTopMenu || showCategoryManager || showAddRecipeMenu || showManualAddRecipe || showImportInput) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [showTopMenu, showCategoryManager, showAddRecipeMenu, showManualAddRecipe, showImportInput]);

  const categoryRecipes = recipes.filter(r => {
    const tags = (r.category || '').split(',').map(s => s.trim());
    const matchesCategory = viewingCategory === 'All Recipes' || tags.includes(viewingCategory!);
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoriesToDisplay = ['All Recipes', ...allCombinedCategories];

  const handleImportRecipe = async (e: React.FormEvent) => {
    e.preventDefault(); if (!importUrl) return; setIsImporting(true);
    try {
      const res = await fetch('/api/scrape-recipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: importUrl }) }); 
      const data = await res.json();
      if (res.ok && data.title) {
        // OVERRIDE category to blank so users must fill it out manually
        const { data: insertedData, error } = await supabase.from('recipes').insert([{ ...data, category: '', portions: 4, user_id: userId }]).select().single();
        if (error) throw error; 
        if (insertedData) { setRecipes(prev => [insertedData, ...prev]); showToast('Recipe imported!'); setShowImportInput(false); }
      } else {
        showToast('This website does not allow for recipe import.');
      }
    } catch { 
        showToast('This website does not allow for recipe import.'); 
    }
    setImportUrl(''); setIsImporting(false);
  };

  const updateIng = (setter: Function, idx: number, field: string, value: string) => {
    setter((prev: any) => { const clone = [...prev.ingredientsList]; clone[idx] = { ...clone[idx], [field]: value }; return { ...prev, ingredientsList: clone }; });
  };
  const addIngRow = (setter: Function) => {
    setter((prev: any) => ({ ...prev, ingredientsList: [...prev.ingredientsList, { id: Date.now(), name: '', amount: '1', unit: 'pcs' }] }));
  };
  const removeIngRow = (setter: Function, idx: number) => {
    setter((prev: any) => ({ ...prev, ingredientsList: prev.ingredientsList.filter((_: any, i: number) => i !== idx) }));
  };

  const saveManualRecipe = async () => {
    if (!manualRecipe.title.trim()) return showToast("Add a recipe title."); setLoading(true);
    const cleanedIngredients = manualRecipe.ingredientsList.filter(i => i.name.trim() !== '').map(i => `${i.amount || 1} ${i.unit || 'pcs'} ${i.name.trim()}`);
    const cleanedInstructions = manualRecipe.instructionsText.split('\n').map(i => i.trim()).filter(i => i !== '');
    const newRecipe = { title: manualRecipe.title.trim(), category: manualRecipe.category, cook_time: manualRecipe.cook_time, portions: manualRecipe.portions, image: manualRecipe.image, ingredients: cleanedIngredients, instructions: cleanedInstructions, user_id: userId };
    const { data, error } = await supabase.from('recipes').insert([newRecipe]).select().single();
    if (!error && data) { 
      setRecipes(prev => [data, ...prev]); setShowManualAddRecipe(false); 
      setManualRecipe({ title: '', category: '', cook_time: '30 mins', portions: 4, ingredientsList: [{id: 1, name: '', amount: '1', unit: 'pcs'}], instructionsText: '', image: '' }); 
      showToast('Recipe created!'); 
    } 
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {!viewingCategory ? (
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-[#6B705C] text-white py-8 shadow-sm mb-6 border-b border-black/10 -mt-4 md:-mt-8">
          <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col items-center justify-center relative w-full pt-4 md:pt-0">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-snug font-mogena text-center">Recipes</h2>
            <p className="text-white/80 text-sm mt-2 font-medium text-center">Your personal cookbook collection.</p>
            <button onClick={() => setShowTopMenu(true)} className="absolute right-4 md:right-8 p-3 bg-white/20 hover:bg-white/30 rounded-full transition shrink-0 shadow-sm top-[30%] -translate-y-1/2 md:top-1/2">
               <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-[#6B705C] text-white py-8 shadow-sm mb-6 border-b border-black/10 -mt-4 md:-mt-8">
          <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-4 pt-4 md:pt-0">
             <div className="w-full flex items-start justify-between">
                <div className="w-12 md:w-16">
                  <button onClick={() => { setViewingCategory(null); setSearchQuery(''); }} className="flex items-center justify-start text-white hover:text-white/60 transition shrink-0 p-2 -ml-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                </div>
                <div className="flex-1 flex flex-col items-center text-center">
                  <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-snug font-mogena text-center truncate w-full px-2">{viewingCategory}</h2>
                </div>
                <div className="w-12 md:w-16"></div>
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
                    <h3 className="font-bold text-lg text-black leading-tight text-center">{cat}</h3>
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
                <div key={recipe.id} onClick={() => handleOpenRecipe(recipe)} className="flex items-start gap-4 p-3 rounded-[20px] bg-white border border-black/10 shadow-sm cursor-pointer hover:shadow-md transition">
                  {recipe.image ? (
                    <img src={recipe.image} alt={recipe.title} className="w-14 h-14 rounded-[16px] object-cover shrink-0 mt-1" />
                  ) : (
                    <div className="w-14 h-14 rounded-[16px] bg-[#6B705C]/10 flex items-center justify-center shrink-0 border border-black/5 mt-1"><span className="text-[10px] font-semibold text-black/40">No Img</span></div>
                  )}
                  <div className="flex-1 min-w-0 py-1">
                     <h3 className="font-bold text-base text-black leading-tight mb-1 whitespace-normal break-words">{recipe.title}</h3>
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
               <h2 className="text-2xl font-bold text-black">Categories</h2>
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
               <h2 className="text-xl font-bold text-black">Import Recipe</h2>
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

      {showManualAddRecipe && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="w-full max-w-4xl rounded-[32px] p-6 md:p-8 bg-white border border-black/20 text-black shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-4 border-black/10 mb-6 shrink-0">
              <h2 className="text-2xl font-bold">Create Recipe</h2>
              <button onClick={() => setShowManualAddRecipe(false)} className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 text-black font-bold">✕</button>
            </div>
            <div className="overflow-y-auto pr-2 space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Title</label>
                  <input type="text" value={manualRecipe.title} onChange={e => setManualRecipe({...manualRecipe, title: e.target.value})} className="w-full p-3 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm" placeholder="e.g. Grandma's Lasagna" />
                </div>
                <div className="space-y-1.5 relative z-10">
                  <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Categories</label>
                  <MultiCategorySelect 
                     selected={manualRecipe.category} 
                     onChange={v => setManualRecipe({...manualRecipe, category: v})} 
                     options={allCombinedCategories.filter(c => c !== 'All Recipes')} 
                  />
                </div>
                <div className="space-y-1.5 relative z-0">
                  <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Cook Time</label>
                  <input type="text" value={manualRecipe.cook_time} onChange={e => setManualRecipe({...manualRecipe, cook_time: e.target.value})} className="w-full p-3 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm" placeholder="e.g. 45 mins" />
                </div>
                <div className="space-y-1.5 relative z-0">
                  <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Portions</label>
                  <input type="number" value={manualRecipe.portions} onChange={e => setManualRecipe({...manualRecipe, portions: parseInt(e.target.value) || 1})} className="w-full p-3 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm" />
                </div>
              </div>

              <div className="space-y-3 mt-6">
                <label className="text-sm font-semibold uppercase tracking-wider text-black/70 block mb-1">Ingredients</label>
                {manualRecipe.ingredientsList.map((ing, idx) => (
                   <div key={ing.id} className="flex flex-col gap-2 bg-black/5 p-3 rounded-2xl relative z-0 hover:z-10 w-full">
                      <div className="flex gap-2 w-full">
                        <input type="text" placeholder="Ingredient name" value={ing.name} onChange={e => updateIng(setManualRecipe, idx, 'name', e.target.value)} className="flex-1 w-full min-w-0 px-4 py-3 rounded-xl font-bold focus:outline-none bg-white placeholder:text-black/50" />
                        <button onClick={() => removeIngRow(setManualRecipe, idx)} className="w-12 h-12 flex items-center justify-center bg-red-500/80 text-white rounded-xl font-bold hover:bg-red-500 transition shrink-0">✕</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 w-full">
                        <input type="number" step="any" placeholder="1" value={ing.amount} onChange={e => updateIng(setManualRecipe, idx, 'amount', e.target.value)} className="w-full px-4 py-3 rounded-xl text-center focus:outline-none bg-white" />
                        <div className="w-full h-full">
                          <CustomSelect value={ing.unit} onChange={v => updateIng(setManualRecipe, idx, 'unit', v)} options={COMMON_UNITS.map(u => ({label: u, value: u}))} className="bg-white rounded-xl w-full h-[48px]" />
                        </div>
                      </div>
                   </div>
                ))}
                <button onClick={() => addIngRow(setManualRecipe)} className="px-4 py-3 w-full bg-white border border-black/10 rounded-2xl text-sm font-bold shadow-sm hover:bg-black/5 transition">+ Add Ingredient</button>
              </div>

              <div className="space-y-1.5 mt-6">
                <label className="text-sm font-semibold uppercase tracking-wider text-black/70 block mb-2">Instructions</label>
                <textarea value={manualRecipe.instructionsText} onChange={e => setManualRecipe({...manualRecipe, instructionsText: e.target.value})} className="w-full p-4 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm min-h-[150px]" placeholder="Paste one or multiple steps (each on a new line)..." />
                <p className="text-xs text-black/50">Press Enter for a new step.</p>
              </div>
            </div>
            <div className="pt-6 mt-4 border-t border-black/10 shrink-0 flex gap-3">
               <button onClick={() => setShowManualAddRecipe(false)} className="flex-1 py-4 rounded-2xl font-bold text-lg border border-black/20 bg-transparent text-black hover:bg-black/5 transition">Cancel</button>
               <button onClick={saveManualRecipe} disabled={loading} className="flex-1 py-4 rounded-2xl font-bold text-lg bg-black text-white hover:bg-black/80 disabled:opacity-50 transition shadow-sm">{loading ? 'Saving...' : 'Save Recipe'}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}