// components/views/RecipeDetailView.tsx
import React, { useState } from 'react';
import { Recipe, PantryItem } from '@/utils/types';
import { 
  scaleAndConvertIngredient, 
  cleanIngredientName, 
  extractCoreItemName, 
  normalizeForScaler, 
  formatIngredientDisplay, 
  getIngredientStatus 
} from '@/utils/helpers';

interface RecipeDetailViewProps {
  recipe: Recipe;
  items: PantryItem[];
  handleBackNavigation: () => void;
  setRecipeActionMenu: (val: { isOpen: boolean, recipe: Recipe | null }) => void;
  setPlanTargetPortions: (val: number) => void;
  setAllocationsGrid: (val: Record<string, number>) => void;
  setShowDistributionModal: (val: boolean) => void;
  addMissingRecipeIngredients: (recipe: Recipe, multiplier: number) => void;
  consumeRecipeIngredients: (recipe: Recipe, multiplier: number) => void;
  targetPortions: number;
  setTargetPortions: (val: number) => void;
  measurementSystem: 'metric' | 'imperial';
  setMeasurementSystem: (val: 'metric' | 'imperial') => void;
  multiplier: number;
}

export default function RecipeDetailView({
  recipe, items, handleBackNavigation, setRecipeActionMenu, setPlanTargetPortions,
  setAllocationsGrid, setShowDistributionModal, addMissingRecipeIngredients,
  consumeRecipeIngredients, targetPortions, setTargetPortions,
  measurementSystem, setMeasurementSystem, multiplier
}: RecipeDetailViewProps) {
  
  const [recipeDetailTab, setRecipeDetailTab] = useState<'ingredients' | 'instructions'>('ingredients');
  let stepCounter = 0;
  
  // Track which ingredients have already generated a pill so they only show once
  const seenIngredients = new Set<string>();

  return (
    <div className="space-y-0">
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-[#6B705C] -mt-4 md:-mt-8">
        <div className="relative">
          <div className="absolute top-4 left-4 md:left-8 z-10">
            <button onClick={handleBackNavigation} className="flex items-center justify-center text-white hover:text-white/60 transition shrink-0 p-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
          </div>
          <div className="absolute top-4 right-4 md:right-8 z-10">
            <button onClick={(e) => { e.stopPropagation(); setRecipeActionMenu({isOpen: true, recipe}); }} className="flex items-center justify-center text-white hover:text-white/60 transition shrink-0 p-2">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
            </button>
          </div>

          {recipe.image ? (
            <img src={recipe.image} alt={recipe.title} className="w-full h-72 md:h-[400px] object-cover shadow-sm" />
          ) : (
            <div className="w-full h-32 bg-[#6B705C]/20 shadow-sm" />
          )}
        </div>

        <div className="bg-[#6B705C] text-white py-8 border-b border-black/10 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col items-center justify-center gap-6 relative">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-snug text-center w-full px-12 break-words whitespace-normal">{recipe.title}</h2>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto justify-center flex-wrap">
              <button onClick={() => { setPlanTargetPortions(targetPortions); setAllocationsGrid({}); setShowDistributionModal(true); }} className="px-6 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/80 transition shadow-sm text-center">Add to Meal Plan</button>
              <button onClick={() => addMissingRecipeIngredients(recipe, multiplier)} className="px-6 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/80 transition shadow-sm text-center">Add Missing Items to Shopping List</button>
              <button onClick={() => consumeRecipeIngredients(recipe, multiplier)} className="px-6 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/80 transition shadow-sm text-center">Recipe Made - Remove from Pantry</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex bg-black/5 p-1 rounded-2xl w-full md:w-auto">
            <button onClick={() => setRecipeDetailTab('ingredients')} className={`flex-1 md:px-8 py-3 text-sm font-bold rounded-xl transition ${recipeDetailTab === 'ingredients' ? 'bg-white shadow-sm text-black' : 'text-black/60 hover:text-black'}`}>Ingredients</button>
            <button onClick={() => setRecipeDetailTab('instructions')} className={`flex-1 md:px-8 py-3 text-sm font-bold rounded-xl transition ${recipeDetailTab === 'instructions' ? 'bg-white shadow-sm text-black' : 'text-black/60 hover:text-black'}`}>Instructions</button>
          </div>
        </div>

        {recipeDetailTab === 'ingredients' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-black/10 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-black/60">Portions:</span>
                <div className="flex items-center gap-2 text-black">
                  <button onClick={() => setTargetPortions(Math.max(1, targetPortions - 1))} className="w-7 h-7 rounded-lg bg-black/5 hover:bg-black/10 font-bold text-sm flex items-center justify-center transition">-</button>
                  <span className="w-5 text-center font-bold text-sm">{targetPortions}</span>
                  <button onClick={() => setTargetPortions(targetPortions + 1)} className="w-7 h-7 rounded-lg bg-black/5 hover:bg-black/10 font-bold text-sm flex items-center justify-center transition">+</button>
                </div>
              </div>
              <div className="flex items-center bg-black/5 rounded-lg p-1 text-black shrink-0">
                <button onClick={() => setMeasurementSystem('metric')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${measurementSystem === 'metric' ? 'bg-white shadow-sm text-black' : 'hover:bg-transparent text-black/60'}`}>Metric</button>
                <button onClick={() => setMeasurementSystem('imperial')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${measurementSystem === 'imperial' ? 'bg-white shadow-sm text-black' : 'hover:bg-transparent text-black/60'}`}>Imperial</button>
              </div>
            </div>

            <div className="space-y-0">
              {(recipe.ingredients || []).map((ing, i) => {
                if (ing.startsWith('##')) {
                  return (
                    <div key={i} className="pt-6 pb-2">
                       <h3 className="font-bold text-base uppercase tracking-wider text-[#6B705C] border-b-2 border-[#6B705C]/20 inline-block pr-8">{ing.replace('##', '').trim()}</h3>
                    </div>
                  );
                }
                const scaledIng = scaleAndConvertIngredient(normalizeForScaler(ing), multiplier, measurementSystem);
                const displayIng = formatIngredientDisplay(scaledIng);
                const statusObj = getIngredientStatus(scaledIng, items);
                return (
                  <div key={i} className="flex flex-row justify-between items-start gap-3 text-sm p-3 rounded-xl bg-white border border-black/10 text-black font-medium shadow-sm mb-2">
                    <span className="flex-1 pr-2 whitespace-normal break-words">{displayIng}</span>
                    <div className="shrink-0 flex items-center mt-0.5">
                      {statusObj.status === 'in_stock' && <span className="text-[10px] px-2.5 py-1 bg-[#6B705C] text-white rounded-full font-bold uppercase tracking-wider shadow-sm">In Pantry</span>}
                      {statusObj.status === 'insufficient' && <span className="text-[10px] px-2.5 py-1 border border-[#6B705C]/50 text-[#6B705C] rounded-full font-bold uppercase tracking-wider">Low Stock</span>}
                      {statusObj.status === 'missing' && <span className="text-[10px] px-2.5 py-1 bg-black text-white rounded-full font-bold uppercase tracking-wider shadow-sm">Missing</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {recipeDetailTab === 'instructions' && (
          <div className="space-y-5 animate-in fade-in">
            {(recipe.instructions || []).length ? (recipe.instructions || []).map((step, idx) => {
              if (step.includes('For full cooking instructions, visit')) return null;
              
              if (step.startsWith('##')) {
                stepCounter = 0; 
                return (
                  <div key={idx} className="pt-4 pb-0">
                    <h3 className="font-bold text-lg uppercase tracking-wider text-[#6B705C]">{step.replace('##', '').trim()}</h3>
                  </div>
                );
              }
              
              stepCounter++; 
              
              const stepIngredients = (recipe.ingredients || []).filter(i => !i.startsWith('##')).map(ing => {
                 const scaledIng = scaleAndConvertIngredient(normalizeForScaler(ing), multiplier, measurementSystem);
                 const matchData = scaledIng.match(/^([\d.\/]+)\s*(kg|g|lbs|oz|ml|l|cups|tbsp|tsp|cans|packs|pcs|pinch|dash|cloves)?\s*(.*)$/i);
                 const qty = matchData?.[1] || '1';
                 const unit = matchData?.[2] || 'pcs';
                 const name = matchData?.[3] || scaledIng;
                 
                 const coreWords = extractCoreItemName(name);
                 const stepLower = step.toLowerCase();
                 const isMatch = coreWords.some(word => word.length > 2 && stepLower.includes(word.toLowerCase()));
                 
                 if (isMatch) {
                    // Check if we've already displayed this ingredient pill
                    if (seenIngredients.has(ing)) return null; 
                    seenIngredients.add(ing); // Mark it as seen
                    return { name, qty, unit: unit.toLowerCase(), id: ing };
                 }
                 return null;
              }).filter(Boolean) as {name: string, qty: string, unit: string, id: string}[];

              return (
                <div key={idx} className="p-4 rounded-2xl space-y-2 bg-white border border-black/10 shadow-sm">
                  <span className="font-bold text-sm uppercase text-black/40 tracking-wider">Step {stepCounter}</span>
                  <p className="leading-relaxed text-black font-medium">{step}</p>
                  
                  {stepIngredients.length > 0 && (
                     <div className="flex flex-wrap gap-2 pt-3 mt-1 border-t border-black/5">
                        {stepIngredients.map((ing, i) => (
                           <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6B705C]/10 border border-[#6B705C]/20 rounded-lg shadow-sm cursor-default hover:bg-[#6B705C]/20 transition">
                              <span className="text-xs font-bold text-[#6B705C]">{ing.qty} {ing.unit !== 'pcs' ? ing.unit : ''}</span>
                              <span className="text-xs font-semibold text-black capitalize">{ing.name}</span>
                           </div>
                        ))}
                     </div>
                  )}
                </div>
              );
            }) : <p className="text-black/50 text-sm italic">No instructions saved.</p>}
            {recipe.source_url && <a href={recipe.source_url} target="_blank" rel="noopener noreferrer" className="mt-4 px-6 py-4 bg-white border border-black/20 rounded-2xl text-black font-bold text-center hover:bg-black/5 transition shadow-sm block">View Full Original Recipe</a>}
          </div>
        )}
      </div>
    </div>
  );
}