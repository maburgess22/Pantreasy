// components/tabs/PlannerTab.tsx
import React from 'react';
import { MealPlanItem, Recipe } from '@/utils/types';

interface PlannerTabProps {
  next7Days: string[];
  todayStr: string;
  mealPlans: MealPlanItem[];
  collapsedDays: Record<string, boolean>;
  setCollapsedDays: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  recipes: Recipe[];
  handleOpenRecipe: (recipe: Recipe) => void;
  deleteMealPlan: (id: string) => void;
  setRecipePickerTarget: (target: { date: string; mealType: string } | null) => void;
  manualInputs: Record<string, string>;
  setManualInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  saveManualMeal: (date: string, mealType: string) => void;
  manualInputsQty: Record<string, number>;
  setManualInputsQty: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export default function PlannerTab({
  next7Days, todayStr, mealPlans, collapsedDays, setCollapsedDays, recipes,
  handleOpenRecipe, deleteMealPlan, setRecipePickerTarget, manualInputs,
  setManualInputs, saveManualMeal, manualInputsQty, setManualInputsQty
}: PlannerTabProps) {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Week Ahead</h2>
      </div>
      <div className="space-y-6">
        {next7Days.map((dateStr) => {
          const dateObj = new Date(dateStr);
          const isToday = dateStr === todayStr;
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
          const mealsInDay = mealPlans.filter(m => m.date === dateStr);
          const isCollapsed = collapsedDays[dateStr] ?? mealsInDay.length === 0;

          return (
            <div key={dateStr} className={`rounded-[28px] p-6 border transition-all ${isToday ? 'bg-[#6B705C] border-black/20' : 'bg-[#6B705C]/90 border-black/10 shadow-sm'}`}>
              
              <div 
                onClick={() => setCollapsedDays(prev => ({ ...prev, [dateStr]: !isCollapsed }))}
                className="flex justify-between items-center cursor-pointer select-none group"
              >
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  {isToday && <span className="text-xs bg-black/20 text-white px-2 py-1 rounded-full uppercase tracking-wider">Today</span>} 
                  {dayName}
                </h3>
                <span className="text-white/50 font-bold group-hover:text-white transition">
                  {isCollapsed ? '▼ Show' : '▲ Hide'}
                </span>
              </div>

              {!isCollapsed && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 animate-in fade-in slide-in-from-top-2">
                  {['Breakfast', 'Lunch', 'Dinner'].map((mealType) => {
                    const slotKey = `${dateStr}-${mealType}`;
                    const mealsInSlot = mealsInDay.filter(m => m.meal_type === mealType);
                    return (
                      <div key={mealType} className="bg-white rounded-2xl p-4 border border-black/10 flex flex-col shadow-sm">
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-black/70 mb-3">{mealType}</h4>
                        <div className="flex-1 space-y-2 mb-3">
                          {mealsInSlot.length === 0 ? <p className="text-sm text-black/40 italic">Nothing planned</p> : mealsInSlot.map(meal => (
                            <div 
                              key={meal.id} 
                              onClick={() => {
                                if (meal.recipe_id) {
                                  const matchedRecipe = (recipes || []).find(r => r.id === meal.recipe_id);
                                  if (matchedRecipe) handleOpenRecipe(matchedRecipe);
                                }
                              }}
                              className={`flex justify-between items-start p-2.5 rounded-xl bg-black/5 border border-transparent transition group relative ${meal.recipe_id ? 'cursor-pointer hover:bg-black/10' : ''}`}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {meal.recipe_id && meal.recipes?.image ? (
                                  <img src={meal.recipes.image} alt={meal.recipes.title} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-black/5" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-[#6B705C]/10 flex items-center justify-center shrink-0 border border-black/5">
                                    <span className="text-[8px] font-semibold text-black/40 text-center leading-tight">{meal.recipe_id ? 'No Img' : 'Manual'}</span>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0 pr-2">
                                  <p className="font-semibold text-sm text-black leading-snug truncate">{meal.recipe_id ? meal.recipes?.title : meal.manual_name}</p>
                                  <p className="text-xs text-black/60 mt-0.5">{meal.portions} portion{meal.portions > 1 ? 's' : ''}</p>
                                </div>
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteMealPlan(meal.id); }} 
                                className="w-8 h-8 shrink-0 flex items-center justify-center text-black/30 hover:text-red-600 font-bold p-2 text-xs opacity-0 group-hover:opacity-100 transition z-10 rounded-full hover:bg-white shadow-sm"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col gap-2 mt-auto">
                          <button 
                            onClick={() => setRecipePickerTarget({ date: dateStr, mealType })} 
                            className="w-full px-3 py-2.5 rounded-xl text-sm bg-black/5 border border-transparent hover:border-[#6B705C] transition text-black/70 font-semibold text-left mb-1"
                          >
                            + Add saved recipe...
                          </button>
                          <div className="flex gap-2">
                            <input type="text" placeholder="Quick add manual..." value={manualInputs[slotKey] || ''} onChange={(e) => setManualInputs(prev => ({ ...prev, [slotKey]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') saveManualMeal(dateStr, mealType); }} className="flex-1 min-w-0 px-3 py-2 rounded-xl text-sm bg-black/5 border border-transparent focus:outline-none focus:border-[#6B705C] transition text-black" />
                            <input type="number" min="1" value={manualInputsQty[slotKey] || 1} onChange={(e) => setManualInputsQty(prev => ({ ...prev, [slotKey]: parseInt(e.target.value) || 1 }))} className="w-14 px-2 py-2 rounded-xl text-sm bg-black/5 border border-transparent focus:outline-none focus:border-[#6B705C] transition text-black text-center" title="Portions" />
                            <button onClick={() => saveManualMeal(dateStr, mealType)} className="px-3 py-2 bg-[#6B705C] text-white rounded-xl text-sm font-bold hover:bg-[#6B705C]/80 shadow-sm shrink-0">+</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}