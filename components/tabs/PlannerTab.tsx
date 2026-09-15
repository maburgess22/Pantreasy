import React from 'react';
import { MealPlanItem, Recipe } from '@/utils/types';

interface PlannerTabProps {
  userId: string;
  next7Days: string[];
  todayStr: string;
  mealPlans: MealPlanItem[];
  setMealPlans: React.Dispatch<React.SetStateAction<MealPlanItem[]>>;
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
  showToast: (msg: string) => void;
}

export default function PlannerTab({
  userId, next7Days, todayStr, mealPlans, setMealPlans,
  collapsedDays, setCollapsedDays, recipes, handleOpenRecipe,
  deleteMealPlan, setRecipePickerTarget, manualInputs,
  setManualInputs, saveManualMeal, manualInputsQty,
  setManualInputsQty, showToast
}: PlannerTabProps) {

  const toggleDay = (dateStr: string) => {
    setCollapsedDays(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-[#6B705C] text-white py-8 shadow-sm mb-6 border-b border-black/10 -mt-4 md:-mt-8">
        <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col items-center text-center gap-4 pt-4 md:pt-0">
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-snug font-mogena text-center">Meal Planner</h2>
            <p className="text-white/80 text-sm mt-2 font-medium text-center">Plan your meals for the week ahead.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {next7Days.map((dateStr) => {
          const dateObj = new Date(dateStr);
          const isToday = dateStr === todayStr;
          const dayName = isToday ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'long' });
          const shortDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          
          const daysMeals = mealPlans.filter(m => m.date === dateStr);
          const isCollapsed = collapsedDays[dateStr] !== undefined ? collapsedDays[dateStr] : daysMeals.length === 0;

          return (
            <div key={dateStr} className="bg-white rounded-[28px] border border-black/10 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
              
              <button 
                onClick={() => toggleDay(dateStr)} 
                className={`w-full flex items-center justify-between p-5 md:p-6 transition ${isCollapsed ? 'rounded-b-[28px]' : ''} ${isToday ? 'bg-[#5a5e4d]' : 'bg-[#6B705C]'} text-white`}
              >
                <div className="flex items-center gap-4">
                  <h3 className="font-bold text-xl text-white flex items-center gap-2">
                    {dayName} 
                    {isToday && <span className="text-[10px] px-2 py-0.5 bg-white text-[#6B705C] rounded-full uppercase tracking-wider font-bold">Now</span>}
                  </h3>
                  <span className="text-sm font-medium text-white/70 hidden sm:block">{shortDate}</span>
                </div>
                <div className="flex items-center gap-4">
                  {daysMeals.length > 0 && (
                     <span className="text-xs font-bold px-3 py-1 bg-white/20 text-white rounded-xl">
                       {daysMeals.length} planned
                     </span>
                  )}
                  <span className="text-white/70">
                    <svg className={`w-6 h-6 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </span>
                </div>
              </button>

              {!isCollapsed && (
                <div className="p-5 md:p-6 pt-0 border-t border-black/5 flex flex-col gap-6 mt-4">
                  {['Breakfast', 'Lunch', 'Dinner'].map(mealType => {
                    const mealsForSlot = daysMeals.filter(m => m.meal_type === mealType);
                    const manualKey = `${dateStr}-${mealType}`;

                    return (
                      <div key={mealType} className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className="w-24 shrink-0 pt-2">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-black/40">{mealType}</h4>
                        </div>
                        
                        <div className="flex-1 flex flex-col gap-3">
                          {mealsForSlot.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {mealsForSlot.map(meal => {
                                const isRecipe = !!meal.recipe_id;
                                const title = isRecipe ? (Array.isArray(meal.recipes) ? meal.recipes[0]?.title : meal.recipes?.title) : meal.manual_name;
                                
                                return (
                                  <div key={meal.id} className="flex items-center justify-between p-3 bg-black/5 rounded-2xl border border-black/5 relative z-0 hover:z-10 group">
                                    <div 
                                      className={`flex-1 min-w-0 flex flex-col ${isRecipe ? 'cursor-pointer hover:opacity-70 transition' : ''}`}
                                      onClick={() => isRecipe && handleOpenRecipe({ id: meal.recipe_id, title } as Recipe)}
                                    >
                                      <span className="font-bold text-sm text-black truncate pr-2">{title}</span>
                                      <span className="text-xs text-black/50 font-medium">{meal.portions} portions</span>
                                    </div>
                                    <button 
                                      onClick={() => deleteMealPlan(meal.id)} 
                                      className="w-8 h-8 rounded-full bg-white text-black/40 hover:text-red-500 hover:shadow-sm flex items-center justify-center font-bold transition shrink-0"
                                      title="Remove Meal"
                                    >✕</button>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row gap-2">
                            <button 
                              onClick={() => setRecipePickerTarget({ date: dateStr, mealType })}
                              className="px-4 py-2.5 bg-white border border-black/10 hover:bg-black/5 rounded-xl text-sm font-bold transition text-black shadow-sm flex items-center justify-center gap-2"
                            >
                              <span className="text-lg leading-none mb-0.5">+</span> Choose Recipe
                            </button>
                            
                            <div className="flex items-center gap-2 bg-white border border-black/10 rounded-xl p-1 shadow-sm flex-1">
                              <input 
                                type="text" 
                                placeholder="Or type quick meal..." 
                                value={manualInputs[manualKey] || ''}
                                onChange={(e) => setManualInputs(prev => ({...prev, [manualKey]: e.target.value}))}
                                onKeyDown={(e) => e.key === 'Enter' && saveManualMeal(dateStr, mealType)}
                                className="flex-1 min-w-[100px] bg-transparent text-sm px-3 py-1.5 focus:outline-none placeholder:text-black/30 font-medium"
                              />
                              <input 
                                type="number" 
                                min="1"
                                placeholder="Qty"
                                value={manualInputsQty[manualKey] || 1}
                                onChange={(e) => setManualInputsQty(prev => ({...prev, [manualKey]: parseInt(e.target.value) || 1}))}
                                className="w-14 bg-black/5 rounded-lg text-sm px-2 py-1.5 focus:outline-none text-center font-bold"
                              />
                              <button 
                                onClick={() => saveManualMeal(dateStr, mealType)}
                                disabled={!manualInputs[manualKey]?.trim()}
                                className="px-3 py-1.5 bg-[#6B705C] text-white rounded-lg text-sm font-bold disabled:opacity-50 transition"
                              >
                                Add
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
}