'use client';

import React, { useState, useEffect, useRef } from 'react';
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
}

interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
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

export default function PantryManager() {
  const supabase = createClient();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pantry' | 'recipes' | 'shopping'>('dashboard');
  const [items, setItems] = useState<PantryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(false);

  // AI Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [name, setName] = useState('');
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
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // --- LOAD DATA FROM SUPABASE ---
  useEffect(() => {
    const loadData = async () => {
      const { data: pData } = await supabase.from('pantry_items').select('*').order('created_at', { ascending: false });
      if (pData) setItems(pData);

      const { data: rData } = await supabase.from('recipes').select('*').order('created_at', { ascending: false });
      if (rData) setRecipes(rData);

      const { data: sData } = await supabase.from('shopping_list').select('*').order('created_at', { ascending: false });
      if (sData) setShoppingList(sData);
    };
    loadData();
  }, []);

  // --- HANDLERS ---
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
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
    
    setName('');
    setQuantity('1');
    setIsManualCategory(false);
    setLoading(false);
  };

  // AI RECEIPT SCANNER
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
         const { data: insertedData } = await supabase.from('pantry_items').insert(data.items).select();
         if (insertedData) {
           setItems(prev => [...insertedData, ...prev]);
           alert(`Successfully added ${insertedData.length} items from your receipt!`);
         }
      } else {
        alert(data.message || 'Could not find any items on this receipt.');
      }
    } catch {
      alert('Failed to read receipt. Please try another photo.');
    }
    setIsScanning(false);
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

  // RECIPE CRUD
  const handleImportRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl) return;
    setIsImporting(true);
    
    setTimeout(async () => {
      const scraped = {
        title: 'Imported Pasta Primavera',
        category: 'Main Dish',
        cook_time: '25 mins',
        ingredients: ['1 lbs Pasta', '2 pcs Tomato', '1 pcs Crisp Lettuce'],
        instructions: ['Boil pasta until al dente.', 'Sauté chopped vegetables in olive oil.'],
        source_url: importUrl
      };
      
      const { data } = await supabase.from('recipes').insert([scraped]).select().single();
      if (data) setRecipes(prev => [data, ...prev]);
      
      setImportUrl('');
      setIsImporting(false);
    }, 1200);
  };

  const deleteRecipe = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecipes(prev => prev.filter(r => r.id !== id));
    await supabase.from('recipes').delete().eq('id', id);
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

  const addMissingRecipeIngredients = async (recipe: Recipe) => {
    const missing = recipe.ingredients.filter(ing => getIngredientStatus(ing, items).status !== 'in_stock');
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

  // --- RENDER ---
  return (
    <main className="min-h-screen bg-[#F7F5DC] text-black p-4 md:p-8 font-montserrat">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* HEADER / NAVIGATION */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-black/10">
          <div>
            <h1 className="text-5xl md:text-6xl font-mogena tracking-tight text-black">Pantreasy</h1>
            <p className="text-base text-black/70 mt-2 font-normal">Keep track of your ingredients & dinner plans</p>
          </div>
          
          <nav className="flex flex-wrap items-center gap-1 bg-[#6B705C]/40 p-1.5 rounded-2xl border border-black/10">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'pantry', label: 'Pantry' },
              { id: 'recipes', label: 'Recipes' },
              { id: 'shopping', label: 'Shopping List' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-sm transition ${activeTab === tab.id ? 'bg-black text-[#F7F5DC] font-medium' : 'text-black/80 hover:text-black font-normal'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div onClick={() => setActiveTab('pantry')} className="rounded-[28px] p-6 cursor-pointer transition hover:border-black/40 space-y-2 bg-[#6B705C] text-[#F7F5DC] border border-black/20">
                <div className="flex justify-between items-center"><span className="text-3xl">🥗</span><span className="text-sm font-medium text-[#F7F5DC]/80">View Pantry →</span></div>
                <h3 className="text-5xl font-bold text-[#F7F5DC]">{items.length}</h3>
                <p className="text-base font-normal text-[#F7F5DC]/80">Pantry Items In Stock</p>
              </div>
              <div onClick={() => setActiveTab('recipes')} className="rounded-[28px] p-6 cursor-pointer transition hover:border-black/40 space-y-2 bg-[#6B705C] text-[#F7F5DC] border border-black/20">
                <div className="flex justify-between items-center"><span className="text-3xl">📖</span><span className="text-sm font-medium text-[#F7F5DC]/80">View Recipes →</span></div>
                <h3 className="text-5xl font-bold text-[#F7F5DC]">{recipes.length}</h3>
                <p className="text-base font-normal text-[#F7F5DC]/80">Saved Recipes</p>
              </div>
              <div onClick={() => setShowLowStockModal(true)} className="rounded-[28px] p-6 cursor-pointer transition hover:border-red-500/50 space-y-3 bg-[#6B705C] text-[#F7F5DC] border border-black/20">
                <div className="flex justify-between items-center"><span className="text-sm font-semibold uppercase tracking-wider text-red-200">⚠️ Low Stock Alert</span><span className="text-sm font-medium text-red-200">Expand →</span></div>
                {lowStockItems.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {lowStockItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 rounded-xl text-sm bg-[#F7F5DC] border border-black/10">
                        <span className="font-semibold text-black">{item.name}</span><span className="text-red-800 font-medium">{item.quantity} {item.unit} left</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm italic text-[#F7F5DC]/70">Pantry stock looks good!</p>}
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
                className="px-4 py-2 bg-[#6B705C] text-[#F7F5DC] rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-[#6B705C]/80 transition"
              >
                + Add Low Stock Items
              </button>
            </div>

            <form onSubmit={handleAddShoppingItem} className="flex gap-2">
              <button 
                type="button"
                onClick={startListening}
                className={`p-4 rounded-2xl transition border border-black/20 ${isListening ? 'bg-red-500 text-white animate-pulse border-red-500' : 'bg-[#F7F5DC] text-black hover:bg-black/5'}`}
                title="Use microphone"
              >
                🎙️
              </button>
              <input 
                type="text" 
                value={shoppingInput}
                onChange={(e) => setShoppingInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Add a product..."}
                className="flex-1 px-4 py-3 rounded-2xl text-base focus:outline-none bg-[#F7F5DC] border border-black/20 text-black placeholder:text-black/50"
              />
              <button type="submit" className="px-6 py-3 font-medium rounded-2xl bg-black text-[#F7F5DC] hover:bg-black/80">
                Add
              </button>
            </form>

            <div className="space-y-2">
              {shoppingList.length === 0 ? (
                <p className="text-center text-black/60 py-8">Your list is empty.</p>
              ) : (
                shoppingList.map(item => (
                  <div key={item.id} className={`flex items-center justify-between p-4 rounded-2xl border border-black/10 transition ${item.checked ? 'bg-black/5 opacity-60' : 'bg-[#6B705C]/20'}`}>
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
             <div className="rounded-[28px] p-6 space-y-4 bg-[#6B705C] text-[#F7F5DC] border border-black/10">
              
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold uppercase tracking-wider">Add Essential</h2>
                
                <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleScanReceipt} />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isScanning}
                  className="px-4 py-2 bg-black text-[#F7F5DC] rounded-xl text-sm font-medium transition active:scale-95 disabled:opacity-50 hover:bg-black/80"
                >
                  {isScanning ? '🤖 Reading...' : '📸 Scan Receipt'}
                </button>
              </div>

              <form onSubmit={addItem} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <input type="text" placeholder="Item name (e.g. Crisp Lettuce)" value={name} onChange={handleNameChange} className="sm:col-span-5 px-4 py-3 rounded-2xl text-base focus:outline-none bg-[#F7F5DC] border border-black/20 text-black placeholder:text-black/50" required />
                  <select value={category} onChange={(e) => { setCategory(e.target.value); setIsManualCategory(true); }} className="sm:col-span-3 px-3 py-3 rounded-2xl text-base focus:outline-none cursor-pointer bg-[#F7F5DC] border border-black/20 text-black">
                    {CATEGORIES.map((cat) => <option key={cat.name} value={cat.name} className="bg-[#F7F5DC] text-black">{cat.icon} {cat.name}</option>)}
                  </select>
                  <div className="sm:col-span-2 flex gap-1.5">
                    <input type="number" step="any" min="0.01" placeholder="Qty" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-16 px-2 py-3 rounded-2xl text-center text-base focus:outline-none bg-[#F7F5DC] border border-black/20 text-black" />
                    <select value={unit} onChange={(e) => setUnit(e.target.value)} className="flex-1 px-2 py-3 rounded-2xl text-base focus:outline-none cursor-pointer capitalize bg-[#F7F5DC] border border-black/20 text-black">
                      {COMMON_UNITS.map((u) => <option key={u} value={u} className="bg-[#F7F5DC] text-black">{u}</option>)}
                    </select>
                  </div>
                  <button type="submit" disabled={loading} className="sm:col-span-2 font-medium py-3.5 rounded-2xl transition text-base shadow-md active:scale-95 disabled:opacity-50 bg-black text-[#F7F5DC] hover:bg-black/80">Add</button>
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
                            <div key={item.id} className="rounded-[20px] p-3 transition bg-[#F7F5DC] border border-black/10">
                              {!isEditing ? (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 bg-[#6B705C]/40 border border-black/10">{productIcon}</div>
                                    <div>
                                      <h3 className="font-semibold text-base capitalize text-black">{item.name}</h3>
                                      <p className="text-sm text-black/70 font-normal">{item.quantity} {item.unit}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <button onClick={() => toggleLowStockTracking(item)} className={`p-1.5 text-sm rounded-lg transition ${isTracked ? 'text-amber-700' : 'text-black/30'}`}>{isTracked ? '🔔' : '🔕'}</button>
                                    <button onClick={() => adjustQuantity(item, -1)} className="w-7 h-7 rounded-lg text-sm flex items-center justify-center bg-[#6B705C]/20 text-red-700 border border-black/10 hover:bg-black/5">-</button>
                                    <button onClick={() => adjustQuantity(item, 1)} className="w-7 h-7 rounded-lg text-sm flex items-center justify-center bg-[#6B705C]/20 text-emerald-800 border border-black/10 hover:bg-black/5">+</button>
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
                                      {CATEGORIES.map((cat) => <option key={cat.name} value={cat.name} className="bg-white text-black">{cat.icon} {cat.name}</option>)}
                                    </select>
                                    <input type="number" step="any" min="0.01" value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)} className="w-16 px-2 py-2 rounded-xl text-center text-sm focus:outline-none bg-white border border-black/20 text-black" />
                                    <select value={editUnit} onChange={(e) => setEditUnit(e.target.value)} className="flex-1 px-2 py-2 rounded-xl text-sm focus:outline-none capitalize bg-white border border-black/20 text-black">
                                      {COMMON_UNITS.map((u) => <option key={u} value={u} className="bg-white text-black">{u}</option>)}
                                    </select>
                                    <button onClick={() => saveEdit(item.id)} className="px-3 py-2 rounded-xl text-sm font-medium bg-black text-[#F7F5DC]">Save</button>
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
             <div className="rounded-[28px] p-6 space-y-3 bg-[#6B705C] text-[#F7F5DC] border border-black/10">
              <h2 className="text-sm font-semibold uppercase tracking-wider">🌐 Import Recipe via Web URL</h2>
              <form onSubmit={handleImportRecipe} className="flex flex-col sm:flex-row gap-3">
                <input type="url" placeholder="Paste recipe URL (e.g. foodnetwork.com/...)" value={importUrl} onChange={(e) => setImportUrl(e.target.value)} className="flex-1 px-4 py-3 rounded-2xl text-base focus:outline-none bg-[#F7F5DC] border border-black/20 text-black placeholder:text-black/50" required />
                <button type="submit" disabled={isImporting} className="px-8 font-medium py-3.5 rounded-2xl transition text-base shadow-md active:scale-95 disabled:opacity-50 bg-black text-[#F7F5DC] hover:bg-black/80">Import</button>
              </form>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recipes.map((recipe) => (
                <div key={recipe.id} onClick={() => setSelectedRecipe(recipe)} className="rounded-[24px] overflow-hidden cursor-pointer transition border border-black/10 hover:border-black/40 flex flex-col justify-between bg-[#6B705C]/20">
                  {recipe.image && <img src={recipe.image} alt={recipe.title} className="w-full h-40 object-cover" />}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-xl text-black">{recipe.title}</h3>
                        <p className="text-sm mt-1 text-black/70">⏱️ {recipe.cook_time} • {recipe.category}</p>
                      </div>
                      <button onClick={(e) => deleteRecipe(recipe.id, e)} className="text-sm p-1 text-black/50 hover:text-red-600">✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOW STOCK MODAL */}
        {showLowStockModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-lg rounded-[32px] p-6 space-y-6 bg-[#F7F5DC] border border-black/20 text-black shadow-2xl">
              <div className="flex justify-between items-center border-b pb-4 border-black/10">
                <h2 className="text-xl font-bold flex items-center gap-2 text-red-800">
                  <span>⚠️</span> Low Stock Alerts
                </h2>
                <button onClick={() => setShowLowStockModal(false)} className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-sm hover:bg-black/20 text-black">✕</button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {lowStockItems.length > 0 ? (
                  lowStockItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-4 rounded-2xl bg-[#6B705C]/20 border border-black/10">
                      <div>
                        <h4 className="font-semibold text-base capitalize text-black">{item.name}</h4>
                        <p className="text-sm text-red-800 font-medium">{item.quantity} {item.unit} remaining</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => adjustQuantity(item, 1)} className="px-3 py-1.5 rounded-xl text-sm font-medium bg-black text-[#F7F5DC]">+ Restock 1</button>
                      </div>
                    </div>
                  ))
                ) : <p className="text-center text-sm text-black/60 py-4">No tracked items are currently low on stock!</p>}
              </div>
            </div>
          </div>
        )}

        {/* RECIPE DETAIL MODAL */}
        {selectedRecipe && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 z-50">
            <div className="w-full max-w-5xl rounded-[32px] overflow-hidden max-h-[90vh] flex flex-col bg-[#F7F5DC] border border-black/20 text-black shadow-2xl">
              <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
                <div className="flex justify-between items-start border-b pb-4 border-black/10">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-black leading-snug">{selectedRecipe.title}</h2>
                  </div>
                  <div className="flex gap-3 items-center">
                    <button onClick={() => addMissingRecipeIngredients(selectedRecipe)} className="px-4 py-2 bg-black text-[#F7F5DC] rounded-xl text-sm font-medium hover:bg-black/80 transition">+ Missing Items to Shopping List</button>
                    <button onClick={() => setSelectedRecipe(null)} className="w-9 h-9 rounded-full bg-black/10 flex items-center justify-center font-medium text-base hover:bg-black/20 transition">✕</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  <div className="md:col-span-5 space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-black/80">Ingredients</h3>
                    <div className="space-y-2">
                      {selectedRecipe.ingredients.map((ing, i) => (
                        <div key={i} className="flex justify-between items-center text-sm p-3 rounded-xl bg-[#6B705C]/20 border border-black/10 text-black">
                          {ing}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-7 space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-black/80">Method & Instructions</h3>
                    {selectedRecipe.instructions?.map((step, idx) => (
                      <div key={idx} className="p-4 rounded-2xl space-y-1.5 bg-[#6B705C]/20 border border-black/10">
                        <span className="font-medium text-sm uppercase text-black/70">Step {idx + 1}</span>
                        <p className="leading-relaxed text-black">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}