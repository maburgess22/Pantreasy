'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

import { PantryItem, Recipe, ShoppingItem, MealPlanItem } from '@/utils/types';
import { 
  toBaseUnit, fromBaseUnit, scaleAndConvertIngredient, cleanIngredientName, 
  getStandardGroceryItem, getAisle, compressImage, normalizeName, getNext7Days,
  computeExpiryDate, normalizeForScaler, getIngredientStatus
} from '@/utils/helpers';

import CustomSelect from '@/components/ui/CustomSelect';
import MultiCategorySelect from '@/components/ui/MultiCategorySelect';
import TopHeader from '@/components/TopHeader';
import BottomNav from '@/components/BottomNav';
import AccountSettingsModal from '@/components/modals/AccountSettingsModal';

import DashboardTab from '@/components/tabs/DashboardTab';
import PantryTab from '@/components/tabs/PantryTab';
import ShoppingTab from '@/components/tabs/ShoppingTab';
import RecipesTab from '@/components/tabs/RecipesTab';
import PlannerTab from '@/components/tabs/PlannerTab';
import LowStockTab from '@/components/tabs/LowStockTab';
import RecipeDetailView from '@/components/views/RecipeDetailView';
import EditRecipeView from '@/components/views/EditRecipeView'; // NEW!

const COMMON_UNITS = ['pcs', 'kg', 'g', 'lbs', 'oz', 'ml', 'l', 'cups', 'tbsp', 'tsp', 'cans', 'packs', 'dash', 'pinch', 'cloves'];

const DEFAULT_CATEGORIES = [
  'Produce', 'Dairy & Eggs', 'Meat & Poultry', 'Seafood', 'Vegetarian Products', 
  'Pantry Staples', 'Spices & Condiments', 'Bakery', 'Frozen Foods', 'Snacks & Sweets', 
  'Beverages', 'Deli & Prepared Foods', 'Household & Cleaning', 'Health & Personal Care', 
  'Pet Care', 'Other'
];

export default function PantryManager() {
  const supabase = createClient();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // --- 1. CORE STATE ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pantry' | 'recipes' | 'shopping' | 'planner' | 'lowstock'>('dashboard');
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  
  const [items, setItems] = useState<PantryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // --- 2. GLOBAL VIEWS & MODALS ---
  const [recipeActionMenu, setRecipeActionMenu] = useState<{isOpen: boolean, recipe: Recipe | null}>({isOpen: false, recipe: null});
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [targetPortions, setTargetPortions] = useState(4);
  const [measurementSystem, setMeasurementSystem] = useState<'metric' | 'imperial'>('metric');
  
  const [isEditingRecipe, setIsEditingRecipe] = useState(false);
  const [editRecipeForm, setEditRecipeForm] = useState({ title: '', category: '', cook_time: '', portions: 4, image: '', ingredientsList: [] as {id: number, name: string, amount: string, unit: string, isHeader?: boolean}[], instructionsText: '' });
  
  const [showManualAddRecipe, setShowManualAddRecipe] = useState(false);
  const [manualRecipe, setManualRecipe] = useState({ title: '', category: '', cook_time: '30 mins', portions: 4, ingredientsList: [{id: 1, name: '', amount: '1', unit: 'pcs'} as {id: number, name: string, amount: string, unit: string, isHeader?: boolean}], instructionsText: '', image: '' });

  const [showVoiceInputScreen, setShowVoiceInputScreen] = useState(false);
  const [voiceContext, setVoiceContext] = useState<'shopping' | 'pantry'>('shopping');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceParsedItems, setVoiceParsedItems] = useState<{id: number, name: string, quantity: number, unit: string, category?: string}[]>([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<any[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 3. PLANNER & DISTRIBUTION STATE ---
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [recipePickerTarget, setRecipePickerTarget] = useState<{date: string, mealType: string} | null>(null);
  const [planTargetPortions, setPlanTargetPortions] = useState(4);
  const [allocationsGrid, setAllocationsGrid] = useState<Record<string, number>>({});
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({});
  const [manualInputs, setManualInputs] = useState<Record<string, string>>({});
  const [manualInputsQty, setManualInputsQty] = useState<Record<string, number>>({});

  const [userDefinedCategories, setUserDefinedCategories] = useState<string[]>([]);
  
  // --- 4. DERIVED VALUES ---
  const next7Days = getNext7Days();
  const todayStr = new Date().toISOString().split('T')[0];
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const dynamicCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...(items || []).map(i => i?.category)])).filter(Boolean);

  const trackedItemsList = items.filter(i => i.track_low_stock);
  const untrackedItemsList = items.filter(i => !i.track_low_stock);
  const lowStockItems = trackedItemsList.filter(i => i.quantity <= (i.low_stock_threshold || 1));
  const todaysMeals = mealPlans.filter(m => m.date === todayStr);
  const dynamicRecipeTags = Array.from(new Set((recipes || []).flatMap(r => (r?.category || '').split(',').map(s => s.trim()).filter(Boolean))));
  const allCombinedCategories = Array.from(new Set([...userDefinedCategories, ...dynamicRecipeTags])).sort();
  const visiblePantryItems = items.filter(i => i.quantity > 0);

  const isGlobalModalOpen = !!(showAccountModal || showVoiceInputScreen || showBarcodeScanner || recipeActionMenu.isOpen || scannedItems || showDistributionModal || recipePickerTarget || showManualAddRecipe);

  // --- 5. EFFECTS ---
  useEffect(() => {
    if (isGlobalModalOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isGlobalModalOpen]);

  useEffect(() => {
    setIsMounted(true);
    const savedCats = localStorage.getItem('recipeCategories');
    if (savedCats) setUserDefinedCategories(JSON.parse(savedCats));

    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const uid = session.user.id;
      setUserId(uid);
      setUserEmail(session.user.email || '');
      setUserName(session.user.user_metadata?.full_name || '');

      const { data: pData } = await supabase.from('pantry_items').select('*').eq('user_id', uid).order('created_at', { ascending: false });
      if (pData) setItems(pData);
      const { data: rData } = await supabase.from('recipes').select('*').eq('user_id', uid).order('created_at', { ascending: false });
      if (rData) setRecipes(rData);
      const { data: sData } = await supabase.from('shopping_list').select('*').eq('user_id', uid).order('created_at', { ascending: false });
      if (sData) setShoppingList(sData);
      const { data: mData } = await supabase.from('meal_plan').select('*, recipes(title, image, cook_time, category)').eq('user_id', uid).gte('date', todayStr).order('date', { ascending: true });
      if (mData) setMealPlans(mData as MealPlanItem[]);
    };
    loadData();
  }, [router, supabase.auth, todayStr]);

  useEffect(() => {
    window.history.replaceState({ tab: 'dashboard', type: 'tab' }, '', window.location.pathname);
    const handlePopState = (e: PopStateEvent) => {
      if (e.state) {
        if (e.state.tab) setActiveTab(e.state.tab);
        if (e.state.type === 'tab') { setSelectedRecipe(null); setIsEditingRecipe(false); } 
        else if (e.state.type === 'recipe') { setSelectedRecipe(e.state.recipe); setIsEditingRecipe(false); } 
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // --- 6. CORE HANDLERS ---
  const handleTabChange = (tab: string) => { window.history.pushState({ tab, type: 'tab' }, '', `#${tab}`); setActiveTab(tab as any); setSelectedRecipe(null); setIsEditingRecipe(false); };
  const handleOpenRecipe = (recipe: Recipe) => { window.history.pushState({ tab: activeTab, recipe, type: 'recipe' }, '', `#recipe-${recipe.id}`); setSelectedRecipe(recipe); setTargetPortions(recipe.portions || 4); setIsEditingRecipe(false); window.scrollTo(0, 0); };
  const handleOpenLowStock = () => { window.history.pushState({ tab: 'lowstock', type: 'tab' }, '', `#lowstock`); setActiveTab('lowstock'); setSelectedRecipe(null); setIsEditingRecipe(false); };
  const handleBackNavigation = () => window.history.back();
  const handleSignOut = async () => { await supabase.auth.signOut(); router.push('/login'); };

  const handleUpdateAccount = async () => {
    setLoading(true); const updates: any = {};
    if (newEmail) updates.email = newEmail; if (newPassword) updates.password = newPassword;
    if (userName) updates.data = { full_name: userName };
    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.auth.updateUser(updates);
      if (error) showToast(error.message);
      else { showToast("Account updated!"); setNewEmail(''); setNewPassword(''); setShowAccountModal(false); if (newEmail) setUserEmail(newEmail); }
    }
    setLoading(false);
  };
  const handleDeleteAccount = async () => { if (!window.confirm("Are you sure?")) return; setLoading(true); showToast("Account deletion request submitted."); await supabase.auth.signOut(); router.push('/login'); setLoading(false); };


  // --- 7. RECIPE ACTIONS ---
  const startEditingRecipe = (recipeToEdit?: Recipe) => { 
    const target = recipeToEdit || selectedRecipe; if (!target) return; 
    if (!selectedRecipe || selectedRecipe.id !== target.id) { window.history.pushState({ tab: activeTab, recipe: target, type: 'recipe' }, '', `#recipe-${target.id}`); setSelectedRecipe(target); setTargetPortions(target.portions || 4); window.scrollTo(0, 0); }
    
    const parsedIngs = (target.ingredients || []).map((ing, i) => { 
      if (ing.startsWith('##')) return { id: Date.now() + i, name: ing, amount: '1', unit: 'pcs', isHeader: true };
      let clean = ing.replace(/^1\s*pcs\s+/i, '');
      let name = clean; let qty: string | number = 1; let unit = 'pcs';
      const dashMatch = clean.match(/^(.*?)\s*[-—–]\s*([\d.\/]+)\s*(.*)$/);
      if (dashMatch) {
         name = dashMatch[1].trim(); qty = dashMatch[2]; unit = dashMatch[3] || 'pcs';
      } else {
         const frontMatch = clean.match(/^([\d.\/]+)\s*(kg|g|lbs|oz|ml|l|cups|tbsp|tsp|cans|packs|pcs|pinch|dash|cloves)?\s*(.*)$/i);
         if (frontMatch) { qty = frontMatch[1]; unit = frontMatch[2] || 'pcs'; name = frontMatch[3]; }
      }
      return { id: Date.now() + i, name: name.trim(), amount: qty.toString(), unit: unit.toLowerCase(), isHeader: false };
    });
    
    if (parsedIngs.length === 0) parsedIngs.push({ id: Date.now(), name: '', amount: '1', unit: 'pcs', isHeader: false });
    setEditRecipeForm({ title: target.title || '', category: target.category || '', cook_time: target.cook_time || '', portions: target.portions || 4, image: target.image || '', ingredientsList: parsedIngs, instructionsText: (target.instructions || []).join('\n') }); setIsEditingRecipe(true); 
  };
  
  const saveEditedRecipe = async () => {
    if (!selectedRecipe || !editRecipeForm.title.trim()) return showToast("Recipe title cannot be empty."); setLoading(true);
    const cleanedIngredients = editRecipeForm.ingredientsList.filter(i => i.name.trim() !== '').map(i => i.isHeader || i.name.startsWith('##') ? i.name.trim() : `${i.amount || 1} ${i.unit || 'pcs'} ${i.name.trim()}`);
    const cleanedInstructions = editRecipeForm.instructionsText.split('\n').map(i => i.trim()).filter(i => i !== '');
    const updatedData = { title: editRecipeForm.title.trim(), category: editRecipeForm.category, cook_time: editRecipeForm.cook_time, portions: editRecipeForm.portions, image: editRecipeForm.image, ingredients: cleanedIngredients, instructions: cleanedInstructions };
    const { data, error } = await supabase.from('recipes').update(updatedData).eq('id', selectedRecipe.id).eq('user_id', userId).select().single();
    if (!error && data) { setRecipes(prev => prev.map(r => r.id === data.id ? data : r)); setSelectedRecipe(data); setIsEditingRecipe(false); showToast('Recipe updated!'); } setLoading(false);
  };

  const deleteRecipe = async (id: string, e?: React.MouseEvent) => { if (e) e.stopPropagation(); setRecipes(prev => prev.filter(r => r.id !== id)); await supabase.from('recipes').delete().eq('id', id).eq('user_id', userId); showToast('Recipe deleted.'); };

  const consumeRecipeIngredients = async (recipe: Recipe, currentMultiplier: number) => {
    setLoading(true); let pantryUpdates: {id: string, quantity: number, unit: string}[] = []; let newPantryState = [...items];
    for (const ing of (recipe.ingredients || [])) {
      if (ing.startsWith('##')) continue;
      const scaledIng = scaleAndConvertIngredient(normalizeForScaler(ing), currentMultiplier, measurementSystem);
      const matchData = scaledIng.match(/^([\d.\/]+)\s*(kg|g|lbs|oz|ml|l|cups|tbsp|tsp|cans|packs|pcs|pinch|dash|cloves)?\s*(.*)$/i);
      const neededQty = parseFloat(matchData?.[1] || '1') || 1;
      const neededUnit = (matchData?.[2] || 'pcs').toLowerCase();
      const lowerName = (matchData?.[3] || scaledIng).toLowerCase();
      
      const match = newPantryState.find(p => lowerName.includes((p.name || '').toLowerCase()) || (p.name || '').toLowerCase().includes(lowerName));
      if (match && match.quantity > 0) {
        const existingBase = toBaseUnit(match.quantity, match.unit || 'pcs'); const neededBase = toBaseUnit(neededQty, neededUnit);
        if (existingBase.base === neededBase.base) {
          const newBaseQty = Math.max(0, existingBase.qty - neededBase.qty); const final = fromBaseUnit(newBaseQty, existingBase.base);
          newPantryState = newPantryState.map(i => i.id === match.id ? { ...i, quantity: final.qty, unit: final.unit } : i);
          pantryUpdates.push({ id: match.id, quantity: final.qty, unit: final.unit });
        } else if ((match.unit || 'pcs').toLowerCase() === neededUnit) {
          const newQty = Math.max(0, match.quantity - neededQty);
          newPantryState = newPantryState.map(i => i.id === match.id ? { ...i, quantity: newQty } : i);
          pantryUpdates.push({ id: match.id, quantity: newQty, unit: match.unit || 'pcs' });
        }
      }
    }
    if (pantryUpdates.length > 0) {
       setItems(newPantryState);
       for (const update of pantryUpdates) { await supabase.from('pantry_items').update({ quantity: update.quantity, unit: update.unit }).eq('id', update.id).eq('user_id', userId); }
       showToast('Ingredients removed from pantry!');
    } else showToast('No matching items found in pantry to deduct.');
    setLoading(false);
  };

  const addMissingRecipeIngredients = async (recipe: Recipe, currentMultiplier: number) => {
    setLoading(true);
    const rawMissing = (recipe.ingredients || []).filter(i => !i.startsWith('##')).map(ing => scaleAndConvertIngredient(normalizeForScaler(ing), currentMultiplier, measurementSystem)).filter(scaledIng => getIngredientStatus(scaledIng, items).status !== 'in_stock');
    if (rawMissing.length === 0) { showToast('You already have all ingredients!'); setLoading(false); return; }
    for (const rawIng of rawMissing) {
      const matchData = rawIng.match(/^([\d.\/]+)\s*(kg|g|lbs|oz|ml|l|cups|tbsp|tsp|cans|packs|pcs|pinch|dash|cloves)?\s*(.*)$/i);
      let qty = parseFloat(matchData?.[1] || '1') || 1; let unit = (matchData?.[2] || 'pcs').toLowerCase(); let name = matchData?.[3] || rawIng;
      let cleanName = cleanIngredientName(name);
      
      const standard = getStandardGroceryItem(`${qty} ${unit} ${cleanName}`);
      const stdMatch = standard.match(/^([\d.]+)?\s*(?:\b(kg|g|lbs|oz|ml|l|cups|tbsp|tsp|cans|packs|pcs|pinch|dash|cloves)\b)?\s*(.*)$/i);
      let finalQty = parseFloat(stdMatch?.[1] || '1') || qty; let finalUnit = (stdMatch?.[2] || unit).toLowerCase(); let finalName = stdMatch?.[3] || standard;
      if (!stdMatch?.[1]) { finalQty = 1; finalUnit = 'pcs'; finalName = standard; }
      await addOrMergeShoppingItem({ name: finalName, quantity: finalQty, unit: finalUnit });
    }
    showToast('Missing ingredients added!'); setLoading(false);
  };

  // --- 9. CATEGORY MANAGEMENT ---
  const saveUserCategories = (cats: string[]) => { setUserDefinedCategories(cats); localStorage.setItem('recipeCategories', JSON.stringify(cats)); };
  const handleCreateCategory = (name: string) => { const trimmed = name.trim(); if (!trimmed || userDefinedCategories.includes(trimmed)) return; saveUserCategories([...userDefinedCategories, trimmed]); };
  const handleRenameCategory = async (oldName: string, newName: string) => {
    const trimmedNew = newName.trim(); if (!trimmedNew) return;
    saveUserCategories(userDefinedCategories.map(c => c === oldName ? trimmedNew : c));
    const recipesToUpdate = recipes.filter(r => (r.category || '').split(',').map(s => s.trim()).includes(oldName));
    if (recipesToUpdate.length > 0) {
      setLoading(true);
      for (const r of recipesToUpdate) {
        const tags = (r.category || '').split(',').map(s => s.trim()).filter(Boolean);
        const newCategoryString = Array.from(new Set(tags.map(t => t === oldName ? trimmedNew : t))).join(', ');
        await supabase.from('recipes').update({ category: newCategoryString }).eq('id', r.id).eq('user_id', userId);
        setRecipes(prev => prev.map(pr => pr.id === r.id ? { ...pr, category: newCategoryString } : pr));
      }
      setLoading(false);
    }
    showToast(`Category renamed to ${trimmedNew}`);
  };
  const handleDeleteCategory = async (catName: string) => {
    if (catName === 'All Recipes') return; saveUserCategories(userDefinedCategories.filter(c => c !== catName));
    const recipesToUpdate = recipes.filter(r => (r.category || '').split(',').map(s => s.trim()).includes(catName));
    if (recipesToUpdate.length > 0) {
      setLoading(true);
      for (const r of recipesToUpdate) {
        const tags = (r.category || '').split(',').map(s => s.trim()).filter(Boolean);
        const newCategoryString = tags.filter(t => t !== catName).join(', ');
        await supabase.from('recipes').update({ category: newCategoryString }).eq('id', r.id).eq('user_id', userId);
        setRecipes(prev => prev.map(pr => pr.id === r.id ? { ...pr, category: newCategoryString } : pr));
      }
      setLoading(false);
    }
    showToast(`Category deleted`);
  };

  // --- 10. DATABASE ADD/MERGE FUNCTIONS ---
  const addOrMergePantryItem = async (newItem: { name: string, category: string, quantity: number, unit: string, track_low_stock: boolean, low_stock_threshold: number, expiration_date?: string | null }) => {
    
    const perishableCategories = ['Produce', 'Dairy & Eggs', 'Meat & Poultry', 'Seafood', 'Deli & Prepared Foods', 'Vegetarian Products'];
    let expDate = newItem.expiration_date || null;
    
    if (!expDate && perishableCategories.includes(newItem.category)) {
      expDate = (await computeExpiryDate(newItem.name)) || null;
    }

    const existing = items.find(i => normalizeName(i.name) === normalizeName(newItem.name));
    
    if (existing) {
      const existingBase = toBaseUnit(existing.quantity, existing.unit); const newBase = toBaseUnit(newItem.quantity, newItem.unit);
      if (existingBase.base === newBase.base || existing.quantity === 0) {
        const combinedBaseQty = existing.quantity === 0 ? newBase.qty : existingBase.qty + newBase.qty;
        const final = fromBaseUnit(combinedBaseQty, existing.quantity === 0 ? newBase.base : existingBase.base);
        const newExpDate = existing.quantity === 0 ? expDate : (existing.expiration_date || expDate);
        
        await supabase.from('pantry_items').update({ quantity: final.qty, unit: final.unit, track_low_stock: newItem.track_low_stock || existing.track_low_stock, expiration_date: newExpDate }).eq('id', existing.id).eq('user_id', userId);
        setItems(prev => prev.map(i => i.id === existing.id ? { ...i, quantity: final.qty, unit: final.unit, track_low_stock: newItem.track_low_stock || i.track_low_stock, expiration_date: newExpDate } : i));
        return;
      }
    }

    const { data } = await supabase.from('pantry_items').insert([{ ...newItem, expiration_date: expDate, user_id: userId }]).select().single();
    if (data) setItems(prev => [data, ...prev]);
  };

  const addOrMergeShoppingItem = async (newItem: { name: string, quantity: number, unit: string }) => {
    const existing = shoppingList.find(i => normalizeName(i.name) === normalizeName(newItem.name) && !i.checked);
    if (existing) {
      const existingBase = toBaseUnit(existing.quantity || 1, existing.unit || 'pcs'); const newBase = toBaseUnit(newItem.quantity, newItem.unit);
      if (existingBase.base === newBase.base) {
        const combinedBaseQty = existingBase.qty + newBase.qty; const final = fromBaseUnit(combinedBaseQty, existingBase.base);
        await supabase.from('shopping_list').update({ quantity: final.qty, unit: final.unit }).eq('id', existing.id).eq('user_id', userId);
        setShoppingList(prev => prev.map(i => i.id === existing.id ? { ...i, quantity: final.qty, unit: final.unit } : i));
        return;
      }
    } 
    const { data } = await supabase.from('shopping_list').insert([{ ...newItem, user_id: userId }]).select().single();
    if (data) setShoppingList(prev => [data, ...prev]);
  };

  // --- 11. TRACKING & LOW STOCK ---
  const handleAddTrackedItem = async (itemName: string, category: string, unit: string, threshold: number) => {
    setLoading(true); const existing = items.find(i => normalizeName(i.name) === normalizeName(itemName));
    if (existing) {
       await supabase.from('pantry_items').update({ track_low_stock: true, low_stock_threshold: threshold }).eq('id', existing.id).eq('user_id', userId);
       setItems(prev => prev.map(i => i.id === existing.id ? { ...i, track_low_stock: true, low_stock_threshold: threshold } : i));
       showToast(`Linked tracker to existing ${existing.name}!`);
    } else {
       await addOrMergePantryItem({ name: itemName.trim(), category, quantity: 0, unit, track_low_stock: true, low_stock_threshold: threshold });
       showToast('Tracking added!');
    }
    setLoading(false);
  };
  const disableTrackingForId = async (id: string) => { setItems(prev => prev.map(i => i.id === id ? { ...i, track_low_stock: false } : i)); await supabase.from('pantry_items').update({ track_low_stock: false }).eq('id', id).eq('user_id', userId); };
  const updateLowStockThreshold = async (id: string, threshold: number) => { const val = Math.max(0, threshold); setItems(prev => prev.map(i => i.id === id ? { ...i, low_stock_threshold: val } : i)); await supabase.from('pantry_items').update({ low_stock_threshold: val }).eq('id', id).eq('user_id', userId); };

  const addLowStockToShopping = async () => { 
    const newItems = lowStockItems.map(item => ({ name: `${item.name} (Restock)`, user_id: userId })); 
    if (newItems.length === 0) return; 
    const { data } = await supabase.from('shopping_list').insert(newItems).select(); 
    if (data) { setShoppingList(prev => [...data, ...prev]); showToast('Added to shopping list!'); } 
  };

  // --- 12. PLANNER DISTRIBUTION ---
  const deleteMealPlan = async (id: string) => { setMealPlans(prev => prev.filter(m => m.id !== id)); await supabase.from('meal_plan').delete().eq('id', id).eq('user_id', userId); };
  const saveManualMeal = async (date: string, mealType: string) => { 
    const key = `${date}-${mealType}`; const value = manualInputs[key]; const qty = manualInputsQty[key] || 1; 
    if (!value || !value.trim()) return; 
    const { data } = await supabase.from('meal_plan').insert([{ date, meal_type: mealType, manual_name: value.trim(), portions: qty, user_id: userId }]).select('*, recipes(title)').single(); 
    if (data) { setMealPlans(prev => [...prev, data as MealPlanItem]); setManualInputs(prev => ({ ...prev, [key]: '' })); setManualInputsQty(prev => ({ ...prev, [key]: 1 })); } 
  };
  const startDistribution = () => { setPlanTargetPortions(targetPortions); setAllocationsGrid({}); setShowDistributionModal(true); };
  const handlePickRecipeForPlanner = (recipe: Recipe) => { if (!recipePickerTarget) return; setSelectedRecipe(recipe); setTargetPortions(recipe.portions || 4); setPlanTargetPortions(recipe.portions || 4); const key = `${recipePickerTarget.date}|${recipePickerTarget.mealType}`; setAllocationsGrid({ [key]: 1 }); setRecipePickerTarget(null); setShowDistributionModal(true); };
  const handleAllocate = (dateStr: string, mealType: string, delta: number) => { const key = `${dateStr}|${mealType}`; const current = allocationsGrid[key] || 0; if (delta > 0 && remainingPortions <= 0) return; if (delta < 0 && current <= 0) return; setAllocationsGrid(prev => ({ ...prev, [key]: current + delta })); };
  const saveMealPlan = async () => {
    if (!selectedRecipe) return; if (remainingPortions !== 0) return showToast(`Allocate exactly ${planTargetPortions} portions.`); setLoading(true);
    const inserts = Object.entries(allocationsGrid).filter(([_, qty]) => qty > 0).map(([key, qty]) => { const [date, meal_type] = key.split('|'); return { date, meal_type, recipe_id: selectedRecipe.id, portions: qty, user_id: userId }; });
    const { data } = await supabase.from('meal_plan').insert(inserts).select('*, recipes(title, image, cook_time, category)');
    if (data) { setMealPlans(prev => [...prev, ...(data as MealPlanItem[])]); showToast('Meals added to planner!'); setShowDistributionModal(false); } setLoading(false);
  };

  // --- 13. SCANNERS & VOICE ---
  useEffect(() => {
    let html5QrCode: any;
    if (showBarcodeScanner) {
      import('html5-qrcode').then(({ Html5Qrcode }) => {
        html5QrCode = new Html5Qrcode("barcode-reader");
        html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 150 } },
          async (decodedText: string) => { try { await html5QrCode.stop(); html5QrCode.clear(); } catch(e) {} setShowBarcodeScanner(false); await handleBarcodeScanned(decodedText); },
          (err: any) => { }
        ).catch((err: any) => { showToast("Camera access denied."); setShowBarcodeScanner(false); });
      }).catch(err => { showToast("Scanner failed to load."); setShowBarcodeScanner(false); });
    }
    return () => { if (html5QrCode && html5QrCode.isScanning) { html5QrCode.stop().then(() => html5QrCode.clear()).catch((e: any) => console.log(e)); } };
  }, [showBarcodeScanner]);

  const handleBarcodeScanned = async (barcode: string) => {
    setLoading(true); showToast('Barcode recognized! Fetching...');
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,generic_name,brands,quantity,categories_tags`); const data = await res.json();
      if (data.status === 1 && data.product) {
        const p = data.product; const itemName = p.product_name || p.generic_name || 'Unknown Item'; const brand = p.brands ? `${p.brands.split(',')[0]} ` : '';
        const fullName = `${brand}${itemName}`.trim().charAt(0).toUpperCase() + `${brand}${itemName}`.trim().slice(1).toLowerCase();
        if (p.quantity) { const match = p.quantity.match(/^([\d.]+)\s*([a-zA-Z]+)/); if (match) { await addOrMergePantryItem({ name: fullName, category: getAisle(fullName), quantity: parseFloat(match[1]), unit: match[2].toLowerCase(), track_low_stock: false, low_stock_threshold: 1 }); showToast('Item loaded and saved!'); setLoading(false); return; } }
        await addOrMergePantryItem({ name: fullName, category: getAisle(fullName), quantity: 1, unit: 'pcs', track_low_stock: false, low_stock_threshold: 1 }); showToast('Item loaded and saved!');
      } else { showToast('Product not found in database.'); }
    } catch (e) { showToast('Error looking up barcode.'); }
    setLoading(false);
  };

  const toggleListening = () => {
    if (isListening) { if (recognitionRef.current) recognitionRef.current.stop(); setIsListening(false); return; }
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return showToast('Web Speech API not supported.');
    setVoiceTranscript(''); setVoiceParsedItems([]);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition(); recognitionRef.current = recognition; recognition.lang = 'en-US'; recognition.continuous = true; recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => { let fullText = ''; for (let i = 0; i < event.results.length; i++) fullText += event.results[i][0].transcript + ' '; setVoiceTranscript(fullText.trim()); };
    recognition.onend = () => setIsListening(false); recognition.onerror = () => setIsListening(false); recognition.start();
  };

  useEffect(() => { if (!isListening && voiceTranscript.trim() && voiceParsedItems.length === 0) parseVoiceInput(voiceTranscript); }, [isListening, voiceTranscript]);

  const parseVoiceInput = async (textToParse: string) => {
    if (!textToParse.trim()) return;
    const numberMap: Record<string, string> = { 'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10', 'a': '1', 'an': '1' };
    let cleanText = textToParse.toLowerCase(); Object.keys(numberMap).forEach(word => { cleanText = cleanText.replace(new RegExp(`\\b${word}\\b`, 'g'), numberMap[word]); });
    const rawItems = cleanText.split(/\s+and\s+|,|\s+plus\s+/i).map(s => s.trim()).filter(Boolean);
    const parsedPromises = rawItems.map(async (itemStr, idx) => {
      let cleanedItemStr = itemStr.replace(/\b(of|some)\b/g, '').replace(/\s+/g, ' ').trim();
      const match = cleanedItemStr.match(/^([\d.]+)?\s*(?:\b(kg|g|lbs|oz|ml|l|cups|tbsp|tsp|cans|packs|pcs|grams|kilograms|liters|milliliters|cloves)\b)?\s*(.*)$/i);
      let qty = 1; let unit = 'pcs'; let parsedName = cleanedItemStr;
      if (match) { if (match[1]) qty = parseFloat(match[1]); if (match[2]) { const rawUnit = match[2].toLowerCase(); if (rawUnit === 'grams') unit = 'g'; else if (rawUnit === 'kilograms') unit = 'kg'; else if (rawUnit === 'liters') unit = 'l'; else if (rawUnit === 'milliliters') unit = 'ml'; else unit = rawUnit; } if (match[3]) parsedName = match[3]; }
      let standardizedName = parsedName.charAt(0).toUpperCase() + parsedName.slice(1); let predictedCategory = getAisle(standardizedName);
      if (unit === 'pcs') { if (standardizedName.toLowerCase().includes('milk') || standardizedName.toLowerCase().includes('water')) unit = 'ml'; if (standardizedName.toLowerCase().includes('flour') || standardizedName.toLowerCase().includes('sugar') || standardizedName.toLowerCase().includes('rice')) unit = 'g'; }
      return { id: Date.now() + idx, name: standardizedName.trim(), quantity: qty, unit, category: predictedCategory };
    });
    const parsed = await Promise.all(parsedPromises); setVoiceParsedItems(parsed);
  };

  const updateVoiceItem = (index: number, field: string, value: string | number) => { setVoiceParsedItems(prev => { const updated = [...prev]; updated[index] = { ...updated[index], [field]: value }; return updated; }); };
  const removeVoiceItem = (index: number) => setVoiceParsedItems(prev => prev.filter((_, i) => i !== index));
  const commitVoiceItems = async () => {
    if (voiceParsedItems.length === 0) return; setLoading(true);
    for (const item of voiceParsedItems) {
       if (voiceContext === 'shopping') await addOrMergeShoppingItem({ name: item.name, quantity: item.quantity, unit: item.unit });
       else await addOrMergePantryItem({ name: item.name, category: item.category || 'Other', quantity: item.quantity, unit: item.unit, track_low_stock: false, low_stock_threshold: 1 });
    }
    if (voiceContext === 'shopping') showToast('Items added to list!'); else showToast('Items added to pantry!');
    setVoiceParsedItems([]); setVoiceTranscript(''); setShowVoiceInputScreen(false); setLoading(false);
  };

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setIsScanning(true);
    try {
      const compressedFile = await compressImage(file); const formData = new FormData(); formData.append('receipt', compressedFile);
      const res = await fetch('/api/scan-receipt', { method: 'POST', body: formData }); const data = await res.json();
      if (data.items && data.items.length > 0) {
        showToast('Enriching items from database...');
        const enrichedItems = await Promise.all(data.items.map(async (item: any) => {
           if (item.unit === 'pcs' || !item.unit) {
              try {
                 const offRes = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(item.name)}&search_simple=1&action=process&json=1&page_size=1`); const offData = await offRes.json();
                 if (offData.products && offData.products.length > 0 && offData.products[0].quantity) { const match = offData.products[0].quantity.match(/^([\d.]+)\s*([a-zA-Z]+)/); if (match) { item.quantity = parseFloat(match[1]) || item.quantity; item.unit = match[2].toLowerCase(); } }
              } catch(e) {}
           }
           return item;
        }));
        setScannedItems(enrichedItems);
      } else showToast(data.message || 'Scanner API didn\'t find any items.');
    } catch { showToast('Failed to read receipt.'); }
    if (fileInputRef.current) fileInputRef.current.value = ''; setIsScanning(false);
  };

  const updateScannedItem = (index: number, field: string, value: string | number) => { setScannedItems(prev => { if (!prev) return prev; const updated = [...prev]; updated[index] = { ...updated[index], [field]: value }; return updated; }); };
  const removeScannedItem = (index: number) => setScannedItems(prev => prev ? prev.filter((_, i) => i !== index) : prev);
  const commitScannedItems = async () => {
    if (!scannedItems || scannedItems.length === 0) return setScannedItems(null); setLoading(true);
    for (const item of scannedItems) { await addOrMergePantryItem({ name: item.name, category: item.category || 'Other', quantity: parseFloat(item.quantity) || 1, unit: item.unit || 'pcs', track_low_stock: false, low_stock_threshold: 1 }); }
    showToast(`Added ${scannedItems.length} items to pantry!`); setScannedItems(null); setLoading(false);
  };

  const multiplier = selectedRecipe ? (targetPortions / (selectedRecipe.portions || 4)) : 1;
  const totalAllocated = Object.values(allocationsGrid).reduce((a, b) => a + b, 0);
  const remainingPortions = planTargetPortions - totalAllocated;

  if (!isMounted) return null;

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[url('/background.jpg')] bg-cover bg-center bg-fixed text-black p-4 pb-28 md:p-8 md:pb-8 font-montserrat">
      <datalist id="common-units">{COMMON_UNITS.map(u => <option key={u} value={u} />)}</datalist>
      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleScanReceipt} />

      {toast && (
        <div className="fixed inset-x-0 top-10 flex items-center justify-center z-[100] px-4 pointer-events-none">
          <div className="bg-black text-white px-6 py-4 rounded-2xl shadow-2xl font-bold text-center animate-in fade-in slide-in-from-top-4 pointer-events-auto">{toast}</div>
        </div>
      )}

      {/* DASHBOARD TOP HEADER */}
      {activeTab === 'dashboard' && !selectedRecipe && (
        <TopHeader activeTab={activeTab} handleTabChange={handleTabChange} setShowAccountModal={setShowAccountModal} />
      )}
      
      <AccountSettingsModal showModal={showAccountModal} setShowModal={setShowAccountModal} userEmail={userEmail} userName={userName} setUserName={setUserName} newEmail={newEmail} setNewEmail={setNewEmail} newPassword={newPassword} setNewPassword={setNewPassword} handleUpdateAccount={handleUpdateAccount} handleSignOut={handleSignOut} handleDeleteAccount={handleDeleteAccount} loading={loading} />

      {/* GLOBAL SCANNERS */}
      {showVoiceInputScreen && (
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <div className="bg-[#6B705C] p-6 md:p-8 rounded-[32px] shadow-2xl w-full max-w-2xl flex flex-col gap-6 text-white border border-black/10 animate-in fade-in zoom-in-95">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">Voice Entry</h2>
              <p className="text-white/80 text-sm">Say something like: "3 bananas and 200g of flour"</p>
            </div>
            <div className="flex justify-center mt-2">
              <button onClick={toggleListening} className={`px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all shadow-sm ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-black text-white hover:bg-black/80'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                {isListening ? 'Tap to Stop...' : 'Tap to Speak'}
              </button>
            </div>
            {voiceParsedItems.length > 0 && (
              <div className="flex flex-col gap-3 mt-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80 border-b border-white/20 pb-2 mb-2">Review Items</h3>
                {voiceParsedItems.map((item, index) => (
                  <div key={item.id} className="flex flex-row items-center gap-2 bg-white/10 p-2 rounded-2xl w-full relative z-0 hover:z-10">
                    <input value={item.name} onChange={e => updateVoiceItem(index, 'name', e.target.value)} className="flex-1 min-w-[80px] bg-white text-black px-2 py-2 rounded-xl text-sm focus:outline-none placeholder:text-black/50" placeholder="Item Name" />
                    <input type="number" step="any" value={item.quantity} onChange={e => updateVoiceItem(index, 'quantity', e.target.value)} className="w-12 bg-white text-black px-1 py-2 rounded-xl text-sm text-center focus:outline-none" />
                    <div className="w-[75px]"><CustomSelect value={item.unit} onChange={v => updateVoiceItem(index, 'unit', v)} options={COMMON_UNITS.map(u => ({label: u, value: u}))} className="bg-white rounded-xl" /></div>
                    <button onClick={() => removeVoiceItem(index)} className="w-8 h-8 shrink-0 flex items-center justify-center bg-red-500/80 text-white rounded-xl font-bold hover:bg-red-500 transition">✕</button>
                  </div>
                ))}
                <button onClick={commitVoiceItems} disabled={loading} className="w-full py-4 mt-4 bg-black text-white rounded-2xl font-bold hover:bg-black/80 shadow-sm transition">
                  {loading ? 'Saving...' : `Confirm & Add to ${voiceContext === 'shopping' ? 'List' : 'Pantry'}`}
                </button>
              </div>
            )}
            <div className="border-t border-white/20 pt-4 mt-2">
              <button onClick={() => { setShowVoiceInputScreen(false); setVoiceParsedItems([]); setVoiceTranscript(''); }} className="w-full py-3 bg-transparent text-white font-bold hover:bg-white/10 rounded-2xl transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showBarcodeScanner && (
        <div className="fixed inset-0 bg-black/90 z-[120] flex flex-col items-center justify-center p-4">
          <div className="bg-[#6B705C] p-6 md:p-8 rounded-[32px] shadow-2xl w-full max-w-sm flex flex-col items-center gap-6 text-white border border-black/10 animate-in fade-in zoom-in-95">
             <div className="text-center"><h2 className="text-3xl font-bold mb-2">Scan Barcode</h2><p className="text-white/80 text-sm">Align the barcode within the frame</p></div>
             <div id="barcode-reader" className="w-full rounded-2xl overflow-hidden shadow-inner bg-black"></div>
             <button onClick={() => setShowBarcodeScanner(false)} className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-100 shadow-sm transition">Cancel</button>
          </div>
        </div>
      )}

      {scannedItems && scannedItems.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
           <div className="bg-white rounded-[32px] w-full max-w-2xl p-6 md:p-8 flex flex-col max-h-[90vh] animate-in zoom-in-95">
             <h2 className="text-2xl font-bold mb-4">Review Scanned Items</h2>
             <div className="overflow-y-auto flex-1 space-y-3 pr-2 w-full">
               {scannedItems.map((item, index) => (
                  <div key={index} className="flex flex-col gap-2 bg-black/5 p-3 rounded-2xl relative z-0 hover:z-10 w-full">
                    <div className="flex gap-2 w-full">
                      <input value={item.name} onChange={e => updateScannedItem(index, 'name', e.target.value)} className="flex-1 w-full min-w-0 px-4 py-3 rounded-xl font-bold focus:outline-none bg-white placeholder:text-black/50" placeholder="Item Name" />
                      <button onClick={() => removeScannedItem(index)} className="w-12 h-12 flex items-center justify-center bg-red-500/80 text-white rounded-xl font-bold hover:bg-red-500 transition shrink-0">✕</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <input type="number" step="any" value={item.quantity || 1} onChange={e => updateScannedItem(index, 'quantity', e.target.value)} className="w-full px-4 py-3 rounded-xl text-center focus:outline-none bg-white" placeholder="Qty" />
                      <div className="w-full h-full"><CustomSelect value={item.unit || 'pcs'} onChange={v => updateScannedItem(index, 'unit', v)} options={COMMON_UNITS.map(u => ({label: u, value: u}))} className="bg-white rounded-xl w-full h-[48px]" /></div>
                    </div>
                    <div className="w-full mt-1">
                      <CustomSelect value={item.category || 'Other'} onChange={v => updateScannedItem(index, 'category', v)} options={dynamicCategories.map(c => ({label: c, value: c}))} className="bg-white rounded-xl w-full" />
                    </div>
                  </div>
               ))}
             </div>
             <div className="flex gap-3 mt-6 pt-4 border-t border-black/10 shrink-0">
                <button onClick={() => setScannedItems(null)} className="flex-1 py-3.5 rounded-2xl font-bold border border-black/20 text-black hover:bg-black/5 transition">Cancel</button>
                <button onClick={commitScannedItems} disabled={loading} className="flex-1 py-3.5 rounded-2xl font-bold bg-black text-white hover:bg-black/80 transition shadow-sm">{loading ? 'Saving...' : 'Confirm & Add'}</button>
             </div>
           </div>
        </div>
      )}

      {/* PLANNER DISTRIBUTION MODAL */}
      {showDistributionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="w-full max-w-3xl rounded-[32px] p-6 md:p-8 bg-white border border-black/20 text-black shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-4 border-black/10 mb-6 shrink-0">
              <h2 className="text-2xl font-bold">Plan Your Meals</h2>
              <button onClick={() => setShowDistributionModal(false)} className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 text-black font-bold">✕</button>
            </div>
            <div className="overflow-y-auto pr-2 space-y-6 flex-1">
              <div className="p-5 rounded-2xl bg-white border border-black/10 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                <div>
                  <h3 className="font-bold text-lg text-black">How many portions to plan?</h3>
                  <p className="text-black/60 text-sm">For {selectedRecipe?.title}</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-black/10 shadow-sm text-black">
                  <button onClick={() => { const newTarget = Math.max(1, planTargetPortions - 1); setPlanTargetPortions(newTarget); if (totalAllocated > newTarget) setAllocationsGrid({}); }} className="w-10 h-10 rounded-lg bg-black text-white hover:bg-black/80 font-bold text-lg">-</button>
                  <span className="w-8 text-center font-bold text-xl">{planTargetPortions}</span>
                  <button onClick={() => setPlanTargetPortions(planTargetPortions + 1)} className="w-10 h-10 rounded-lg bg-black text-white hover:bg-black/80 font-bold text-lg">+</button>
                </div>
              </div>
              <div>
                <div className="space-y-3">
                  {next7Days.map(dateStr => {
                      const dateObj = new Date(dateStr);
                      const isToday = dateStr === todayStr;
                      const dayName = isToday ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                      return (
                        <div key={dateStr} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 p-3 bg-white rounded-2xl border border-black/10 shadow-sm">
                          <span className="w-16 font-bold text-sm text-center sm:text-left pt-1">{dayName}</span>
                          <div className="flex-1 grid grid-cols-3 gap-2">
                            {['Breakfast', 'Lunch', 'Dinner'].map(meal => {
                              const key = `${dateStr}|${meal}`;
                              const qty = allocationsGrid[key] || 0;
                              const existingMeals = mealPlans.filter(m => m.date === dateStr && m.meal_type === meal);
                              return (
                                <div key={meal} className="flex flex-col items-center w-full">
                                  <span className="text-[10px] uppercase font-semibold text-black/50 mb-1">{meal}</span>
                                  {existingMeals.length > 0 && (
                                    <div className="flex flex-col gap-1 w-full mb-1">
                                      {existingMeals.map(m => (
                                        <span key={m.id} className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded text-center leading-tight truncate w-full" title={`${m.recipe_id ? (Array.isArray(m.recipes) ? m.recipes[0]?.title : m.recipes?.title) : m.manual_name} (${m.portions})`}>
                                          {m.portions}x {m.recipe_id ? (Array.isArray(m.recipes) ? m.recipes[0]?.title : m.recipes?.title) : m.manual_name}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {qty > 0 ? (
                                    <div className="flex items-center justify-between w-full bg-[#6B705C] text-white rounded-xl p-1 px-2 text-sm shadow-sm transition mt-auto">
                                      <button onClick={() => handleAllocate(dateStr, meal, -1)} className="font-bold px-2 py-1 hover:text-white/70 transition">-</button>
                                      <span className="font-bold">{qty}</span>
                                      <button onClick={() => handleAllocate(dateStr, meal, 1)} className="font-bold px-2 py-1 hover:text-white/70 transition">+</button>
                                    </div>
                                  ) : (
                                    <button onClick={() => handleAllocate(dateStr, meal, 1)} disabled={remainingPortions <= 0} className="w-full py-1.5 rounded-xl border-2 border-dashed border-black/20 text-black/40 hover:bg-black/5 hover:border-black/40 text-sm disabled:opacity-30 transition font-bold mt-auto">+</button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                  })}
                </div>
              </div>
            </div>
            <div className="pt-6 mt-4 border-t border-black/10 shrink-0">
              <button onClick={saveMealPlan} disabled={loading} className="w-full py-4 rounded-2xl font-bold text-lg bg-black text-white hover:bg-black/80 disabled:opacity-50 transition shadow-sm">{loading ? 'Saving...' : 'Confirm Meal Plan'}</button>
            </div>
          </div>
        </div>
      )}

      {/* RECIPE ACTION MENU */}
      {recipeActionMenu.isOpen && recipeActionMenu.recipe && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity" onClick={() => setRecipeActionMenu({isOpen: false, recipe: null})}>
           <div className="bg-white w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-6 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-xl mb-4 text-center px-4 leading-tight">{recipeActionMenu.recipe.title}</h3>
              <div className="flex flex-col gap-2">
                 <button onClick={() => { startEditingRecipe(recipeActionMenu.recipe!); setRecipeActionMenu({isOpen: false, recipe: null}); }} className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition shadow-sm">Edit Recipe</button>
                 <button onClick={() => { handleTabChange('planner'); setRecipeActionMenu({isOpen: false, recipe: null}); }} className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition shadow-sm">Add to Planner</button>
                 <button onClick={() => { deleteRecipe(recipeActionMenu.recipe!.id); setRecipeActionMenu({isOpen: false, recipe: null}); handleTabChange('recipes'); }} className="w-full py-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl font-bold transition mt-2 shadow-sm">Delete Recipe</button>
              </div>
           </div>
        </div>
      )}

      {recipePickerTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[80]" onClick={() => setRecipePickerTarget(null)}>
          <div className="w-full max-w-lg rounded-[32px] p-6 bg-white border border-black/20 shadow-2xl flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl">Select a Recipe</h3>
              <button onClick={() => setRecipePickerTarget(null)} className="text-black/50 hover:text-black font-bold text-xl">✕</button>
            </div>
            <div className="overflow-y-auto flex flex-col gap-3 pr-2 flex-1">
              {(recipes || []).length === 0 ? <p className="text-sm text-black/50 text-center py-4">No saved recipes found.</p> : (recipes || []).map(r => (
                <div key={r.id} onClick={() => handlePickRecipeForPlanner(r)} className="flex items-center gap-4 p-3 rounded-[24px] bg-white border border-black/10 shadow-sm cursor-pointer hover:shadow-md transition">
                  {r.image ? (
                    <img src={r.image} alt={r.title} className="w-16 h-16 rounded-[16px] object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-[16px] bg-[#6B705C]/10 flex items-center justify-center shrink-0 border border-black/5"><span className="text-[10px] font-semibold text-black/40">No Img</span></div>
                  )}
                  <div className="flex-1 min-w-0">
                     <h4 className="font-bold text-base text-black leading-tight mb-1">{r.title}</h4>
                     <p className="text-xs text-black/60 truncate">{r.cook_time} &bull; {r.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- EXPORTED EDIT RECIPE VIEW --- */}
      {selectedRecipe && isEditingRecipe && (
         <EditRecipeView 
            editRecipeForm={editRecipeForm}
            setEditRecipeForm={setEditRecipeForm}
            allCombinedCategories={allCombinedCategories}
            COMMON_UNITS={COMMON_UNITS}
            onCancel={() => setIsEditingRecipe(false)}
            onSave={saveEditedRecipe}
            loading={loading}
         />
      )}

      {/* --- EXPORTED RECIPE DETAIL VIEW --- */}
      {selectedRecipe && !isEditingRecipe && (
         <RecipeDetailView 
           recipe={selectedRecipe}
           items={items}
           handleBackNavigation={handleBackNavigation}
           setRecipeActionMenu={setRecipeActionMenu}
           setPlanTargetPortions={setPlanTargetPortions}
           setAllocationsGrid={setAllocationsGrid}
           setShowDistributionModal={setShowDistributionModal}
           addMissingRecipeIngredients={addMissingRecipeIngredients}
           consumeRecipeIngredients={consumeRecipeIngredients}
           targetPortions={targetPortions}
           setTargetPortions={setTargetPortions}
           measurementSystem={measurementSystem}
           setMeasurementSystem={setMeasurementSystem}
           multiplier={multiplier}
         />
      )}

      {/* --- TAB ROUTING --- */}
      {!selectedRecipe && activeTab === 'dashboard' && (
        <DashboardTab 
          todaysMeals={todaysMeals} recipes={recipes} handleOpenRecipe={handleOpenRecipe} 
          deleteMealPlan={deleteMealPlan} setRecipePickerTarget={setRecipePickerTarget} 
          todayStr={todayStr} handleTabChange={handleTabChange} visiblePantryItems={visiblePantryItems} 
          handleOpenLowStock={handleOpenLowStock} lowStockItems={lowStockItems} 
        />
      )}

      {!selectedRecipe && activeTab === 'pantry' && (
        <PantryTab 
          userId={userId} items={items} setItems={setItems} addOrMergePantryItem={addOrMergePantryItem}
          dynamicCategories={dynamicCategories} COMMON_UNITS={COMMON_UNITS} setShowBarcodeScanner={setShowBarcodeScanner} 
          setVoiceContext={setVoiceContext} setShowVoiceInputScreen={setShowVoiceInputScreen} isScanning={isScanning} 
          fileInputRef={fileInputRef} showToast={showToast}
        />
      )}

      {!selectedRecipe && activeTab === 'shopping' && (
        <ShoppingTab 
          userId={userId} shoppingList={shoppingList} setShoppingList={setShoppingList}
          addOrMergeShoppingItem={addOrMergeShoppingItem} lowStockItems={lowStockItems}
          COMMON_UNITS={COMMON_UNITS} setVoiceContext={setVoiceContext} setShowVoiceInputScreen={setShowVoiceInputScreen}
          addLowStockToShopping={addLowStockToShopping} showToast={showToast}
        />
      )}

      {!selectedRecipe && activeTab === 'recipes' && (
        <RecipesTab 
          userId={userId} recipes={recipes} setRecipes={setRecipes}
          allCombinedCategories={allCombinedCategories} handleCreateCategory={handleCreateCategory}
          handleRenameCategory={handleRenameCategory} handleDeleteCategory={handleDeleteCategory}
          handleOpenRecipe={handleOpenRecipe} startEditingRecipe={startEditingRecipe}
          setRecipeActionMenu={setRecipeActionMenu} handleTabChange={handleTabChange} showToast={showToast} COMMON_UNITS={COMMON_UNITS}
        />
      )}

      {!selectedRecipe && activeTab === 'planner' && (
        <PlannerTab 
          userId={userId} next7Days={next7Days} todayStr={todayStr} mealPlans={mealPlans} setMealPlans={setMealPlans}
          collapsedDays={collapsedDays} setCollapsedDays={setCollapsedDays} recipes={recipes} handleOpenRecipe={handleOpenRecipe} 
          deleteMealPlan={deleteMealPlan} setRecipePickerTarget={setRecipePickerTarget} manualInputs={manualInputs} 
          setManualInputs={setManualInputs} saveManualMeal={saveManualMeal} manualInputsQty={manualInputsQty} 
          setManualInputsQty={setManualInputsQty} showToast={showToast}
        />
      )}

      {!selectedRecipe && activeTab === 'lowstock' && (
        <LowStockTab 
          handleBackNavigation={handleBackNavigation} addLowStockToShopping={addLowStockToShopping} 
          lowStockItems={lowStockItems} untrackedItemsList={untrackedItemsList} trackedItemsList={trackedItemsList}
          handleAddTrackedItem={handleAddTrackedItem} updateLowStockThreshold={updateLowStockThreshold} 
          disableTrackingForId={disableTrackingForId} COMMON_UNITS={COMMON_UNITS} dynamicCategories={dynamicCategories} loading={loading}
        />
      )}

      <BottomNav activeTab={activeTab} handleTabChange={handleTabChange} showVoiceInputScreen={showVoiceInputScreen} />
    </main>
  );
}