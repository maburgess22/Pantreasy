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
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiringSoonItems = visiblePantryItems.filter(item => {
    if (!item.expiration_date || !item.created_at) return false;
    const createdDate = new Date(item.created_at); createdDate.setHours(0, 0, 0, 0);
    const [year, month, day] = item.expiration_date.split('-').map(Number);
    const expiryDate = new Date(year, month - 1, day); expiryDate.setHours(0, 0, 0, 0);
    const totalLifespanDays = Math.max(1, Math.ceil((expiryDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysRemaining <= Math.ceil(totalLifespanDays * 0.25);
  }).sort((a, b) => new Date(a.expiration_date!).getTime() - new Date(b.expiration_date!).getTime());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* MEAL PLAN TILE */}
      <div className="lg:col-span-2 bg-white rounded-[32px] overflow-hidden border border-black/10 shadow-sm flex flex-col">
        <div className="bg-[#6B705C] text-white p-6 md:p-8 pb-5 flex justify-between items-center shadow-sm">
          <h2 className="text-2xl font-bold uppercase tracking-wider">Today's Meal Plan</h2>
          <button onClick={() => handleTabChange('planner')} className="text-sm font-semibold text-white/80 hover:text-white transition">View Week &rarr;</button>
        </div>
        <div className="space-y-4 flex-1 p-6 md:p-8 pt-5">
          {['Breakfast', 'Lunch', 'Dinner'].map(mealType => {
            const meals = todaysMeals.filter(m => m.meal_type === mealType);
            return (
              <div key={mealType} className="p-4 rounded-2xl bg-[#6B705C]/5 border border-black/5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B705C] mb-3">{mealType}</h3>
                {meals.length > 0 ? (
                  <div className="space-y-3">
                    {meals.map(meal => {
                      const matchedRecipe = meal.recipe_id ? (recipes || []).find(r => r.id === meal.recipe_id) : null;
                      const title = matchedRecipe ? matchedRecipe.title : meal.manual_name || 'Manual Meal';
                      const img = matchedRecipe ? matchedRecipe.image : null;
                      
                      return (
                      <div key={meal.id} onClick={() => { if (matchedRecipe) handleOpenRecipe(matchedRecipe); }} className={`flex items-center gap-3 bg-white p-3 rounded-2xl border border-black/5 transition ${matchedRecipe ? 'cursor-pointer hover:shadow-md hover:border-black/20' : ''}`}>
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
                        <button onClick={(e) => { e.stopPropagation(); deleteMealPlan(meal.id); }} className="w-8 h-8 shrink-0 flex items-center justify-center text-black/30 hover:text-red-600 bg-black/5 hover:bg-red-50 font-bold rounded-xl transition">✕</button>
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
        {/* ABOUT TO EXPIRE TILE */}
        <div onClick={() => handleTabChange('pantry')} className="bg-white rounded-[32px] overflow-hidden border border-black/10 shadow-sm cursor-pointer hover:border-black/30 transition flex flex-col flex-1 max-h-[400px]">
          <div className="bg-[#6B705C] text-white p-6 pb-5 flex justify-between items-center shadow-sm shrink-0">
            <h3 className="text-base font-bold uppercase tracking-wider">About to Expire</h3>
            <span className="text-sm font-bold text-[#6B705C] bg-white px-2.5 py-1 rounded-lg">{expiringSoonItems.length}</span>
          </div>
          <div className="p-6 pt-5 overflow-hidden flex flex-col flex-1">
            {expiringSoonItems.length > 0 ? (
              <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {expiringSoonItems.map(item => {
                  const [y, m, d] = item.expiration_date!.split('-').map(Number);
                  const expDate = new Date(y, m - 1, d);
                  const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                  <div key={item.id} className="flex justify-between items-center p-3.5 rounded-xl bg-black/5 border border-black/10">
                    <span className="font-semibold text-sm text-black truncate pr-2">{item.name}</span>
                    <span className="text-xs font-bold text-red-600 shrink-0">
                      {diffDays < 0 ? 'Expired' : diffDays === 0 ? 'Today' : `${diffDays}d left`}
                    </span>
                  </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm italic text-black/50 mt-2">No items expiring soon!</p>
            )}
          </div>
        </div>

        {/* LOW STOCK TILE */}
        <div onClick={handleOpenLowStock} className="bg-white rounded-[32px] overflow-hidden border border-black/10 shadow-sm cursor-pointer hover:border-black/30 transition flex flex-col flex-1 max-h-[400px]">
          <div className="bg-[#6B705C] text-white p-6 pb-5 flex justify-between items-center shadow-sm shrink-0">
            <h3 className="text-base font-bold uppercase tracking-wider">Low Stock Alerts</h3>
            <span className="text-sm font-bold text-[#6B705C] bg-white px-2.5 py-1 rounded-lg">{lowStockItems.length}</span>
          </div>
          <div className="p-6 pt-5 overflow-hidden flex flex-col flex-1">
            {lowStockItems.length > 0 ? (
              <div className="space-y-3 overflow-y-auto pr-2">
                {lowStockItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3.5 rounded-xl bg-red-50 border border-red-100">
                    <span className="font-semibold text-sm text-black truncate pr-2">{item.name}</span>
                    <span className="text-xs font-bold text-red-800 shrink-0">{item.quantity} {item.unit} left</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm italic text-black/50 mt-2">All tracked items are well stocked!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}