'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

// --- TYPES ---
interface PantryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  track_low_stock?: boolean;
}

interface Recipe {
  id: string;
  title: string;
  category: string;
  cook_time: string;
  ingredients: string[];
  instructions?: string[];
  image?: string;
  source_url?: string;
  portions?: number;
}

interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
}

interface MealPlanItem {
  id: string;
  date: string;
  meal_type: string;
  recipe_id?: string;
  manual_name?: string;
  portions: number;
  recipes?: { title: string };
}

// --- CONSTANTS ---
const CATEGORIES = [
  { name: 'Produce', icon: '🥬' },
  { name: 'Dairy & Eggs', icon: '🥛' },
  { name: 'Meat & Seafood', icon: '🥩' },
  { name: 'Pantry Staples', icon: '🥫' },
  { name: 'Bakery', icon: '🍞' },
  { name: 'Frozen', icon: '🧊' },
  { name: 'Snacks', icon: '🍿' },
  { name: 'Beverages', icon: '🧃' },
  { name: 'Other', icon: '📦' }
];

const COMMON_UNITS = ['pcs', 'kg', 'g', 'lbs', 'oz', 'ml', 'l', 'cups', 'tbsp', 'tsp', 'cans', 'packs'];

function getItemIcon(name: string, category: string): string {
  const n = name.toLowerCase();
  if (n.includes('apple')) return '🍎';
  if (n.includes('banana')) return '🍌';
  if (n.includes('milk')) return '🥛';
  if (n.includes('egg')) return '🥚';
  if (n.includes('cheese')) return '🧀';
  if (n.includes('chicken')) return '🍗';
  if (n.includes('beef') || n.includes('steak')) return '🥩';
  if (n.includes('bread')) return '🍞';
  if (n.includes('rice')) return '🍚';
  if (n.includes('pasta')) return '🍝';
  if (n.includes('tomato')) return '🍅';
  if (n.includes('lettuce') || n.includes('salad')) return '🥗';
  if (n.includes('lemon') || n.includes('lime')) return '🍋';
  if (n.includes('butter')) return '🧈';
  if (n.includes('onion') || n.includes('garlic')) return '🧄';
  
  const catMatch = CATEGORIES.find(c => c.name.toLowerCase() === category.toLowerCase());
  return catMatch ? catMatch.icon : '📦';
}

function scaleIngredient(ingredient: string, multiplier: number): string {
  if (multiplier === 1) return ingredient;
  return ingredient.replace(/^([\d.]+)/, (match) => {
    const num = parseFloat(match);
    return (num * multiplier).toFixed(1).replace(/\.0$/, ''); 
  });
}

const getNext7Days = () => {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });
};

export default function PantryManager() {
  const supabase = createClient();
  const router = useRouter();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pantry' | 'recipes' | 'shopping' | 'planner'>('dashboard');
  const [items, setItems] = useState<PantryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlanItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Recipe Modal & Scaling State
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [targetPortions, setTargetPortions] = useState(4);
  
  // Meal Plan Distribution State
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [planTargetPortions, setPlanTargetPortions] = useState(4);
  const [allocationsGrid, setAllocationsGrid] = useState<Record<string, number>>({});

  // Manual Meal Planner Input State
  const [manualInputs, setManualInputs] = useState<Record<string, string>>({});

  // AI Scanner & Review State
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<any[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [name, useStateName] = useState('');
  const [category, setCategory] = useState('Produce');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [trackLowStock, setTrackLowStock] = useState(true);
  const [isManualCategory, setIsManualCategory] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  
  // Shopping List State
  const [shoppingInput, setShoppingInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Modals & Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editTrackLowStock, setEditTrackLowStock] = useState(true);
  const [showLowStockModal, setShowLowStockModal] = useState(false);

  const next7Days = getNext7Days();

  // --- LOAD DATA FROM SUPABASE ---
  useEffect(() => {
    const loadData = async () => {
      const { data: pData } = await supabase.from('pantry_items').select('*').order('created_at', { ascending: false });
      if (pData) setItems(pData);

      const { data: rData } = await supabase.from('recipes').select('*').order('created_at', { ascending: false });
      if (rData) setRecipes(rData);

      const { data: sData } = await supabase.from('shopping_list').select('*').order('created_at', { ascending: false });
      if (sData) setShoppingList(sData);

      const today = new Date().toISOString().split('T')[0];
      const { data: mData } = await supabase
        .from('meal_plan')
        .select('*, recipes(title)')
        .gte('date', today)
        .order('date', { ascending: true });
      if (mData) setMealPlans(mData as MealPlanItem[]);
    };
    loadData();
  }, []);

  // --- HANDLERS ---
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    useStateName(val);
    if (!isManualCategory && val.length > 2) {
      const lower = val.toLowerCase();
      if (lower.includes('milk') || lower.includes('cheese') || lower.includes('egg')) setCategory('Dairy & Eggs');
      else if (lower.includes('apple') || lower.includes('lettuce') || lower.includes('berry')) setCategory('Produce');
      else if (lower.includes('steak') || lower.includes('chicken') || lower.includes('fish')) setCategory('Meat & Seafood');
    }
  };

  // PANTRY CRUD
  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    const { data } = await supabase
      .from('pantry_items')
      .insert([{ name: name.trim(), category, quantity: parseFloat(quantity) || 1, unit, track_low_stock: trackLowStock }])
      .select()
      .single();

    if (data) setItems(prev => [data, ...prev]);
    
    useStateName('');
    setQuantity('1');
    setIsManualCategory(false);
    setLoading(false);
  };

  // AI RECEIPT SCANNER & REVIEW
  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);

    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const res = await fetch('/api/scan-receipt', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.items && data.items.length > 0) {
         setScannedItems(data.items);
      } else {
        alert(data.message || 'Could not find any items on this receipt.');
      }
    } catch {
      alert('Failed to read receipt. Please try another photo.');
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsScanning(false);
  };

  const updateScannedItem = (index: number, field: string, value: string | number) => {
    setScannedItems(prev => {
      if (!prev) return prev;
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeScannedItem = (index: number) => {
    setScannedItems(prev => {
      if (!prev) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const confirmScannedItems = async () => {
    if (!scannedItems || scannedItems.length === 0) {
      setScannedItems(null);
      return;
    }
    setLoading(true);
    
    const inserts = scannedItems.map(item => ({
      ...item,
      track_low_stock: true
    }));

    const { data: insertedData, error } = await supabase.from('pantry_items').insert(inserts).select();
    
    if (!error && insertedData) {
      setItems(prev => [...insertedData, ...prev]);
      alert(`Successfully added ${insertedData.length} items to your pantry!`);
      setScannedItems(null);
    } else {
      alert('Failed to save items to database.');
    }
    setLoading(false);
  };

  const deleteItem = async (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    await supabase.from('pantry_items').delete().eq('id', id);
  };
  
  const adjustQuantity = async (item: PantryItem, delta: number) => {
    const newQty = Math.max(0, Number((item.quantity + delta).toFixed(2)));
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));
    await supabase.from('pantry_items').update({ quantity: newQty }).eq('id', item.id);
  };

  const toggleLowStockTracking = async (item: PantryItem) => {
    const newTrack = !item.track_low_stock;
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, track_low_stock: newTrack } : i));
    await supabase.from('pantry_items').update({ track_low_stock: newTrack }).eq('id', item.id);
  };

  const startEditing = (item: PantryItem) => {
    setEditingId(item.id);
    setEditCategory(item.category);
    setEditQuantity(item.quantity.toString());
    setEditUnit(item.unit);
    setEditTrackLowStock(item.track_low_stock ?? true);
  };

  const saveEdit = async (id: string) => {
    const updatedItem = {
      category: editCategory,
      quantity: parseFloat(editQuantity) || 0,
      unit: editUnit,
      track_low_stock: editTrackLowStock
    };
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updatedItem } : item));
    setEditingId(null);
    await supabase.from('pantry_items').update(updatedItem).eq('id', id);
  };

  // RECIPE CRUD & SCALING
  const openRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setTargetPortions(recipe.portions || 4);
  };

  const handleImportRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl) return;
    setIsImporting(true);
    
    try {
      const res = await fetch('/api/scrape-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl })
      });
      
      const data = await res.json();
      
      if (res.ok && data.title) {
        const newRecipe = {
          ...data,
          portions: 4
        };

        const { data: insertedData, error } = await supabase
          .from('recipes')
          .insert([newRecipe])
          .select()
          .single();
          
        if (error) throw error;

        if (insertedData) {
          setRecipes(prev => [insertedData, ...prev]);
          alert('Recipe imported successfully!');
        }
      } else {
        alert(data.error || 'Could not extract a recipe from that URL.');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import recipe. Make sure it is a valid food blog URL.');
    }
    
    setImportUrl('');
    setIsImporting(false);
  };

  const deleteRecipe = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecipes(prev => prev.filter(r => r.id !== id));
    await supabase.from('recipes').delete().eq('id', id);
  };

  // MEAL PLAN DISTRIBUTION HANDLERS
  const startDistribution = () => {
    setPlanTargetPortions(targetPortions); 
    setAllocationsGrid({}); 
    setShowDistributionModal(true);
  };

  const handleAllocate = (dateStr: string, mealType: string, delta: number) => {
    const key = `${dateStr}|${mealType}`;
    const current = allocationsGrid[key] || 0;
    
    if (delta > 0 && remainingPortions <= 0) return; 
    if (delta < 0 && current <= 0) return;

    setAllocationsGrid(prev => ({ ...prev, [key]: current + delta }));
  };

  const saveMealPlan = async () => {
    if (!selectedRecipe) return;
    if (remainingPortions !== 0) {
      alert(`Please allocate exactly ${planTargetPortions} portions. You currently have ${remainingPortions} left to assign.`);
      return;
    }

    setLoading(true);
    const inserts = Object.entries(allocationsGrid)
      .filter(([_, qty]) => qty > 0)
      .map(([key, qty]) => {
        const [date, meal_type] = key.split('|');
        return {
          date,
          meal_type,
          recipe_id: selectedRecipe.id,
          portions: qty
        };
      });

    const { data, error } = await supabase.from('meal_plan').insert(inserts).select('*, recipes(title)');
    if (!error && data) {
      setMealPlans(prev => [...prev, ...(data as MealPlanItem[])]);
      alert('Meals added to planner!');
      setShowDistributionModal(false);
      setSelectedRecipe(null);
    } else {
      alert('Failed to save meal plan.');
    }
    setLoading(false);
  };

  const saveManualMeal = async (date: string, mealType: string) => {
    const key = `${date}-${mealType}`;
    const value = manualInputs[key];
    if (!value || !value.trim()) return;

    const { data } = await supabase.from('meal_plan').insert([{
      date,
      meal_type: mealType,
      manual_name: value.trim(),
      portions: 1
    }]).select('*, recipes(title)').single();

    if (data) {
      setMealPlans(prev => [...prev, data as MealPlanItem]);
      setManualInputs(prev => ({ ...prev, [key]: '' }));
    }
  };

  const deleteMealPlan = async (id: string) => {
    setMealPlans(prev => prev.filter(m => m.id !== id));
    await supabase.from('meal_plan').delete().eq('id', id);
  };

  // SHOPPING LIST CRUD
  const handleAddShoppingItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shoppingInput.trim()) return;
    
    const { data } = await supabase.from('shopping_list').insert([{ name: shoppingInput.trim() }]).select().single();
    if (data) setShoppingList(prev => [data, ...prev]);
    
    setShoppingInput('');
  };

  const toggleShoppingItem = async (id: string) => {
    const item = shoppingList.find(i => i.id === id);
    if (!item) return;
    
    setShoppingList(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
    await supabase.from('shopping_list').update({ checked: !item.checked }).eq('id', id);
  };

  const deleteShoppingItem = async (id: string) => {
    setShoppingList(prev => prev.filter(item => item.id !== id));
    await supabase.from('shopping_list').delete().eq('id', id);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Your browser does not support the Web Speech API. Please try Chrome or Safari.');
      return;
    }
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setShoppingInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.start();
  };

  // Computed Data
  const lowStockItems = items.filter(i => (i.track_low_stock ?? true) && i.quantity <= 1);
  const groupedItems = items.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PantryItem[]>);

  const getIngredientStatus = (ingredient: string, pantry: PantryItem[]) => {
    const lowerIng = ingredient.toLowerCase();
    const match = pantry.find(p => lowerIng.includes(p.name.toLowerCase()));
    if (!match) return { status: 'missing', requiredText: '1', availableText: '0' };
    if (match.quantity <= 0) return { status: 'insufficient', requiredText: '1', availableText: '0' };
    return { status: 'in_stock', requiredText: '1', availableText: `${match.quantity} ${match.unit}` };
  };

  const addLowStockToShopping = async () => {
    const newItems = lowStockItems.map(item => ({ name: `${item.name} (Restock)` }));
    if (newItems.length === 0) return;

    const { data } = await supabase.from('shopping_list').insert(newItems).select();
    if (data) {
      setShoppingList(prev => [...data, ...prev]);
      alert('Low stock items added to your shopping list!');
    }
  };

  const addMissingRecipeIngredients = async (recipe: Recipe, currentMultiplier: number) => {
    const missing = recipe.ingredients.map(ing => scaleIngredient(ing, currentMultiplier))
      .filter(scaledIng => getIngredientStatus(scaledIng, items).status !== 'in_stock');
      
    if (missing.length === 0) {
      alert('You already have all the ingredients!');
      return;
    }
    
    const newItems = missing.map(ing => ({ name: ing }));
    const { data } = await supabase.from('shopping_list').insert(newItems).select();
    if (data) {
      setShoppingList(prev => [...data, ...prev]);
      alert('Missing ingredients added to your shopping list!');
    }
  };

  // Recipe & Distribution Calculations
  const multiplier = selectedRecipe ? (targetPortions / (selectedRecipe.portions || 4)) : 1;
  const totalAllocated = Object.values(allocationsGrid).reduce((a, b) => a + b, 0);
  const remainingPortions = planTargetPortions - totalAllocated;

  // --- RENDER ---
  return (
    <main className="min-h-screen bg-[#fae7b9] text-black p-4 md:p-8 font-montserrat">
      
      {/* HTML Datalist for flexible unit suggestions */}
      <datalist id="common-units">
        {COMMON_UNITS.map(u => <option key={u} value={u} />)}
      </datalist>

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER / NAVIGATION */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-black/10">
          
          <div className="flex items-center gap-3 md:gap-4">
            <img 
              src="/logo.jpg" 
              alt="Pantreasy Logo" 
              className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover shrink-0 mix-blend-multiply" 
            />
            <div>
              <h1 className="text-5xl md:text-6xl font-mogena tracking-tight text-black">Pantreasy</h1>
              <p className="text-base text-black/70 mt-1 md:mt-2 font-normal">Keep track of your ingredients & dinner plans</p>
            </div>
          </div>
          
          <nav className="flex flex-wrap items-center gap-1 bg-white p-1.5 rounded-2xl border border-black/10 shadow-sm">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'pantry', label: 'Pantry' },
              { id: 'recipes', label: 'Recipes' },
              { id: 'shopping', label: 'Shopping List' },
              { id: 'planner', label: 'Planner' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-sm transition ${activeTab === tab.id ? 'bg-black text-[#fae7b9] font-medium' : 'text-black/80 hover:text-black font-normal'}`}
              >
                {tab.label}
              </button>
            ))}
            
            <div className="w-px h-6 bg-black/20 mx-1"></div>
            
            <button 
              onClick={handleSignOut}
              className="px-4 py-2 rounded-xl text-sm font-medium text-red-800 hover:bg-red-800/10 transition"
            >
              Sign Out
            </button>
          </nav>
        </header>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div onClick={() => setActiveTab('pantry')} className="rounded-[28px] p-6 cursor-pointer transition hover:border-black/40 space-y-2 bg-[#6B705C] text-white border border-black/20">
                <div className="flex justify-between items-center"><span className="text-3xl">🥗</span><span className="text-sm font-medium text-white/80">View Pantry →</span></div>
                <h3 className="text-5xl font-bold text-white">{items.length}</h3>
                <p className="text-base font-normal text-white/80">Pantry Items In Stock</p>
              </div>
              <div onClick={() => setActiveTab('recipes')} className="rounded-[28px] p-6 cursor-pointer transition hover:border-black/40 space-y-2 bg-[#6B705C] text-white border border-black/20">
                <div className="flex justify-between items-center"><span className="text-3xl">📖</span><span className="text-sm font-medium text-white/80">View Recipes →</span></div>
                <h3 className="text-5xl font-bold text-white">{recipes.length}</h3>
                <p className="text-base font-normal text-white/80">Saved Recipes</p>
              </div>
              <div onClick={() => setShowLowStockModal(true)} className="rounded-[28px] p-6 cursor-pointer transition hover:border-red-500/50 space-y-3 bg-[#6B705C] text-white border border-black/20">
                <div className="flex justify-between items-center"><span className="text-sm font-semibold uppercase tracking-wider text-red-200">⚠️ Low Stock Alert</span><span className="text-sm font-medium text-red-200">Expand →</span></div>
                {lowStockItems.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {lowStockItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 rounded-xl text-sm bg-white border border-black/10">
                        <span className="font-semibold text-black">{item.name}</span><span className="text-red-800 font-medium">{item.quantity} {item.unit} left</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm italic text-white/70">Pantry stock looks good!</p>}
              </div>
            </div>
          </div>
        )}

        {/* SHOPPING LIST TAB */}
        {activeTab === 'shopping' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
              <h2 className="text-2xl font-bold">Shopping List</h2>
              <button 
                onClick={addLowStockToShopping}
                disabled={lowStockItems.length === 0}
                className="px-4 py-2 bg-[#6B705C] text-[#fae7b9] rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-[#6B705C]/80 transition"
              >
                + Add Low Stock Items
              </button>
            </div>

            <form onSubmit={handleAddShoppingItem} className="flex gap-2">
              <button 
                type="button"
                onClick={startListening}
                className={`p-4 rounded-2xl transition border border-black/20 shadow-sm ${isListening ? 'bg-red-500 text-white animate-pulse border-red-500' : 'bg-white text-black hover:bg-black/5'}`}
                title="Use microphone"
              >
                🎙️
              </button>
              <input 
                type="text" 
                value={shoppingInput}
                onChange={(e) => setShoppingInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Add a product..."}
                className="flex-1 px-4 py-3 rounded-2xl text-base focus:outline-none bg-white border border-black/20 text-black placeholder:text-black/50 shadow-sm"
              />
              <button type="submit" className="px-6 py-3 font-medium rounded-2xl bg-black text-[#fae7b9] hover:bg-black/80">
                Add
              </button>
            </form>

            <div className="space-y-2">
              {shoppingList.length === 0 ? (
                <p className="text-center text-black/60 py-8">Your list is empty.</p>
              ) : (
                shoppingList.map(item => (
                  <div key={item.id} className={`flex items-center justify-between p-4 rounded-2xl border border-black/10 transition ${item.checked ? 'bg-black/5 opacity-60' : 'bg-white'}`}>
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input 
                        type="checkbox" 
                        checked={item.checked}
                        onChange={() => toggleShoppingItem(item.id)}
                        className="w-5 h-5 accent-black rounded cursor-pointer"
                      />
                      <span className={`font-medium ${item.checked ? 'line-through' : ''}`}>{item.name}</span>
                    </label>
                    <button onClick={() => deleteShoppingItem(item.id)} className="text-black/40 hover:text-red-600 px-2 text-sm">✕</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* PANTRY TAB */}
        {activeTab === 'pantry' && (
          <div className="space-y-6">
             <div className="rounded-[28px] p-6 space-y-4 bg-[#6B705C] text-[#fae7b9] border border-black/10">
              
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold uppercase tracking-wider">Add Essential</h2>
                
                <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleScanReceipt} />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isScanning}
                  className="px-4 py-2 bg-black text-[#fae7b9] rounded-xl text-sm font-medium transition active:scale-95 disabled:opacity-50 hover:bg-black/80 shadow-sm"
                >
                  {isScanning ? '🤖 Reading...' : '📸 Scan Receipt'}
                </button>
              </div>

              <form onSubmit={addItem} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <input type="text" placeholder="Item name (e.g. Crisp Lettuce)" value={name} onChange={handleNameChange} className="sm:col-span-5 px-4 py-3 rounded-2xl text-base focus:outline-none bg-white border border-black/20 text-black placeholder:text-black/50 shadow-sm" required />
                  <select value={category} onChange={(e) => { setCategory(e.target.value); setIsManualCategory(true); }} className="sm:col-span-3 px-3 py-3 rounded-2xl text-base focus:outline-none cursor-pointer bg-white border border-black/20 text-black shadow-sm">
                    {CATEGORIES.map((cat) => <option key={cat.name} value={cat.name} className="text-black">{cat.icon} {cat.name}</option>)}
                  </select>
                  <div className="sm:col-span-2 flex gap-1.5">
                    <input type="number" step="any" min="0.01" placeholder="Qty" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-16 px-2 py-3 rounded-2xl text-center text-base focus:outline-none bg-white border border-black/20 text-black shadow-sm" />
                    <select value={unit} onChange={(e) => setUnit(e.target.value)} className="flex-1 px-2 py-3 rounded-2xl text-base focus:outline-none cursor-pointer capitalize bg-white border border-black/20 text-black shadow-sm">
                      {COMMON_UNITS.map((u) => <option key={u} value={u} className="text-black">{u}</option>)}
                    </select>
                  </div>
                  <button type="submit" disabled={loading} className="sm:col-span-2 font-medium py-3.5 rounded-2xl transition text-base shadow-md active:scale-95 disabled:opacity-50 bg-black text-[#fae7b9] hover:bg-black/80">Add</button>
                </div>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.keys(groupedItems).length > 0 ? (
                Object.entries(groupedItems).map(([groupCategory, groupList]) => {
                  const categoryIcon = CATEGORIES.find((c) => c.name.toLowerCase() === groupCategory.toLowerCase())?.icon || '📦';
                  return (
                    <div key={groupCategory} className="rounded-[28px] p-5 space-y-3 bg-[#6B705C]/30 border border-black/10">
                      <div className="flex items-center gap-2 pb-2 border-b border-black/10">
                        <span className="text-xl">{categoryIcon}</span>
                        <span className="text-sm font-semibold tracking-wider uppercase text-black">{groupCategory}</span>
                      </div>
                      <div className="space-y-2">
                        {groupList.map((item) => {
                          const isEditing = editingId === item.id;
                          const productIcon = getItemIcon(item.name, item.category);
                          const isTracked = item.track_low_stock ?? true;
                          return (
                            <div key={item.id} className="rounded-[20px] p-3 transition bg-white border border-black/10 shadow-sm">
                              {!isEditing ? (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 bg-[#6B705C]/10 border border-black/10">{productIcon}</div>
                                    <div>
                                      <h3 className="font-semibold text-base capitalize text-black">{item.name}</h3>
                                      <p className="text-sm text-black/70 font-normal">{item.quantity} {item.unit}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <button onClick={() => toggleLowStockTracking(item)} className={`p-1.5 text-sm rounded-lg transition ${isTracked ? 'text-amber-700' : 'text-black/30'}`}>{isTracked ? '🔔' : '🔕'}</button>
                                    <button onClick={() => adjustQuantity(item, -1)} className="w-7 h-7 rounded-lg text-sm flex items-center justify-center bg-[#6B705C]/10 text-red-700 border border-black/10 hover:bg-black/5">-</button>
                                    <button onClick={() => adjustQuantity(item, 1)} className="w-7 h-7 rounded-lg text-sm flex items-center justify-center bg-[#6B705C]/10 text-emerald-800 border border-black/10 hover:bg-black/5">+</button>
                                    <button onClick={() => startEditing(item)} className="p-1.5 text-sm text-black/60 hover:text-black">✏️</button>
                                    <button onClick={() => deleteItem(item.id)} className="p-1.5 text-sm text-black/40 hover:text-red-600">✕</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold capitalize text-black">Edit: {item.name}</span>
                                    <button onClick={() => setEditingId(null)} className="text-sm text-black/70 hover:text-black">Cancel</button>
                                  </div>
                                  <div className="flex gap-2">
                                    <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-28 px-2 py-2 rounded-xl text-sm focus:outline-none bg-white border border-black/20 text-black">
                                      {CATEGORIES.map((cat) => <option key={cat.name} value={cat.name} className="text-black">{cat.icon} {cat.name}</option>)}
                                    </select>
                                    <input type="number" step="any" min="0.01" value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)} className="w-16 px-2 py-2 rounded-xl text-center text-sm focus:outline-none bg-white border border-black/20 text-black" />
                                    <select value={editUnit} onChange={(e) => setEditUnit(e.target.value)} className="flex-1 px-2 py-2 rounded-xl text-sm focus:outline-none capitalize bg-white border border-black/20 text-black">
                                      {COMMON_UNITS.map((u) => <option key={u} value={u} className="text-black">{u}</option>)}
                                    </select>
                                    <button onClick={() => saveEdit(item.id)} className="px-3 py-2 rounded-xl text-sm font-medium bg-black text-[#fae7b9]">Save</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-base py-6 col-span-full text-black/60">No pantry items stored.</p>
              )}
            </div>
          </div>
        )}

        {/* RECIPES TAB */}
        {activeTab === 'recipes' && (
          <div className="space-y-6">
             <div className="rounded-[28px] p-6 space-y-3 bg-[#6B705C] text-[#fae7b9] border border-black/10">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white">🌐 Import Recipe via Web URL</h2>
              <form onSubmit={handleImportRecipe} className="flex flex-col sm:flex-row gap-3">
                <input type="url" placeholder="Paste recipe URL (e.g. foodnetwork.com/...)" value={importUrl} onChange={(e) => setImportUrl(e.target.value)} className="flex-1 px-4 py-3 rounded-2xl text-base focus:outline-none bg-white border border-black/20 text-black placeholder:text-black/50 shadow-sm" required />
                <button type="submit" disabled={isImporting} className="px-8 font-medium py-3.5 rounded-2xl transition text-base shadow-md active:scale-95 disabled:opacity-50 bg-black text-[#fae7b9] hover:bg-black/80">Import</button>
              </form>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recipes.map((recipe) => (
                <div key={recipe.id} onClick={() => openRecipe(recipe)} className="rounded-[24px] overflow-hidden cursor-pointer transition border border-black/10 hover:border-black/40 flex flex-col justify-between bg-white shadow-sm">
                  {recipe.image && <img src={recipe.image} alt={recipe.title} className="w-full h-40 object-cover" />}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-xl text-black">{recipe.title}</h3>
                        <p className="text-sm mt-1 text-black/70">⏱️ {recipe.cook_time} • {recipe.portions || 4} portions</p>
                      </div>
                      <button onClick={(e) => deleteRecipe(recipe.id, e)} className="text-sm p-1 text-black/50 hover:text-red-600">✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PLANNER TAB (The 7-Day Calendar View) */}
        {activeTab === 'planner' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your Week Ahead</h2>
            </div>
            
            <div className="space-y-6">
              {next7Days.map((dateStr) => {
                const dateObj = new Date(dateStr);
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                
                return (
                  <div key={dateStr} className={`rounded-[28px] p-6 border ${isToday ? 'bg-[#6B705C]/20 border-[#6B705C]/40' : 'bg-[#6B705C]/10 border-black/10'}`}>
                    <h3 className="text-xl font-bold mb-4 text-black flex items-center gap-2">
                      {isToday && <span className="text-xs bg-[#6B705C] text-white px-2 py-1 rounded-full uppercase tracking-wider">Today</span>}
                      {dayName}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {['Breakfast', 'Lunch', 'Dinner'].map((mealType) => {
                        const slotKey = `${dateStr}-${mealType}`;
                        const mealsInSlot = mealPlans.filter(m => m.date === dateStr && m.meal_type === mealType);
                        
                        return (
                          <div key={mealType} className="bg-white rounded-2xl p-4 border border-black/10 flex flex-col shadow-sm">
                            <h4 className="font-semibold text-sm uppercase tracking-wider text-black/70 mb-3">{mealType}</h4>
                            
                            <div className="flex-1 space-y-2 mb-3">
                              {mealsInSlot.length === 0 ? (
                                <p className="text-sm text-black/40 italic">Nothing planned</p>
                              ) : (
                                mealsInSlot.map(meal => (
                                  <div key={meal.id} className="flex justify-between items-start p-2.5 rounded-xl bg-black/5 border border-black/5 group">
                                    <div>
                                      <p className="font-semibold text-sm text-black leading-snug">
                                        {meal.recipe_id ? meal.recipes?.title : meal.manual_name}
                                      </p>
                                      <p className="text-xs text-black/60 mt-0.5">{meal.portions} portion{meal.portions > 1 ? 's' : ''}</p>
                                    </div>
                                    <button onClick={() => deleteMealPlan(meal.id)} className="text-black/30 hover:text-red-600 text-xs opacity-0 group-hover:opacity-100 transition">✕</button>
                                  </div>
                                ))
                              )}
                            </div>
                            
                            {/* Quick Add Manual Meal */}
                            <div className="flex gap-2 mt-auto">
                              <input 
                                type="text"
                                placeholder="Quick add..."
                                value={manualInputs[slotKey] || ''}
                                onChange={(e) => setManualInputs(prev => ({ ...prev, [slotKey]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveManualMeal(dateStr, mealType);
                                }}
                                className="flex-1 px-3 py-2 rounded-xl text-sm bg-black/5 border border-transparent focus:outline-none focus:border-[#6B705C] transition"
                              />
                              <button 
                                onClick={() => saveManualMeal(dateStr, mealType)}
                                className="px-3 py-2 bg-[#6B705C] text-white rounded-xl text-sm font-medium hover:bg-[#6B705C]/80 shadow-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LOW STOCK MODAL */}
        {showLowStockModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-lg rounded-[32px] p-6 space-y-6 bg-[#fae7b9] border border-black/20 text-black shadow-2xl">
              <div className="flex justify-between items-center border-b pb-4 border-black/10">
                <h2 className="text-xl font-bold flex items-center gap-2 text-red-800">
                  <span>⚠️</span> Low Stock Alerts
                </h2>
                <button onClick={() => setShowLowStockModal(false)} className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-sm hover:bg-black/20 text-black">✕</button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {lowStockItems.length > 0 ? (
                  lowStockItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-4 rounded-2xl bg-white border border-black/10 shadow-sm">
                      <div>
                        <h4 className="font-semibold text-base capitalize text-black">{item.name}</h4>
                        <p className="text-sm text-red-800 font-medium">{item.quantity} {item.unit} remaining</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => adjustQuantity(item, 1)} className="px-3 py-1.5 rounded-xl text-sm font-medium bg-black text-[#fae7b9]">+ Restock 1</button>
                      </div>
                    </div>
                  ))
                ) : <p className="text-center text-sm text-black/60 py-4">No tracked items are currently low on stock!</p>}
              </div>
            </div>
          </div>
        )}

        {/* RECIPE DETAIL MODAL */}
        {selectedRecipe && !showDistributionModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 z-50">
            <div className="w-full max-w-5xl rounded-[32px] overflow-hidden max-h-[90vh] flex flex-col bg-[#fae7b9] border border-black/20 text-black shadow-2xl">
              <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
                <div className="flex justify-between items-start border-b pb-4 border-black/10">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-black leading-snug">{selectedRecipe.title}</h2>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-sm font-semibold uppercase tracking-wider text-black/70">Scale Ingredients:</span>
                      <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-black/10 shadow-sm">
                        <button onClick={() => setTargetPortions(Math.max(1, targetPortions - 1))} className="w-8 h-8 rounded-lg bg-black text-[#fae7b9] hover:bg-black/80 font-bold">-</button>
                        <span className="w-8 text-center font-bold text-lg">{targetPortions}</span>
                        <button onClick={() => setTargetPortions(targetPortions + 1)} className="w-8 h-8 rounded-lg bg-black text-[#fae7b9] hover:bg-black/80 font-bold">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <button 
                      onClick={startDistribution} 
                      className="px-4 py-2.5 bg-black text-[#fae7b9] rounded-xl text-sm font-medium hover:bg-black/80 transition shadow-sm"
                    >
                      + Add to Meal Plan
                    </button>
                    <button onClick={() => addMissingRecipeIngredients(selectedRecipe, multiplier)} className="px-4 py-2.5 bg-black text-[#fae7b9] rounded-xl text-sm font-medium hover:bg-black/80 transition shadow-sm">+ Missing to Shopping</button>
                    <button onClick={() => setSelectedRecipe(null)} className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center font-medium text-lg hover:bg-black/20 transition">✕</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  <div className="md:col-span-5 space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-black/80">
                      Ingredients {multiplier !== 1 && <span className="text-emerald-700 normal-case font-medium ml-2">(Scaled {multiplier}x)</span>}
                    </h3>
                    <div className="space-y-2">
                      {selectedRecipe.ingredients.map((ing, i) => {
                        const scaledIng = scaleIngredient(ing, multiplier);
                        const statusObj = getIngredientStatus(scaledIng, items);
                        return (
                          <div key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm p-3 rounded-xl bg-white border border-black/10 text-black font-medium shadow-sm">
                            <span>{scaledIng}</span>
                            <div className="shrink-0">
                              {statusObj.status === 'in_stock' && (
                                <span className="text-[10px] px-2.5 py-1 bg-[#6B705C] text-[#fae7b9] rounded-full font-bold uppercase tracking-wider shadow-sm">
                                  In Pantry ({statusObj.availableText})
                                </span>
                              )}
                              {statusObj.status === 'insufficient' && (
                                <span className="text-[10px] px-2.5 py-1 border border-[#6B705C]/50 text-[#6B705C] rounded-full font-bold uppercase tracking-wider">
                                  Low Stock
                                </span>
                              )}
                              {statusObj.status === 'missing' && (
                                <span className="text-[10px] px-2.5 py-1 bg-black text-[#fae7b9] rounded-full font-bold uppercase tracking-wider shadow-sm">
                                  Missing
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="md:col-span-7 space-y-4 flex flex-col">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-black/80">Method & Instructions</h3>
                    {selectedRecipe.instructions?.map((step, idx) => {
                      if (step.includes('For full cooking instructions, visit')) return null;
                      return (
                        <div key={idx} className="p-4 rounded-2xl space-y-1.5 bg-white border border-black/10 shadow-sm">
                          <span className="font-medium text-sm uppercase text-black/70">Step {idx + 1}</span>
                          <p className="leading-relaxed text-black">{step}</p>
                        </div>
                      );
                    })}

                    {/* NEW CLICKABLE ORIGINAL RECIPE LINK */}
                    {selectedRecipe.source_url && (
                      <a 
                        href={selectedRecipe.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-4 px-6 py-4 bg-white border border-black/20 rounded-2xl text-black font-semibold text-center hover:bg-black/5 transition shadow-sm block"
                      >
                        🔗 View Full Original Recipe
                      </a>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* MEAL PLAN DISTRIBUTION MODAL */}
        {showDistributionModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="w-full max-w-3xl rounded-[32px] p-6 md:p-8 bg-[#fae7b9] border border-black/20 text-black shadow-2xl flex flex-col max-h-[90vh]">
              
              <div className="flex justify-between items-center border-b pb-4 border-black/10 mb-6 shrink-0">
                <h2 className="text-2xl font-bold">Plan Your Meals</h2>
                <button onClick={() => setShowDistributionModal(false)} className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 text-black">✕</button>
              </div>

              <div className="overflow-y-auto pr-2 space-y-6 flex-1">
                <div className="p-5 rounded-2xl bg-white border border-black/10 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                  <div>
                    <h3 className="font-bold text-lg text-black">How many portions to plan?</h3>
                    <p className="text-black/60 text-sm">For {selectedRecipe?.title}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-[#fae7b9] p-1.5 rounded-xl border border-black/10 shadow-sm">
                    <button 
                      onClick={() => {
                        const newTarget = Math.max(1, planTargetPortions - 1);
                        setPlanTargetPortions(newTarget);
                        if (totalAllocated > newTarget) setAllocationsGrid({}); 
                      }} 
                      className="w-10 h-10 rounded-lg bg-black text-[#fae7b9] hover:bg-black/80 font-bold text-lg"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-xl">{planTargetPortions}</span>
                    <button 
                      onClick={() => setPlanTargetPortions(planTargetPortions + 1)} 
                      className="w-10 h-10 rounded-lg bg-black text-[#fae7b9] hover:bg-black/80 font-bold text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4 px-1">
                    <span className="font-semibold text-black/70 uppercase tracking-wider text-sm">Tap to Assign Portions</span>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${remainingPortions === 0 ? 'bg-[#6B705C] text-[#fae7b9]' : 'bg-amber-200 text-amber-900'}`}>
                      {remainingPortions} remaining
                    </span>
                  </div>

                  <div className="space-y-3">
                    {next7Days.map(dateStr => {
                       const dateObj = new Date(dateStr);
                       const isToday = dateStr === new Date().toISOString().split('T')[0];
                       const dayName = isToday ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                       
                       return (
                         <div key={dateStr} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 bg-white rounded-2xl border border-black/10 shadow-sm">
                           <span className="w-16 font-bold text-sm text-center sm:text-left">{dayName}</span>
                           <div className="flex-1 grid grid-cols-3 gap-2">
                             {['Breakfast', 'Lunch', 'Dinner'].map(meal => {
                               const key = `${dateStr}|${meal}`;
                               const qty = allocationsGrid[key] || 0;
                               return (
                                 <div key={meal} className="flex flex-col items-center">
                                   <span className="text-[10px] uppercase font-semibold text-black/50 mb-1">{meal}</span>
                                   {qty > 0 ? (
                                     <div className="flex items-center justify-between w-full bg-[#6B705C] text-white rounded-xl p-1 px-2 text-sm shadow-sm transition">
                                       <button onClick={() => handleAllocate(dateStr, meal, -1)} className="font-bold px-2 py-1 hover:text-white/70 transition">-</button>
                                       <span className="font-bold">{qty}</span>
                                       <button onClick={() => handleAllocate(dateStr, meal, 1)} className="font-bold px-2 py-1 hover:text-white/70 transition">+</button>
                                     </div>
                                   ) : (
                                     <button 
                                       onClick={() => handleAllocate(dateStr, meal, 1)}
                                       disabled={remainingPortions <= 0}
                                       className="w-full py-1.5 rounded-xl border-2 border-dashed border-black/20 text-black/40 hover:bg-black/5 hover:border-black/40 text-sm disabled:opacity-30 transition"
                                     >
                                       +
                                     </button>
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
                <button 
                  onClick={saveMealPlan} 
                  disabled={remainingPortions !== 0 || loading} 
                  className="w-full py-4 rounded-2xl font-bold text-lg bg-black text-[#fae7b9] hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                >
                  {loading ? 'Saving...' : remainingPortions === 0 ? 'Confirm Meal Plan' : `Allocate exactly ${planTargetPortions} portions to save`}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* RECEIPT REVIEW MODAL */}
        {scannedItems && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
            <div className="w-full max-w-4xl rounded-[32px] p-6 md:p-8 bg-[#fae7b9] border border-black/20 text-black shadow-2xl flex flex-col max-h-[90vh]">
              
              <div className="flex justify-between items-center border-b pb-4 border-black/10 mb-6 shrink-0">
                <h2 className="text-2xl font-bold">Review Scanned Items</h2>
                <button onClick={() => setScannedItems(null)} className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 text-black">✕</button>
              </div>

              <div className="overflow-y-auto pr-2 space-y-4 flex-1">
                <p className="text-black/70 text-sm mb-2 font-medium">Adjust names, quantities, and units before saving to your pantry.</p>
                
                {scannedItems.map((item, idx) => (
                  <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-3 items-center p-4 bg-white rounded-2xl border border-black/10 shadow-sm">
                    <input 
                      type="text" 
                      value={item.name} 
                      onChange={(e) => updateScannedItem(idx, 'name', e.target.value)}
                      className="flex-1 min-w-[150px] px-3 py-2 rounded-xl text-sm border border-black/20 focus:outline-none focus:border-[#6B705C]"
                      placeholder="Item name"
                    />
                    
                    <select 
                      value={item.category} 
                      onChange={(e) => updateScannedItem(idx, 'category', e.target.value)}
                      className="w-36 px-3 py-2 rounded-xl text-sm border border-black/20 bg-white focus:outline-none focus:border-[#6B705C]"
                    >
                      {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
                    </select>

                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <input 
                        type="number" 
                        step="any" 
                        value={item.quantity} 
                        onChange={(e) => updateScannedItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-2 rounded-xl text-center text-sm border border-black/20 focus:outline-none focus:border-[#6B705C]"
                      />
                      <input 
                        type="text" 
                        list="common-units"
                        value={item.unit} 
                        onChange={(e) => updateScannedItem(idx, 'unit', e.target.value)}
                        placeholder="Unit (e.g. litre)"
                        className="w-28 px-3 py-2 rounded-xl text-sm border border-black/20 bg-white focus:outline-none focus:border-[#6B705C]"
                      />
                    </div>
                    
                    <button onClick={() => removeScannedItem(idx)} className="p-2 text-black/40 hover:text-red-600 font-bold" title="Remove item">✕</button>
                  </div>
                ))}
                
                <button 
                  onClick={() => setScannedItems([...scannedItems, { name: '', category: 'Other', quantity: 1, unit: 'pcs' }])} 
                  className="w-full py-4 rounded-2xl border-2 border-dashed border-black/20 text-black/60 font-medium hover:bg-white hover:text-black hover:border-black/40 transition text-sm"
                >
                  + Add missed item
                </button>
              </div>

              <div className="pt-6 mt-4 border-t border-black/10 shrink-0 flex gap-3">
                 <button 
                   onClick={() => setScannedItems(null)} 
                   className="flex-1 py-4 rounded-2xl font-bold text-lg border border-black/20 bg-transparent text-black hover:bg-black/5 transition"
                 >
                  Cancel
                </button>
                <button 
                  onClick={confirmScannedItems} 
                  disabled={loading} 
                  className="flex-1 py-4 rounded-2xl font-bold text-lg bg-black text-[#fae7b9] hover:bg-black/80 disabled:opacity-50 transition shadow-sm"
                >
                  {loading ? 'Saving...' : 'Confirm & Save to Pantry'}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  );
}