// components/tabs/DashboardTab.tsx
import React from 'react';
import { Recipe, PantryItem, MealPlanItem } from '@/utils/types';

interface DashboardTabProps {
  todaysMeals: MealPlanItem[];
  recipes: Recipe[];
  handleOpenRecipe: (recipe: Recipe) => void;
  deleteMealPlan: (id: string) => void;
  setRecipePickerTarget: (target: { date: string; mealType: string } | null) => void;
  todayStr: string;
  handleTabChange: (tab: string) => void;
  visiblePantryItems: PantryItem[];
  handleOpenLowStock: () => void;
  lowStockItems: PantryItem[];
}

export default function DashboardTab({
  todaysMeals,
  recipes,
  handleOpenRecipe,
  deleteMealPlan,
  setRecipePickerTarget,
  todayStr,
  handleTabChange,
  visiblePantryItems,
  handleOpenLowStock,
  lowStockItems,
}: DashboardTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-[32px] p-6 md:p-8 border border-black/10 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-black">Today's Meal Plan</h2>
          <button onClick={() => handleTabChange('planner')} className="text-sm font-semibold text-black/60 hover:text-black transition">View Week &rarr;</button>
        </div>
        <div className="space-y-4 flex-1">
          {['Breakfast', 'Lunch', 'Dinner'].map(mealType => {
            const meals = todaysMeals.filter(m => m.meal_type === mealType);
            return (
              <div key={mealType} className="p-4 rounded-2xl bg-[#6B705C]/10 border border-black/5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B705C] mb-3">{mealType}</h3>
                {meals.length > 0 ? (
                  <div className="space-y-3">
                    {meals.map(meal => {
                      const matchedRecipe = meal.recipe_id ? (recipes || []).find(r => r.id === meal.recipe_id) : null;
                      const title = matchedRecipe ? matchedRecipe.title : meal.manual_name || 'Manual Meal';
                      const img = matchedRecipe ? matchedRecipe.image : null;
                      
                      return (
                      <div 
                        key={meal.id} 
                        onClick={() => {
                          if (matchedRecipe) handleOpenRecipe(matchedRecipe);
                        }}
                        className={`flex items-center gap-3 bg-white p-3 rounded-2xl border border-black/5 transition ${matchedRecipe ? 'cursor-pointer hover:shadow-md hover:border-black/20' : ''}`}
                      >
                        {img ? (
                          <img src={img} alt={title} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-black/5" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-[#6B705C]/10 flex items-center justify-center shrink-0 border border-black/5">
                            <span className="text-[10px] font-semibold text-black/40 text-center leading-tight">{matchedRecipe ? 'No Img' : 'Manual'}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-black truncate">{title}</p>
                          <p className="text-xs font-medium text-black/60 mt-0.5">{meal.portions || 1} portion{(meal.portions || 1) > 1 ? 's' : ''}</p>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteMealPlan(meal.id); }} 
                          className="w-8 h-8 shrink-0 flex items-center justify-center text-black/30 hover:text-red-600 bg-black/5 hover:bg-red-50 font-bold rounded-xl transition"
                        >
                          ✕
                        </button>
                      </div>
                    )})}
                  </div>
                ) : (
                  <div onClick={() => setRecipePickerTarget({ date: todayStr, mealType })} className="p-3 bg-white/50 rounded-2xl border border-dashed border-black/10 text-center cursor-pointer hover:bg-white hover:border-black/30 transition">
                    <p className="text-sm text-black/50 italic font-medium">Nothing planned. Tap to add.</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-6 flex flex-col">
        <div onClick={() => handleTabChange('pantry')} className="bg-[#6B705C] text-white rounded-[32px] p-6 md:p-8 border border-black/10 shadow-sm cursor-pointer hover:bg-[#5a5f4d] transition flex flex-col justify-center min-h-[160px]">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold uppercase tracking-wider text-white/80">Pantry Inventory</span>
            <span className="text-xl">&rarr;</span>
          </div>
          <h3 className="text-6xl font-bold">{visiblePantryItems.length} <span className="text-xl font-medium text-white/80">items</span></h3>
        </div>

        <div onClick={handleOpenLowStock} className="bg-white rounded-[32px] p-6 md:p-8 border border-black/10 shadow-sm cursor-pointer hover:border-black/30 transition flex flex-col flex-1 max-h-[400px]">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-red-800">Low Stock Alerts</h3>
            <span className="text-sm font-bold text-red-800 bg-red-100 px-2.5 py-1 rounded-lg">{lowStockItems.length}</span>
          </div>
          {lowStockItems.length > 0 ? (
            <div className="space-y-3 overflow-y-auto pr-2">
              {lowStockItems.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3.5 rounded-xl bg-red-50 border border-red-100">
                  <span className="font-semibold text-sm text-black">{item.name}</span>
                  <span className="text-xs font-bold text-red-800">{item.quantity} {item.unit} left</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-black/50 mt-2">All tracked items are well stocked!</p>
          )}
        </div>
      </div>
    </div>
  );
}