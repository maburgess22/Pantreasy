// components/views/EditRecipeView.tsx
import React from 'react';
import CustomSelect from '@/components/ui/CustomSelect';
import MultiCategorySelect from '@/components/ui/MultiCategorySelect';

interface EditRecipeForm {
  title: string;
  category: string;
  cook_time: string;
  portions: number;
  image: string;
  ingredientsList: { id: number; name: string; amount: string; unit: string; isHeader?: boolean }[];
  instructionsText: string;
}

interface EditRecipeViewProps {
  editRecipeForm: EditRecipeForm;
  setEditRecipeForm: React.Dispatch<React.SetStateAction<EditRecipeForm>>;
  allCombinedCategories: string[];
  COMMON_UNITS: string[];
  onCancel: () => void;
  onSave: () => void;
  loading: boolean;
}

export default function EditRecipeView({
  editRecipeForm, setEditRecipeForm, allCombinedCategories, COMMON_UNITS, onCancel, onSave, loading
}: EditRecipeViewProps) {

  const updateEditIng = (idx: number, field: 'name' | 'amount' | 'unit', value: string) => {
    setEditRecipeForm(prev => { 
      const clone = [...prev.ingredientsList]; 
      clone[idx] = { ...clone[idx], [field]: value }; 
      return { ...prev, ingredientsList: clone }; 
    });
  };

  const addEditIngRow = (isHeader = false) => { 
    setEditRecipeForm(prev => ({ 
      ...prev, 
      ingredientsList: [...prev.ingredientsList, { id: Date.now(), name: isHeader ? '## ' : '', amount: '1', unit: 'pcs', isHeader }] 
    })); 
  };

  const removeEditIngRow = (idx: number) => { 
    setEditRecipeForm(prev => ({ 
      ...prev, 
      ingredientsList: prev.ingredientsList.filter((_, i) => i !== idx) 
    })); 
  };

  return (
    <div className="space-y-6 mt-4 max-w-6xl mx-auto">
      <div className="mb-4">
        <button onClick={onCancel} className="flex items-center gap-2 text-black hover:text-black/60 transition shrink-0 font-bold -ml-2 p-2">
           <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
           Cancel Edits
        </button>
      </div>
      <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-black/10 p-6 md:p-10 flex flex-col gap-6">
         <div className="border-b pb-4 border-black/10 mb-2 shrink-0">
            <h2 className="text-3xl font-bold">Edit Recipe</h2>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Title</label>
              <input type="text" value={editRecipeForm.title} onChange={e => setEditRecipeForm({...editRecipeForm, title: e.target.value})} className="w-full p-3 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm" />
            </div>
            <div className="space-y-1.5 relative z-10">
              <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Categories</label>
              <MultiCategorySelect 
                 selected={editRecipeForm.category} 
                 onChange={v => setEditRecipeForm({...editRecipeForm, category: v})} 
                 options={allCombinedCategories.filter(c => c !== 'All Recipes')} 
              />
            </div>
            <div className="space-y-1.5 relative z-0">
              <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Cook Time</label>
              <input type="text" value={editRecipeForm.cook_time} onChange={e => setEditRecipeForm({...editRecipeForm, cook_time: e.target.value})} className="w-full p-3 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm" />
            </div>
            <div className="space-y-1.5 relative z-0">
              <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Base Portions</label>
              <input type="number" value={editRecipeForm.portions} onChange={e => setEditRecipeForm({...editRecipeForm, portions: parseInt(e.target.value) || 1})} className="w-full p-3 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm" />
            </div>
            
            <div className="space-y-1.5 relative z-0 md:col-span-2">
              <label className="text-sm font-semibold uppercase tracking-wider text-black/70 block mb-2">Recipe Image</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                 {editRecipeForm.image && (
                    <img src={editRecipeForm.image} alt="Recipe" className="w-20 h-20 rounded-xl object-cover border border-black/10 shadow-sm" />
                 )}
                 <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                       const reader = new FileReader();
                       reader.onload = (event) => setEditRecipeForm({...editRecipeForm, image: event.target?.result as string});
                       reader.readAsDataURL(file);
                    }
                 }} className="flex-1 w-full p-3 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#6B705C]/10 file:text-[#6B705C] hover:file:bg-[#6B705C]/20 transition-all cursor-pointer" />
              </div>
            </div>
         </div>

         <div className="space-y-3 mt-4">
            <label className="text-sm font-semibold uppercase tracking-wider text-black/70 block mb-1">Ingredients</label>
            {editRecipeForm.ingredientsList.map((ing, idx) => (
               <div key={ing.id} className="flex flex-col gap-2 bg-black/5 p-3 rounded-2xl relative z-0 hover:z-10 w-full">
                  {ing.isHeader || ing.name.startsWith('##') ? (
                     <div className="flex gap-2 w-full">
                       <input type="text" placeholder="## Section Header" value={ing.name.startsWith('##') ? ing.name : `## ${ing.name}`} onChange={e => updateEditIng(idx, 'name', e.target.value)} className="flex-1 w-full min-w-0 px-4 py-3 rounded-xl font-bold uppercase tracking-wider focus:outline-none bg-[#6B705C]/10 text-[#6B705C] border border-[#6B705C]/30 placeholder:text-[#6B705C]/50" />
                       <button onClick={() => removeEditIngRow(idx)} className="w-12 h-12 flex items-center justify-center bg-red-500/80 text-white rounded-xl font-bold hover:bg-red-500 transition shrink-0">✕</button>
                     </div>
                  ) : (
                    <>
                      <div className="flex gap-2 w-full">
                        <input type="text" placeholder="Ingredient name" value={ing.name} onChange={e => updateEditIng(idx, 'name', e.target.value)} className="flex-1 w-full min-w-0 px-4 py-3 rounded-xl font-bold focus:outline-none bg-white placeholder:text-black/50" />
                        <button onClick={() => removeEditIngRow(idx)} className="w-12 h-12 flex items-center justify-center bg-red-500/80 text-white rounded-xl font-bold hover:bg-red-500 transition shrink-0">✕</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 w-full">
                        <input type="number" step="any" placeholder="1" value={ing.amount} onChange={e => updateEditIng(idx, 'amount', e.target.value)} className="w-full px-4 py-3 rounded-xl text-center focus:outline-none bg-white" />
                        <div className="w-full h-full">
                          <CustomSelect value={ing.unit} onChange={v => updateEditIng(idx, 'unit', v)} options={COMMON_UNITS.map(u => ({label: u, value: u}))} className="bg-white rounded-xl w-full h-[48px]" />
                        </div>
                      </div>
                    </>
                  )}
               </div>
            ))}
            <div className="flex gap-2">
              <button onClick={() => addEditIngRow(false)} className="flex-1 px-4 py-3 bg-white border border-black/10 rounded-2xl text-sm font-bold shadow-sm hover:bg-black/5 transition">+ Add Ingredient</button>
              <button onClick={() => addEditIngRow(true)} className="flex-1 px-4 py-3 bg-white border border-black/10 rounded-2xl text-sm font-bold shadow-sm hover:bg-black/5 transition">+ Add Heading</button>
            </div>
         </div>

         <div className="space-y-1.5 mt-4">
            <label className="text-sm font-semibold uppercase tracking-wider text-black/70 block mb-2">Instructions</label>
            <textarea value={editRecipeForm.instructionsText} onChange={e => setEditRecipeForm({...editRecipeForm, instructionsText: e.target.value})} className="w-full p-4 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm min-h-[150px]" />
            <p className="text-xs text-black/50 mt-1">Start a line with "## " to create a section header.</p>
         </div>
         <div className="pt-6 border-t border-black/10 shrink-0 flex gap-3">
           <button onClick={onCancel} className="flex-1 py-4 rounded-2xl font-bold text-lg border border-black/20 bg-transparent text-black hover:bg-black/5 transition">Cancel</button>
           <button onClick={onSave} disabled={loading} className="flex-1 py-4 rounded-2xl font-bold text-lg bg-black text-white hover:bg-black/80 disabled:opacity-50 transition shadow-sm">{loading ? 'Saving...' : 'Save Changes'}</button>
         </div>
      </div>
    </div>
  );
}