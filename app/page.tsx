'use client';

import React, { useState, useEffect } from 'react';

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

// Helper to estimate icons based on item name
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
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pantry' | 'recipes'>('dashboard');
  const [items, setItems] = useState<PantryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State for Adding Item
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Produce');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [trackLowStock, setTrackLowStock] = useState(true);
  const [isManualCategory, setIsManualCategory] = useState(false);

  // Form State for Web Scraping Recipe
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editTrackLowStock, setEditTrackLowStock] = useState(true);

  // Modal / Selection State
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // --- MOCK INITIAL LOAD ---
  useEffect(() => {
    // Load local storage or default data
    const mockPantry: PantryItem[] = [
      { id: '1', name: 'Crisp Lettuce', category: 'Produce', quantity: 1, unit: 'pcs', track_low_stock: true },
      { id: '2', name: 'Whole Milk', category: 'Dairy & Eggs', quantity: 0.5, unit: 'l', track_low_stock: true },
      { id: '3', name: 'Chicken Breast', category: 'Meat & Seafood', quantity: 2, unit: 'lbs', track_low_stock: false },
    ];
    const mockRecipes: Recipe[] = [
      {
        id: '101',
        title: 'Caesar Salad',
        category: 'Salad',
        cook_time: '15 mins',
        ingredients: ['1 pcs Crisp Lettuce', '2 tbsp Caesar Dressing', '1/2 cup Croutons'],
        instructions: ['Wash and chop the crisp lettuce.', 'Toss with Caesar dressing in a large bowl.', 'Top with croutons and serve cold.'],
        image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=600&q=80'
      }
    ];
    setItems(mockPantry);
    setRecipes(mockRecipes);
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

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    const newItem: PantryItem = {
      id: Date.now().toString(),
      name: name.trim(),
      category,
      quantity: parseFloat(quantity) || 1,
      unit,
      track_low_stock: trackLowStock
    };

    setItems(prev => [newItem, ...prev]);
    setName('');
    setQuantity('1');
    setIsManualCategory(false);
    setLoading(false);
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const adjustQuantity = (item: PantryItem, delta: number) => {
    setItems(prev =>
      prev.map(i => {
        if (i.id === item.id) {
          const updated = Math.max(0, Number((i.quantity + delta).toFixed(2)));
          return { ...i, quantity: updated };
        }
        return i;
      })
    );
  };

  const toggleLowStockTracking = (item: PantryItem) => {
    setItems(prev =>
      prev.map(i => i.id === item.id ? { ...i, track_low_stock: !i.track_low_stock } : i)
    );
  };

  const startEditing = (item: PantryItem) => {
    setEditingId(item.id);
    setEditCategory(item.category);
    setEditQuantity(item.quantity.toString());
    setEditUnit(item.unit);
    setEditTrackLowStock(item.track_low_stock ?? true);
  };

  const saveEdit = (id: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            category: editCategory,
            quantity: parseFloat(editQuantity) || item.quantity,
            unit: editUnit,
            track_low_stock: editTrackLowStock
          };
        }
        return item;
      })
    );
    setEditingId(null);
  };

  const handleImportRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl) return;
    setIsImporting(true);

    // Mock web scraping import
    setTimeout(() => {
      const scraped: Recipe = {
        id: Date.now().toString(),
        title: 'Imported Pasta Primavera',
        category: 'Main Dish',
        cook_time: '25 mins',
        ingredients: ['1 lbs Pasta', '2 pcs Tomato', '1 pcs Crisp Lettuce'],
        instructions: ['Boil pasta until al dente.', 'Sauté chopped vegetables in olive oil.', 'Combine pasta with vegetables and serve.'],
        source_url: importUrl
      };
      setRecipes(prev => [scraped, ...prev]);
      setImportUrl('');
      setIsImporting(false);
    }, 1200);
  };

  const deleteRecipe = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecipes(prev => prev.filter(r => r.id !== id));
  };

  // --- COMPUTED DATA ---
  const lowStockItems = items.filter(i => (i.track_low_stock ?? true) && i.quantity <= 1);

  const groupedItems = items.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PantryItem[]>);

  const getRecipePantryMatch = (recipe: Recipe) => {
    let matchedCount = 0;
    recipe.ingredients.forEach(ing => {
      const lowerIng = ing.toLowerCase();
      if (items.some(p => lowerIng.includes(p.name.toLowerCase()))) {
        matchedCount++;
      }
    });
    return {
      matchedCount,
      totalCount: recipe.ingredients.length,
      isReady: matchedCount === recipe.ingredients.length && recipe.ingredients.length > 0
    };
  };

  const getIngredientStatus = (ingredient: string, pantry: PantryItem[]) => {
    const lowerIng = ingredient.toLowerCase();
    const match = pantry.find(p => lowerIng.includes(p.name.toLowerCase()));
    
    if (!match) {
      return { status: 'missing', requiredText: '1', availableText: '0' };
    }
    if (match.quantity <= 0) {
      return { status: 'insufficient', requiredText: '1', availableText: '0' };
    }
    return { status: 'in_stock', requiredText: '1', availableText: `${match.quantity} ${match.unit}` };
  };

  // --- RENDER ---
  return (
    <main className="min-h-screen bg-[#f3f0e8] text-black p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* HEADER / NAVIGATION */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-black/10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black">Pantry & Recipes</h1>
            <p className="text-xs text-black/60 mt-1">Keep track of your ingredients & dinner plans</p>
          </div>
          
          <nav className="flex items-center gap-1 bg-[#B0B9A8]/40 p-1.5 rounded-2xl border border-black/10">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'dashboard' ? 'bg-black text-[#f3f0e8]' : 'text-black/70 hover:text-black'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('pantry')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'pantry' ? 'bg-black text-[#f3f0e8]' : 'text-black/70 hover:text-black'}`}
            >
              Pantry ({items.length})
            </button>
            <button
              onClick={() => setActiveTab('recipes')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'recipes' ? 'bg-black text-[#f3f0e8]' : 'text-black/70 hover:text-black'}`}
            >
              Recipes ({recipes.length})
            </button>
          </nav>
        </header>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div 
                onClick={() => setActiveTab('pantry')}
                className="rounded-[28px] p-6 cursor-pointer transition hover:border-black/40 space-y-2 bg-[#B0B9A8]/40 border border-black/10"
              >
                <div className="flex justify-between items-center">
                  <span className="text-3xl">🥗</span>
                  <span className="text-xs font-bold text-black/80">View Pantry →</span>
                </div>
                <h3 className="text-4xl font-bold text-black">{items.length}</h3>
                <p className="text-sm text-black/70">Pantry Items In Stock</p>
              </div>

              <div 
                onClick={() => setActiveTab('recipes')}
                className="rounded-[28px] p-6 cursor-pointer transition hover:border-black/40 space-y-2 bg-[#B0B9A8]/40 border border-black/10"
              >
                <div className="flex justify-between items-center">
                  <span className="text-3xl">📖</span>
                  <span className="text-xs font-bold text-black/80">View Recipes →</span>
                </div>
                <h3 className="text-4xl font-bold text-black">{recipes.length}</h3>
                <p className="text-sm text-black/70">Saved Recipes</p>
              </div>

              <div 
                onClick={() => setShowLowStockModal(true)}
                className="rounded-[28px] p-6 cursor-pointer transition hover:border-red-500/50 space-y-3 bg-[#B0B9A8]/40 border border-black/10"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                    ⚠️ Low Stock Alert ({lowStockItems.length})
                  </span>
                  <span className="text-xs font-bold text-red-700">Expand →</span>
                </div>

                {lowStockItems.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {lowStockItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 rounded-xl text-xs bg-[#f3f0e8] border border-black/10">
                        <span className="font-bold text-black">{item.name}</span>
                        <span className="font-semibold text-red-700">{item.quantity} {item.unit} left</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-black/60">Pantry stock looks good!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PANTRY TAB */}
        {activeTab === 'pantry' && (
          <div className="space-y-6">
            <div className="rounded-[28px] p-6 space-y-4 bg-[#B0B9A8] border border-black/10">
              <h2 className="text-xs font-bold uppercase tracking-wider text-black/80">Add Essential</h2>
              <form onSubmit={addItem} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <input
                    type="text"
                    placeholder="Item name (e.g. Crisp Lettuce)"
                    value={name}
                    onChange={handleNameChange}
                    className="sm:col-span-5 px-4 py-3 rounded-2xl text-sm focus:outline-none bg-[#f3f0e8] border border-black/20 text-black placeholder:text-black/50"
                    required
                  />
                  <select
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setIsManualCategory(true); }}
                    className="sm:col-span-3 px-3 py-3 rounded-2xl text-xs font-semibold focus:outline-none cursor-pointer bg-[#f3f0e8] border border-black/20 text-black"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.name} value={cat.name} className="bg-[#f3f0e8] text-black">{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                  <div className="sm:col-span-2 flex gap-1.5">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder="Qty"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-16 px-2 py-3 rounded-2xl text-center text-sm font-bold focus:outline-none bg-[#f3f0e8] border border-black/20 text-black"
                    />
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="flex-1 px-2 py-3 rounded-2xl text-xs font-semibold focus:outline-none cursor-pointer capitalize bg-[#f3f0e8] border border-black/20 text-black"
                    >
                      {COMMON_UNITS.map((u) => (
                        <option key={u} value={u} className="bg-[#f3f0e8] text-black">{u}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="sm:col-span-2 font-bold py-3.5 rounded-2xl transition text-sm shadow-md active:scale-95 disabled:opacity-50 bg-black text-[#f3f0e8] hover:bg-black/80"
                  >
                    {loading ? 'Adding...' : 'Add Item'}
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-black/70">
                    <input
                      type="checkbox"
                      checked={trackLowStock}
                      onChange={(e) => setTrackLowStock(e.target.checked)}
                      className="rounded accent-black w-4 h-4 cursor-pointer"
                    />
                    Track low stock alerts for this item
                  </label>
                </div>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.keys(groupedItems).length > 0 ? (
                Object.entries(groupedItems).map(([groupCategory, groupList]) => {
                  const categoryIcon = CATEGORIES.find((c) => c.name.toLowerCase() === groupCategory.toLowerCase())?.icon || '📦';
                  return (
                    <div key={groupCategory} className="rounded-[28px] p-5 space-y-3 bg-[#B0B9A8]/40 border border-black/10">
                      <div className="flex items-center gap-2 pb-2 border-b border-black/10">
                        <span className="text-base">{categoryIcon}</span>
                        <span className="text-xs font-bold tracking-wider uppercase text-black">{groupCategory} ({groupList.length})</span>
                      </div>
                      <div className="space-y-2">
                        {groupList.map((item) => {
                          const isEditing = editingId === item.id;
                          const productIcon = getItemIcon(item.name, item.category);
                          const isTracked = item.track_low_stock ?? true;
                          return (
                            <div key={item.id} className="rounded-[20px] p-3 transition bg-[#f3f0e8] border border-black/10">
                              {!isEditing ? (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 bg-[#B0B9A8]/50 border border-black/10">{productIcon}</div>
                                    <div>
                                      <h3 className="font-bold text-sm capitalize text-black">{item.name}</h3>
                                      <p className="text-xs text-black/70">{item.quantity} {item.unit}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <button 
                                      onClick={() => toggleLowStockTracking(item)} 
                                      title={isTracked ? "Low stock tracking active (Click to disable)" : "Low stock tracking disabled (Click to enable)"}
                                      className={`p-1.5 text-xs rounded-lg transition ${isTracked ? 'text-amber-700' : 'text-black/30'}`}
                                    >
                                      {isTracked ? '🔔' : '🔕'}
                                    </button>
                                    <button onClick={() => adjustQuantity(item, -1)} className="w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center bg-[#B0B9A8]/30 text-red-700 border border-black/10 hover:bg-black/5">-</button>
                                    <button onClick={() => adjustQuantity(item, 1)} className="w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center bg-[#B0B9A8]/30 text-emerald-800 border border-black/10 hover:bg-black/5">+</button>
                                    <button onClick={() => startEditing(item)} className="p-1.5 text-xs text-black/60 hover:text-black">✏️</button>
                                    <button onClick={() => deleteItem(item.id)} className="p-1.5 text-xs text-black/40 hover:text-red-600">✕</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold capitalize text-black">Edit: {item.name}</span>
                                    <button onClick={() => setEditingId(null)} className="text-xs text-black/60 hover:text-black">Cancel</button>
                                  </div>
                                  <div className="flex gap-2">
                                    <select
                                      value={editCategory}
                                      onChange={(e) => setEditCategory(e.target.value)}
                                      className="w-28 px-2 py-2 rounded-xl text-xs font-semibold focus:outline-none bg-white border border-black/20 text-black"
                                    >
                                      {CATEGORIES.map((cat) => (
                                        <option key={cat.name} value={cat.name} className="bg-white text-black">{cat.icon} {cat.name}</option>
                                      ))}
                                    </select>
                                    <input
                                      type="number"
                                      step="any"
                                      min="0.01"
                                      value={editQuantity}
                                      onChange={(e) => setEditQuantity(e.target.value)}
                                      className="w-16 px-2 py-2 rounded-xl text-center text-xs font-bold focus:outline-none bg-white border border-black/20 text-black"
                                    />
                                    <select
                                      value={editUnit}
                                      onChange={(e) => setEditUnit(e.target.value)}
                                      className="flex-1 px-2 py-2 rounded-xl text-xs font-semibold focus:outline-none capitalize bg-white border border-black/20 text-black"
                                    >
                                      {COMMON_UNITS.map((u) => (
                                        <option key={u} value={u} className="bg-white text-black">{u}</option>
                                      ))}
                                    </select>
                                    <button onClick={() => saveEdit(item.id)} className="px-3 py-2 rounded-xl text-xs font-bold bg-black text-[#f3f0e8]">Save</button>
                                  </div>
                                  <label className="flex items-center gap-2 cursor-pointer text-xs text-black/70">
                                    <input
                                      type="checkbox"
                                      checked={editTrackLowStock}
                                      onChange={(e) => setEditTrackLowStock(e.target.checked)}
                                      className="rounded accent-black w-3.5 h-3.5 cursor-pointer"
                                    />
                                    Track low stock
                                  </label>
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
                <p className="text-center text-xs py-6 col-span-full text-black/50">No pantry items stored.</p>
              )}
            </div>
          </div>
        )}

        {/* RECIPES TAB */}
        {activeTab === 'recipes' && (
          <div className="space-y-6">
            <div className="rounded-[28px] p-6 space-y-3 bg-[#B0B9A8] border border-black/10">
              <h2 className="text-xs font-bold uppercase tracking-wider text-black/80">🌐 Import Recipe via Web URL</h2>
              <form onSubmit={handleImportRecipe} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  placeholder="Paste recipe URL (e.g. foodnetwork.com/...)"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-2xl text-xs focus:outline-none bg-[#f3f0e8] border border-black/20 text-black placeholder:text-black/50"
                  required
                />
                <button
                  type="submit"
                  disabled={isImporting}
                  className="px-8 font-bold py-3.5 rounded-2xl transition text-sm shadow-md active:scale-95 disabled:opacity-50 bg-black text-[#f3f0e8] hover:bg-black/80"
                >
                  {isImporting ? 'Scraping Recipe...' : 'Import to Library'}
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-bold tracking-wider uppercase px-1 text-black/60">Saved Recipes ({recipes.length})</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {recipes.map((recipe) => {
                  const match = getRecipePantryMatch(recipe);
                  return (
                    <div
                      key={recipe.id}
                      onClick={() => setSelectedRecipe(recipe)}
                      className="rounded-[24px] overflow-hidden cursor-pointer transition border border-black/10 hover:border-black/40 flex flex-col justify-between bg-[#B0B9A8]/30"
                    >
                      {recipe.image && (
                        <div className="w-full h-40 overflow-hidden relative bg-black/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-base text-black">{recipe.title}</h3>
                            <p className="text-xs mt-1 text-black/70">⏱️ {recipe.cook_time} • {recipe.category}</p>
                          </div>
                          <button onClick={(e) => deleteRecipe(recipe.id, e)} className="text-xs p-1 text-black/40 hover:text-red-600">✕</button>
                        </div>
                        <div className="flex justify-between items-center text-xs pt-3 border-t border-black/10">
                          <span className="text-black/70">{recipe.ingredients.length} Ingredients</span>
                          <span 
                            className="font-bold px-2.5 py-1 rounded-full text-[10px]"
                            style={{ 
                              backgroundColor: match.isReady ? '#047857' : '#f3f0e8',
                              color: match.isReady ? '#ffffff' : '#000000',
                              border: match.isReady ? 'none' : '1px solid rgba(0,0,0,0.15)'
                            }}
                          >
                            {match.isReady ? 'Ready to Cook! ✨' : `${match.matchedCount}/${match.totalCount} in Stock`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {recipes.length === 0 && (
                  <p className="text-center text-xs py-6 col-span-full text-black/50">No recipes saved yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* LOW STOCK MODAL */}
        {showLowStockModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-lg rounded-[32px] p-6 space-y-6 bg-[#f3f0e8] border border-black/20 text-black shadow-2xl">
              <div className="flex justify-between items-center border-b pb-4 border-black/10">
                <h2 className="text-lg font-bold flex items-center gap-2 text-red-700">
                  <span>⚠️</span> Low Stock Alerts ({lowStockItems.length})
                </h2>
                <button 
                  onClick={() => setShowLowStockModal(false)}
                  className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-xs hover:bg-black/20 text-black"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {lowStockItems.length > 0 ? (
                  lowStockItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-4 rounded-2xl bg-[#B0B9A8]/30 border border-black/10">
                      <div>
                        <h4 className="font-bold text-sm capitalize text-black">{item.name}</h4>
                        <p className="text-xs text-red-700 font-semibold">{item.quantity} {item.unit} remaining</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => adjustQuantity(item, 1)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-black text-[#f3f0e8]"
                        >
                          + Restock 1
                        </button>
                        <button 
                          onClick={() => toggleLowStockTracking(item)}
                          className="p-1.5 text-xs text-black/60 hover:text-black"
                          title="Stop tracking"
                        >
                          🔕
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-black/60 py-4">No tracked items are currently low on stock!</p>
                )}
              </div>

              <button
                onClick={() => setShowLowStockModal(false)}
                className="w-full py-3 rounded-2xl text-xs font-bold bg-black text-[#f3f0e8]"
              >
                Close List
              </button>
            </div>
          </div>
        )}

        {/* RECIPE DETAIL MODAL */}
        {selectedRecipe && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 z-50">
            <div className="w-full max-w-5xl rounded-[32px] overflow-hidden max-h-[90vh] flex flex-col bg-[#f3f0e8] border border-black/20 text-black shadow-2xl">
              {selectedRecipe.image && (
                <div className="w-full h-52 md:h-60 shrink-0 relative bg-black/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedRecipe.image} alt={selectedRecipe.title} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setSelectedRecipe(null)}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center font-bold text-white text-base hover:bg-black/80 transition"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
                <div className="flex justify-between items-start border-b pb-4 border-black/10">
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-black/60">{selectedRecipe.category}</span>
                    <h2 className="text-2xl md:text-3xl font-bold text-black leading-snug">{selectedRecipe.title}</h2>
                    <p className="text-xs md:text-sm mt-1 text-black/70">⏱️ Cook time: {selectedRecipe.cook_time}</p>
                  </div>
                  {!selectedRecipe.image && (
                    <button onClick={() => setSelectedRecipe(null)} className="w-9 h-9 rounded-full bg-black/10 flex items-center justify-center font-bold text-sm hover:bg-black/20 transition">✕</button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  <div className="md:col-span-4 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-black/80">Ingredients ({selectedRecipe.ingredients.length})</h3>
                    <div className="space-y-2">
                      {selectedRecipe.ingredients.map((ing, i) => {
                        const { status, requiredText, availableText } = getIngredientStatus(ing, items);
                        let badgeBg = 'bg-red-100 text-red-800 border-red-200';
                        let badgeText = '✕ Missing';

                        if (status === 'in_stock') {
                          badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                          badgeText = '✓ In Pantry';
                        } else if (status === 'insufficient') {
                          badgeBg = 'bg-amber-100 text-amber-800 border-amber-200';
                          badgeText = `⚠️ Need ${requiredText} (Have ${availableText})`;
                        }

                        return (
                          <div key={i} className="flex justify-between items-center text-xs p-3 rounded-xl bg-[#B0B9A8]/30 border border-black/10">
                            <span className="text-black font-medium">{ing}</span>
                            <span className={`text-[10px] font-bold shrink-0 ml-2 px-2 py-0.5 rounded-md border ${badgeBg}`}>
                              {badgeText}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="md:col-span-8 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-black/80">Method & Instructions</h3>
                    {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 ? (
                      <div className="space-y-3 text-sm text-black/80">
                        {selectedRecipe.instructions.map((step, idx) => (
                          <div key={idx} className="p-4 rounded-2xl space-y-1.5 bg-[#B0B9A8]/30 border border-black/10">
                            <span className="font-bold text-xs uppercase text-black/60">Step {idx + 1}</span>
                            <p className="leading-relaxed text-black">{step}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs italic text-black/50">No step-by-step instructions available.</p>
                    )}

                    {selectedRecipe.source_url && (
                      <a
                        href={selectedRecipe.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-5 py-3 rounded-2xl text-xs font-bold transition mt-4 bg-black text-[#f3f0e8] hover:bg-black/80"
                      >
                        🔗 View Original Web Recipe Page
                      </a>
                    )}
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