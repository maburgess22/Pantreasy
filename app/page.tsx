'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface PantryItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  track_low_stock?: boolean;
}

interface Recipe {
  id: string;
  user_id: string;
  title: string;
  image?: string;
  cook_time?: string;
  category?: string;
  ingredients: string[];
  instructions?: string[];
  source_url?: string;
}

const CATEGORIES = [
  { name: 'Produce', icon: '🥬', keywords: ['lettuce', 'apple', 'banana', 'tomato', 'onion', 'garlic', 'spinach', 'potato', 'carrot', 'lemon', 'lime', 'berry', 'fruit', 'veg'] },
  { name: 'Dairy & Eggs', icon: '🧀', keywords: ['milk', 'cheese', 'egg', 'butter', 'yogurt', 'cream'] },
  { name: 'Meat & Seafood', icon: '🥩', keywords: ['chicken', 'beef', 'pork', 'fish', 'salmon', 'steak', 'shrimp', 'bacon', 'turkey'] },
  { name: 'Pantry & Grains', icon: '🌾', keywords: ['rice', 'pasta', 'flour', 'sugar', 'oil', 'bread', 'cereal', 'oats', 'beans', 'lentils', 'sauce'] },
  { name: 'Spices & Condiments', icon: '🧂', keywords: ['salt', 'pepper', 'spice', 'herb', 'ketchup', 'mustard', 'mayo', 'soy sauce', 'vinegar', 'paprika', 'cinnamon'] },
  { name: 'Snacks & Sweets', icon: '🍿', keywords: ['chip', 'cookie', 'chocolate', 'candy', 'nuts', 'cracker', 'snack'] },
  { name: 'Beverages', icon: '🧃', keywords: ['water', 'juice', 'soda', 'coffee', 'tea', 'wine', 'beer'] },
  { name: 'Other', icon: '📦', keywords: [] },
];

const COMMON_UNITS = ['pcs', 'g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp'];

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pantry' | 'recipes'>('dashboard');
  const [items, setItems] = useState<PantryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);

  // Auth Screen State
  const [isSignUp, setIsSignUp] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Form State - Add Item
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Produce');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [trackLowStock, setTrackLowStock] = useState(true);
  const [isManualCategory, setIsManualCategory] = useState(false);

  // Edit State - Pantry Item
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editTrackLowStock, setEditTrackLowStock] = useState(true);

  // Recipe Import State
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Dashboard Modals
  const [showLowStockModal, setShowLowStockModal] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const { data: pantryData } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('user_id', user.id);
    if (pantryData) setItems(pantryData);

    const { data: recipeData } = await supabase
      .from('recipes')
      .select('*')
      .eq('user_id', user.id);
    if (recipeData) setRecipes(recipeData);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');
    setAuthLoading(true);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
      });

      if (error) {
        setAuthError(error.message);
      } else if (data.user && !data.session) {
        setAuthMessage('Account created! Check your email to confirm your sign up.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });

      if (error) setAuthError(error.message);
    }
    setAuthLoading(false);
  };

  const handleGitHubAuth = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'github' });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setItems([]);
    setRecipes([]);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);

    if (!isManualCategory && val.trim().length > 2) {
      const lower = val.toLowerCase();
      const matched = CATEGORIES.find((cat) =>
        cat.keywords.some((keyword) => lower.includes(keyword))
      );
      if (matched) setCategory(matched.name);
    }
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;
    setLoading(true);

    const newItem = {
      user_id: user.id,
      name: name.trim(),
      category,
      quantity: parseFloat(quantity) || 1,
      unit,
      track_low_stock: trackLowStock,
    };

    const { data, error } = await supabase
      .from('pantry_items')
      .insert([newItem])
      .select();

    if (error) {
      console.error('Pantry Insert Error:', error);
      alert(`Failed to add pantry item: ${error.message}`);
    } else if (data && data.length > 0) {
      setItems((prev) => [...prev, data[0]]);
      setName('');
      setQuantity('1');
      setTrackLowStock(true);
      setIsManualCategory(false);
    }
    setLoading(false);
  };

  const toggleLowStockTracking = async (item: PantryItem) => {
    const updatedStatus = !(item.track_low_stock ?? true);
    const { error } = await supabase
      .from('pantry_items')
      .update({ track_low_stock: updatedStatus })
      .eq('id', item.id)
      .eq('user_id', user.id);

    if (!error) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, track_low_stock: updatedStatus } : i))
      );
    }
  };

  const adjustQuantity = async (item: PantryItem, delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    if (newQty === 0) {
      deleteItem(item.id);
      return;
    }

    const { error } = await supabase
      .from('pantry_items')
      .update({ quantity: newQty })
      .eq('id', item.id)
      .eq('user_id', user.id);

    if (!error) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i)));
    }
  };

  const startEditing = (item: PantryItem) => {
    setEditingId(item.id);
    setEditCategory(item.category);
    setEditQuantity(item.quantity.toString());
    setEditUnit(item.unit);
    setEditTrackLowStock(item.track_low_stock ?? true);
  };

  const saveEdit = async (id: string) => {
    const updated = {
      category: editCategory,
      quantity: parseFloat(editQuantity) || 1,
      unit: editUnit,
      track_low_stock: editTrackLowStock,
    };

    const { error } = await supabase
      .from('pantry_items')
      .update(updated)
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
      setEditingId(null);
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from('pantry_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleImportRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl.trim() || !user) return;
    setIsImporting(true);

    try {
      const res = await fetch('/api/scrape-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl }),
      });

      if (!res.ok) throw new Error(`Scraper API returned status ${res.status}`);

      const recipeData = await res.json();

      const newRecipe = {
        user_id: user.id,
        title: recipeData.title || 'Untitled Recipe',
        image: recipeData.image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80',
        cook_time: recipeData.cook_time || '25 mins',
        category: recipeData.category || 'Dinner',
        ingredients: recipeData.ingredients || [],
        // Replace the scraped instructions with an array containing your link
        instructions: [`For full cooking instructions, visit the original recipe here: ${importUrl}`],
        source_url: importUrl,
      };

      const { data, error } = await supabase
        .from('recipes')
        .insert([newRecipe])
        .select();

      if (error) {
        console.error('Supabase Insert Error:', error);
        alert(`Failed to save recipe: ${error.message}`);
        return;
      }

      if (data && data.length > 0) {
        setRecipes((prev) => [...prev, data[0]]);
        setImportUrl('');
        alert('Recipe imported successfully!');
      }
    } catch (err: any) {
      console.error('Import error:', err);
      alert(`Import failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const deleteRecipe = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      if (selectedRecipe?.id === id) setSelectedRecipe(null);
    }
  };

  const getItemIcon = (itemName: string, itemCat: string) => {
    const cat = CATEGORIES.find((c) => c.name.toLowerCase() === itemCat.toLowerCase());
    return cat ? cat.icon : '📦';
  };

  const getIngredientStatus = (ingredientStr: string, pantry: PantryItem[]) => {
    const lowerIng = ingredientStr.toLowerCase();
    const matchedItem = pantry.find((p) => lowerIng.includes(p.name.toLowerCase()));

    if (!matchedItem) {
      return { status: 'missing', requiredText: ingredientStr, availableText: '0' };
    }

    if (matchedItem.quantity > 0) {
      return { status: 'in_stock', requiredText: ingredientStr, availableText: `${matchedItem.quantity} ${matchedItem.unit}` };
    }

    return { status: 'insufficient', requiredText: ingredientStr, availableText: `0 ${matchedItem.unit}` };
  };

  const getRecipePantryMatch = (recipe: Recipe) => {
    let matchedCount = 0;
    recipe.ingredients.forEach((ing) => {
      const { status } = getIngredientStatus(ing, items);
      if (status === 'in_stock') matchedCount++;
    });

    return {
      matchedCount,
      totalCount: recipe.ingredients.length,
      isReady: matchedCount === recipe.ingredients.length && recipe.ingredients.length > 0,
    };
  };

  const groupedItems = items.reduce<Record<string, PantryItem[]>>((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const lowStockItems = items.filter((i) => i.quantity <= 2 && (i.track_low_stock ?? true));

  // AUTH SCREEN
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0D151D] text-white">
        <div className="w-full max-w-md p-8 rounded-[32px] bg-[#131F2B] border border-[#1E2E3D] space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <span className="text-4xl">🥗</span>
            <h1 className="text-2xl font-bold tracking-tight">Welcome to Pantreasy</h1>
            <p className="text-xs text-[#8A9FB4]">
              {isSignUp ? 'Create an account to manage your kitchen' : 'Sign in to access your pantry and recipes'}
            </p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-[#8A9FB4]">Email Address</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-sm bg-[#0D151D] border border-[#2A3C4E] text-white focus:outline-none focus:border-[#20B2AA]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[#8A9FB4]">Password</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-sm bg-[#0D151D] border border-[#2A3C4E] text-white focus:outline-none focus:border-[#20B2AA]"
              />
            </div>

            {authError && (
              <p className="text-xs text-[#FF7B7B] bg-[#FF7B7B]/10 p-3 rounded-xl font-medium">{authError}</p>
            )}

            {authMessage && (
              <p className="text-xs text-[#20B2AA] bg-[#20B2AA]/10 p-3 rounded-xl font-medium">{authMessage}</p>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 rounded-2xl font-bold text-sm bg-[#20B2AA] text-[#0D151D] transition hover:opacity-90 disabled:opacity-50"
            >
              {authLoading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In with Email'}
            </button>
          </form>

          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-[#1E2E3D] w-full"></div>
            <span className="bg-[#131F2B] px-3 text-[10px] text-[#6C8299] uppercase tracking-wider font-bold absolute">OR</span>
          </div>

          <button
            onClick={handleGitHubAuth}
            className="w-full py-3 rounded-2xl text-xs font-bold bg-[#0D151D] border border-[#2A3C4E] text-white hover:bg-[#1A2836] transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Continue with GitHub
          </button>

          <p className="text-center text-xs text-[#8A9FB4]">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setAuthError('');
                setAuthMessage('');
              }}
              className="text-[#FFD166] font-bold underline ml-1"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D151D] text-white font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-[#1E2E3D]">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <span>🥗</span> Pantreasy
            </h1>
            <p className="text-xs md:text-sm mt-1 text-[#8A9FB4]">
              Connected account: <span className="font-semibold text-white">{user.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <nav className="flex gap-1.5 p-1.5 rounded-2xl bg-[#131F2B] border border-[#1E2E3D]">
              {(['dashboard', 'pantry', 'recipes'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition ${
                    activeTab === tab
                      ? 'bg-[#20B2AA] text-[#0D151D] shadow-md'
                      : 'text-[#8A9FB4] hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>

            <button
              onClick={handleSignOut}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-[#2A3C4E] text-[#FF7B7B] hover:bg-[#1A2836] transition"
            >
              Sign Out
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div 
                onClick={() => setActiveTab('pantry')}
                className="rounded-[28px] p-6 cursor-pointer transition hover:border-[#20B2AA] space-y-2 bg-[#131F2B] border border-[#1E2E3D]"
              >
                <div className="flex justify-between items-center">
                  <span className="text-3xl">🥗</span>
                  <span className="text-xs font-bold text-[#20B2AA]">View Pantry →</span>
                </div>
                <h3 className="text-4xl font-bold">{items.length}</h3>
                <p className="text-sm text-[#8A9FB4]">Pantry Items In Stock</p>
              </div>

              <div 
                onClick={() => setActiveTab('recipes')}
                className="rounded-[28px] p-6 cursor-pointer transition hover:border-[#FFD166] space-y-2 bg-[#131F2B] border border-[#1E2E3D]"
              >
                <div className="flex justify-between items-center">
                  <span className="text-3xl">📖</span>
                  <span className="text-xs font-bold text-[#FFD166]">View Recipes →</span>
                </div>
                <h3 className="text-4xl font-bold">{recipes.length}</h3>
                <p className="text-sm text-[#8A9FB4]">Saved Recipes</p>
              </div>

              <div 
                onClick={() => setShowLowStockModal(true)}
                className="rounded-[28px] p-6 cursor-pointer transition hover:border-[#FF7B7B] space-y-3 bg-[#131F2B] border border-[#1E2E3D]"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FF7B7B]">
                    ⚠️ Low Stock Alert ({lowStockItems.length})
                  </span>
                  <span className="text-xs font-bold text-[#FF7B7B]">Expand →</span>
                </div>

                {lowStockItems.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {lowStockItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 rounded-xl text-xs bg-[#0D151D]">
                        <span className="font-bold">{item.name}</span>
                        <span className="font-semibold text-[#FF7B7B]">{item.quantity} {item.unit} left</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-[#6C8299]">Pantry stock looks good!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pantry' && (
          <div className="space-y-6">
            <div className="rounded-[28px] p-6 space-y-4 bg-[#131F2B] border border-[#1E2E3D]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#20B2AA]">Add Essential</h2>
              <form onSubmit={addItem} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <input
                    type="text"
                    placeholder="Item name (e.g. Crisp Lettuce)"
                    value={name}
                    onChange={handleNameChange}
                    className="sm:col-span-5 px-4 py-3 rounded-2xl text-sm focus:outline-none bg-[#0D151D] border border-[#2A3C4E] text-white"
                    required
                  />
                  <select
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setIsManualCategory(true); }}
                    className="sm:col-span-3 px-3 py-3 rounded-2xl text-xs font-semibold focus:outline-none cursor-pointer bg-[#0D151D] border border-[#2A3C4E] text-[#FFD166]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.name} value={cat.name} className="bg-[#1A2836] text-white">{cat.icon} {cat.name}</option>
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
                      className="w-16 px-2 py-3 rounded-2xl text-center text-sm font-bold focus:outline-none bg-[#0D151D] border border-[#2A3C4E] text-white"
                    />
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="flex-1 px-2 py-3 rounded-2xl text-xs font-semibold focus:outline-none cursor-pointer capitalize bg-[#0D151D] border border-[#2A3C4E] text-[#20B2AA]"
                    >
                      {COMMON_UNITS.map((u) => (
                        <option key={u} value={u} className="bg-[#1A2836] text-white">{u}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="sm:col-span-2 font-bold py-3.5 rounded-2xl transition text-sm shadow-md active:scale-95 disabled:opacity-50 bg-[#FF7B7B] text-[#131F2B]"
                  >
                    {loading ? 'Adding...' : 'Add Item'}
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#8A9FB4]">
                    <input
                      type="checkbox"
                      checked={trackLowStock}
                      onChange={(e) => setTrackLowStock(e.target.checked)}
                      className="rounded accent-[#20B2AA] w-4 h-4 cursor-pointer"
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
                    <div key={groupCategory} className="rounded-[28px] p-5 space-y-3 bg-[#131F2B] border border-[#1E2E3D]">
                      <div className="flex items-center gap-2 pb-2 border-b border-[#233547]">
                        <span className="text-base">{categoryIcon}</span>
                        <span className="text-xs font-bold tracking-wider uppercase text-[#FFD166]">{groupCategory} ({groupList.length})</span>
                      </div>
                      <div className="space-y-2">
                        {groupList.map((item) => {
                          const isEditing = editingId === item.id;
                          const productIcon = getItemIcon(item.name, item.category);
                          const isTracked = item.track_low_stock ?? true;
                          return (
                            <div key={item.id} className="rounded-[20px] p-3 transition bg-[#1A2836] border border-[#233547]">
                              {!isEditing ? (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 bg-[#0D151D] border border-[#2A3C4E]">{productIcon}</div>
                                    <div>
                                      <h3 className="font-bold text-sm capitalize text-white">{item.name}</h3>
                                      <p className="text-xs text-[#8A9FB4]">{item.quantity} {item.unit}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <button 
                                      onClick={() => toggleLowStockTracking(item)} 
                                      title={isTracked ? "Low stock tracking active (Click to disable)" : "Low stock tracking disabled (Click to enable)"}
                                      className={`p-1.5 text-xs rounded-lg transition ${isTracked ? 'text-[#FFD166]' : 'text-[#556A7E]'}`}
                                    >
                                      {isTracked ? '🔔' : '🔕'}
                                    </button>
                                    <button onClick={() => adjustQuantity(item, -1)} className="w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center bg-[#0D151D] text-[#FF7B7B] border border-[#2A3C4E]">-</button>
                                    <button onClick={() => adjustQuantity(item, 1)} className="w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center bg-[#0D151D] text-[#20B2AA] border border-[#2A3C4E]">+</button>
                                    <button onClick={() => startEditing(item)} className="p-1.5 text-xs text-[#8A9FB4]">✏️</button>
                                    <button onClick={() => deleteItem(item.id)} className="p-1.5 text-xs text-[#556A7E]">✕</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold capitalize">Edit: {item.name}</span>
                                    <button onClick={() => setEditingId(null)} className="text-xs text-[#8A9FB4]">Cancel</button>
                                  </div>
                                  <div className="flex gap-2">
                                    <select
                                      value={editCategory}
                                      onChange={(e) => setEditCategory(e.target.value)}
                                      className="w-28 px-2 py-2 rounded-xl text-xs font-semibold focus:outline-none bg-[#0D151D] border border-[#20B2AA] text-[#FFD166]"
                                    >
                                      {CATEGORIES.map((cat) => (
                                        <option key={cat.name} value={cat.name} className="bg-[#1A2836] text-white">{cat.icon} {cat.name}</option>
                                      ))}
                                    </select>
                                    <input
                                      type="number"
                                      step="any"
                                      min="0.01"
                                      value={editQuantity}
                                      onChange={(e) => setEditQuantity(e.target.value)}
                                      className="w-16 px-2 py-2 rounded-xl text-center text-xs font-bold focus:outline-none bg-[#0D151D] border border-[#20B2AA] text-white"
                                    />
                                    <select
                                      value={editUnit}
                                      onChange={(e) => setEditUnit(e.target.value)}
                                      className="flex-1 px-2 py-2 rounded-xl text-xs font-semibold focus:outline-none capitalize bg-[#0D151D] border border-[#20B2AA] text-[#20B2AA]"
                                    >
                                      {COMMON_UNITS.map((u) => (
                                        <option key={u} value={u} className="bg-[#1A2836] text-white">{u}</option>
                                      ))}
                                    </select>
                                    <button onClick={() => saveEdit(item.id)} className="px-3 py-2 rounded-xl text-xs font-bold bg-[#20B2AA] text-[#0D151D]">Save</button>
                                  </div>
                                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#8A9FB4]">
                                    <input
                                      type="checkbox"
                                      checked={editTrackLowStock}
                                      onChange={(e) => setEditTrackLowStock(e.target.checked)}
                                      className="rounded accent-[#20B2AA] w-3.5 h-3.5 cursor-pointer"
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
                <p className="text-center text-xs py-6 col-span-full text-[#6C8299]">No pantry items stored.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'recipes' && (
          <div className="space-y-6">
            <div className="rounded-[28px] p-6 space-y-3 bg-[#131F2B] border border-[#1E2E3D]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#20B2AA]">🌐 Import Recipe via Web URL</h2>
              <form onSubmit={handleImportRecipe} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  placeholder="Paste recipe URL (e.g. foodnetwork.com/...)"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-2xl text-xs focus:outline-none bg-[#0D151D] border border-[#2A3C4E] text-white"
                  required
                />
                <button
                  type="submit"
                  disabled={isImporting}
                  className="px-8 font-bold py-3.5 rounded-2xl transition text-sm shadow-md active:scale-95 disabled:opacity-50 bg-[#FFD166] text-[#131F2B]"
                >
                  {isImporting ? 'Scraping Recipe...' : 'Import to Library'}
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-bold tracking-wider uppercase px-1 text-[#6C8299]">Saved Recipes ({recipes.length})</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {recipes.map((recipe) => {
                  const match = getRecipePantryMatch(recipe);
                  return (
                    <div
                      key={recipe.id}
                      onClick={() => setSelectedRecipe(recipe)}
                      className="rounded-[24px] overflow-hidden cursor-pointer transition border hover:border-[#20B2AA] flex flex-col justify-between bg-[#131F2B] border-[#1E2E3D]"
                    >
                      {recipe.image && (
                        <div className="w-full h-40 overflow-hidden relative bg-black/20">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-base text-white">{recipe.title}</h3>
                            <p className="text-xs mt-1 text-[#8A9FB4]">⏱️ {recipe.cook_time} • {recipe.category}</p>
                          </div>
                          <button onClick={(e) => deleteRecipe(recipe.id, e)} className="text-xs p-1 text-[#556A7E] hover:text-white">✕</button>
                        </div>
                        <div className="flex justify-between items-center text-xs pt-3 border-t border-[#233547]">
                          <span className="text-[#8A9FB4]">{recipe.ingredients.length} Ingredients</span>
                          <span 
                            className="font-bold px-2.5 py-1 rounded-full text-[10px]"
                            style={{ 
                              backgroundColor: match.isReady ? '#20B2AA' : '#0D151D',
                              color: match.isReady ? '#0D151D' : '#FFD166',
                              border: match.isReady ? 'none' : '1px solid #2A3C4E'
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
                  <p className="text-center text-xs py-6 col-span-full text-[#6C8299]">No recipes saved yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {showLowStockModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-lg rounded-[32px] p-6 space-y-6 bg-[#131F2B] border border-[#FF7B7B]">
              <div className="flex justify-between items-center border-b pb-4 border-[#233547]">
                <h2 className="text-lg font-bold flex items-center gap-2 text-[#FF7B7B]">
                  <span>⚠️</span> Low Stock Alerts ({lowStockItems.length})
                </h2>
                <button 
                  onClick={() => setShowLowStockModal(false)}
                  className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-xs hover:bg-black/60"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {lowStockItems.length > 0 ? (
                  lowStockItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-4 rounded-2xl bg-[#1A2836] border border-[#233547]">
                      <div>
                        <h4 className="font-bold text-sm capitalize">{item.name}</h4>
                        <p className="text-xs text-[#FF7B7B] font-semibold">{item.quantity} {item.unit} remaining</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => adjustQuantity(item, 1)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#20B2AA] text-[#0D151D]"
                        >
                          + Restock 1
                        </button>
                        <button 
                          onClick={() => toggleLowStockTracking(item)}
                          className="p-1.5 text-xs text-[#8A9FB4] hover:text-white"
                          title="Stop tracking"
                        >
                          🔕
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-[#8A9FB4] py-4">No tracked items are currently low on stock!</p>
                )}
              </div>

              <button
                onClick={() => setShowLowStockModal(false)}
                className="w-full py-3 rounded-2xl text-xs font-bold bg-[#0D151D] border border-[#2A3C4E] text-white"
              >
                Close List
              </button>
            </div>
          </div>
        )}

        {selectedRecipe && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 md:p-8 z-50">
            <div className="w-full max-w-5xl rounded-[32px] overflow-hidden max-h-[90vh] flex flex-col bg-[#131F2B] border border-[#20B2AA]">
              {selectedRecipe.image && (
                <div className="w-full h-52 md:h-60 shrink-0 relative bg-black/40">
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
                <div className="flex justify-between items-start border-b pb-4 border-[#233547]">
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-[#FFD166]">{selectedRecipe.category}</span>
                    <h2 className="text-2xl md:text-3xl font-bold leading-snug">{selectedRecipe.title}</h2>
                    <p className="text-xs md:text-sm mt-1 text-[#8A9FB4]">⏱️ Cook time: {selectedRecipe.cook_time}</p>
                  </div>
                  {!selectedRecipe.image && (
                    <button onClick={() => setSelectedRecipe(null)} className="w-9 h-9 rounded-full bg-black/30 flex items-center justify-center font-bold text-sm hover:bg-black/50 transition">✕</button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  <div className="md:col-span-4 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#20B2AA]">Ingredients ({selectedRecipe.ingredients.length})</h3>
                    <div className="space-y-2">
                      {selectedRecipe.ingredients.map((ing, i) => {
                        const { status, requiredText, availableText } = getIngredientStatus(ing, items);
                        let badgeColor = '#FF7B7B';
                        let badgeText = '✕ Missing';

                        if (status === 'in_stock') {
                          badgeColor = '#20B2AA';
                          badgeText = '✓ In Pantry';
                        } else if (status === 'insufficient') {
                          badgeColor = '#FFD166';
                          badgeText = `⚠️ Need ${requiredText} (Have ${availableText})`;
                        }

                        return (
                          <div key={i} className="flex justify-between items-center text-xs p-3 rounded-xl bg-[#1A2836]">
                            <span style={{ color: status === 'in_stock' ? '#FFFFFF' : '#8A9FB4' }}>{ing}</span>
                            <span className="text-[10px] font-bold shrink-0 ml-2 px-2 py-0.5 rounded-md bg-[#0D151D]" style={{ color: badgeColor }}>
                              {badgeText}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="md:col-span-8 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#20B2AA]">Method & Instructions</h3>
                    {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 ? (
                      <div className="space-y-3 text-sm text-[#D0E0F0]">
                        {selectedRecipe.instructions.map((step, idx) => (
                          <div key={idx} className="p-4 rounded-2xl space-y-1.5 bg-[#1A2836]">
                            <span className="font-bold text-xs uppercase text-[#FFD166]">Step {idx + 1}</span>
                            <p className="leading-relaxed">{step}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs italic text-[#6C8299]">No step-by-step instructions available.</p>
                    )}

                    {selectedRecipe.source_url && (
                      <a
                        href={selectedRecipe.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-5 py-3 rounded-2xl text-xs font-bold transition mt-4 bg-[#0D151D] text-[#20B2AA] border border-[#20B2AA]"
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