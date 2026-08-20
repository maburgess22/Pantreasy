'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

interface Recipe {
  id: string;
  title: string;
  cook_time: string;
  category: string;
  image?: string;
  ingredients: string[];
  instructions?: string[];
  source_url?: string;
}

const COMMON_UNITS = [
  'pcs', 'ml', 'liters', 'g', 'kg', 'pack', 'box', 
  'can', 'bottle', 'bag', 'carton', 'lbs', 'oz', 'gal', 'bunch'
];

const CATEGORIES = [
  { name: 'Dairy', icon: '🥛' },
  { name: 'Bakery & Grains', icon: '🍞' },
  { name: 'Produce', icon: '🌱' },
  { name: 'Tins & Canned', icon: '🥫' },
  { name: 'Sauces & Condiments', icon: '🍾' },
  { name: 'Pasta & Noodles', icon: '🍝' },
  { name: 'Meat & Seafood', icon: '🥩' },
  { name: 'Snacks & Sweets', icon: '🍿' },
  { name: 'Beverages', icon: '🥤' },
  { name: 'Other', icon: '📦' },
];

const SPECIFIC_PRODUCT_ICONS: { keywords: RegExp; icon: string }[] = [
  { keywords: /beer|ale|lager|stout|cider/i, icon: '🍺' },
  { keywords: /wine|prosecco|champagne/i, icon: '🍷' },
  { keywords: /coffee|espresso|latte/i, icon: '☕' },
  { keywords: /tea|chai|matcha/i, icon: '🫖' },
  { keywords: /soda|coke|cola|pepsi|sprite/i, icon: '🥤' },
  { keywords: /water|sparkling/i, icon: '💧' },
  { keywords: /juice|smoothie/i, icon: '🧃' },
  { keywords: /lettuce|salad|spinach|kale|greens/i, icon: '🥬' },
  { keywords: /broccoli|cauliflower/i, icon: '🥦' },
  { keywords: /carrot|carrots/i, icon: '🥕' },
  { keywords: /corn/i, icon: '🌽' },
  { keywords: /potato|potatoes/i, icon: '🥔' },
  { keywords: /tomato|tomatoes/i, icon: '🍅' },
  { keywords: /onion|shallot/i, icon: '🧅' },
  { keywords: /garlic/i, icon: '🧄' },
  { keywords: /cucumber|pickle|zucchini/i, icon: '🥒' },
  { keywords: /pepper|chili|jalapeno/i, icon: '🫑' },
  { keywords: /mushroom|mushrooms/i, icon: '🍄' },
  { keywords: /avocado/i, icon: '🥑' },
  { keywords: /apple|apples/i, icon: '🍎' },
  { keywords: /banana|bananas/i, icon: '🍌' },
  { keywords: /orange|mandarin|tangerine/i, icon: '🍊' },
  { keywords: /lemon|lime/i, icon: '🍋' },
  { keywords: /grape|grapes/i, icon: '🍇' },
  { keywords: /strawberry|strawberries/i, icon: '🍓' },
  { keywords: /blueberry|berries/i, icon: '🫐' },
  { keywords: /milk/i, icon: '🥛' },
  { keywords: /egg|eggs/i, icon: '🥚' },
  { keywords: /cheese|cheddar|mozzarella/i, icon: '🧀' },
  { keywords: /butter|margarine/i, icon: '🧈' },
  { keywords: /bread|toast|bagel|bun/i, icon: '🍞' },
  { keywords: /rice/i, icon: '🍚' },
  { keywords: /pasta|spaghetti|penne/i, icon: '🍝' },
  { keywords: /noodle|ramen/i, icon: '🍜' },
  { keywords: /chicken|turkey|poultry/i, icon: '🍗' },
  { keywords: /steak|beef|meat|lamb/i, icon: '🥩' },
  { keywords: /bacon|pork|ham/i, icon: '🥓' },
  { keywords: /sausage/i, icon: '🌭' },
  { keywords: /fish|salmon|cod/i, icon: '🐟' },
  { keywords: /shrimp|prawn/i, icon: '🦐' },
  { keywords: /tin|can|tuna|beans|soup/i, icon: '🥫' },
  { keywords: /sauce|ketchup|mayo/i, icon: '🍾' },
];

// Unit Conversion Matrix
const UNIT_CONVERSIONS: Record<string, { baseUnit: string; factor: number }> = {
  // Mass (Base: grams)
  g: { baseUnit: 'g', factor: 1 },
  gram: { baseUnit: 'g', factor: 1 },
  grams: { baseUnit: 'g', factor: 1 },
  kg: { baseUnit: 'g', factor: 1000 },
  kilogram: { baseUnit: 'g', factor: 1000 },
  kilograms: { baseUnit: 'g', factor: 1000 },
  oz: { baseUnit: 'g', factor: 28.35 },
  ounce: { baseUnit: 'g', factor: 28.35 },
  ounces: { baseUnit: 'g', factor: 28.35 },
  lb: { baseUnit: 'g', factor: 453.6 },
  lbs: { baseUnit: 'g', factor: 453.6 },
  pound: { baseUnit: 'g', factor: 453.6 },
  pounds: { baseUnit: 'g', factor: 453.6 },

  // Volume (Base: milliliters)
  ml: { baseUnit: 'ml', factor: 1 },
  milliliter: { baseUnit: 'ml', factor: 1 },
  milliliters: { baseUnit: 'ml', factor: 1 },
  l: { baseUnit: 'ml', factor: 1000 },
  liter: { baseUnit: 'ml', factor: 1000 },
  liters: { baseUnit: 'ml', factor: 1000 },
  tsp: { baseUnit: 'ml', factor: 5 },
  teaspoon: { baseUnit: 'ml', factor: 5 },
  teaspoons: { baseUnit: 'ml', factor: 5 },
  tbsp: { baseUnit: 'ml', factor: 15 },
  tablespoon: { baseUnit: 'ml', factor: 15 },
  tablespoons: { baseUnit: 'ml', factor: 15 },
  cup: { baseUnit: 'ml', factor: 240 },
  cups: { baseUnit: 'ml', factor: 240 },
};

const normalizeQuantity = (qty: number, unit: string) => {
  const lowerUnit = (unit || '').toLowerCase().trim();
  const conv = UNIT_CONVERSIONS[lowerUnit];
  if (conv) {
    return { value: qty * conv.factor, baseUnit: conv.baseUnit };
  }
  return { value: qty, baseUnit: lowerUnit || 'pcs' };
};

const parseIngredientText = (text: string) => {
  const lower = text.toLowerCase().trim();

  let qty: number | null = null;

  if (/\b(half|a half)\b/.test(lower)) qty = 0.5;
  else if (/\b(quarter|a quarter)\b/.test(lower)) qty = 0.25;
  else if (/\b(third|a third)\b/.test(lower)) qty = 0.33;
  else {
    const mixedMatch = lower.match(/^(\d+)\s+(\d+)\/(\d+)/);
    if (mixedMatch) {
      qty = parseFloat(mixedMatch[1]) + (parseFloat(mixedMatch[2]) / parseFloat(mixedMatch[3]));
    } else {
      const fracMatch = lower.match(/(\d+)\/(\d+)/);
      if (fracMatch) {
        qty = parseFloat(fracMatch[1]) / parseFloat(fracMatch[2]);
      } else {
        const numMatch = lower.match(/(\d+(?:\.\d+)?)/);
        if (numMatch) {
          qty = parseFloat(numMatch[1]);
        }
      }
    }
  }

  let unit = '';
  const unitMatch = lower.match(/(?:^|\d+|\s)(kg|kilograms?|grams?|g|milliliters?|ml|liters?|l|ounces?|oz|pounds?|lbs?|tablespoons?|tbsp|teaspoons?|tsp|cups?|pcs|pack|box|can|bottle|bag|carton|bunch)\b/i);
  if (unitMatch) {
    unit = unitMatch[1];
  }

  return { qty, unit };
};

const getIngredientStatus = (ingString: string, items: PantryItem[]) => {
  const lowerIng = ingString.toLowerCase();

  const matchedItem = items.find((item) => {
    const pName = item.name.toLowerCase().trim();
    if (!pName) return false;
    return lowerIng.includes(pName) || pName.includes(lowerIng);
  });

  if (!matchedItem) {
    return { status: 'missing', requiredText: '', availableText: '' };
  }

  const { qty: requiredQty, unit: requiredUnit } = parseIngredientText(ingString);

  if (requiredQty !== null) {
    const normPantry = normalizeQuantity(matchedItem.quantity, matchedItem.unit);
    const normRequired = normalizeQuantity(requiredQty, requiredUnit);

    const pantryDisplay = `${matchedItem.quantity}${matchedItem.unit}`;
    const reqDisplay = `${requiredQty}${requiredUnit || matchedItem.unit}`;

    if (normPantry.baseUnit === normRequired.baseUnit) {
      if (normPantry.value >= normRequired.value) {
        return { status: 'in_stock', requiredText: reqDisplay, availableText: pantryDisplay };
      } else {
        return { status: 'insufficient', requiredText: reqDisplay, availableText: pantryDisplay };
      }
    } else {
      if (matchedItem.quantity >= requiredQty) {
        return { status: 'in_stock', requiredText: reqDisplay, availableText: pantryDisplay };
      } else {
        return { status: 'insufficient', requiredText: reqDisplay, availableText: pantryDisplay };
      }
    }
  }

  const pantryDisplay = `${matchedItem.quantity}${matchedItem.unit}`;
  return matchedItem.quantity > 0
    ? { status: 'in_stock', requiredText: '1', availableText: pantryDisplay }
    : { status: 'missing', requiredText: '1', availableText: '0' };
};

const autoDetectCategory = (itemName: string): string => {
  const lower = itemName.toLowerCase().trim();
  if (!lower) return 'Other';

  if (/milk|egg|cheese|butter|yogurt|cream/i.test(lower)) return 'Dairy';
  if (/bread|bagel|bun|flour|oat|cereal|rice/i.test(lower)) return 'Bakery & Grains';
  if (/apple|banana|berry|strawberry|avocado|tomato|onion|potato|garlic|spinach|lettuce|salad|lemon|lime|carrot|cucumber|leek/i.test(lower)) return 'Produce';
  if (/tin|can|canned|tuna|beans|soup/i.test(lower)) return 'Tins & Canned';
  if (/sauce|ketchup|oil|mayo|mustard|vinegar/i.test(lower)) return 'Sauces & Condiments';
  if (/pasta|spaghetti|noodle|macaroni|penne|ramen/i.test(lower)) return 'Pasta & Noodles';
  if (/chicken|steak|beef|pork|bacon|turkey|fish|salmon|shrimp|sausage/i.test(lower)) return 'Meat & Seafood';
  if (/chip|chips|chocolate|candy|cookie|biscuit/i.test(lower)) return 'Snacks & Sweets';
  if (/water|juice|soda|coffee|tea|beer|wine|drink/i.test(lower)) return 'Beverages';

  return 'Other';
};

const getItemIcon = (name: string, category: string) => {
  const matched = SPECIFIC_PRODUCT_ICONS.find((entry) => entry.keywords.test(name));
  if (matched) return matched.icon;

  const matchedCat = CATEGORIES.find((c) => c.name.toLowerCase() === category.toLowerCase());
  return matchedCat ? matchedCat.icon : '📦';
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pantry' | 'recipes'>('dashboard');

  // Pantry State
  const [items, setItems] = useState<PantryItem[]>([]);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<number | string>(1);
  const [unit, setUnit] = useState('pcs');
  const [category, setCategory] = useState('Dairy');
  const [isManualCategory, setIsManualCategory] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit Pantry State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number | string>(1);
  const [editUnit, setEditUnit] = useState('pcs');
  const [editCategory, setEditCategory] = useState('Dairy');

  // Recipe State
  const [recipes, setRecipes] = useState<Recipe[]>([
    { 
      id: '1', 
      title: 'Fluffy Cheese Omelette', 
      cook_time: '10 mins', 
      category: 'Dairy', 
      ingredients: ['3 eggs', '1 tbsp butter', '50g cheddar cheese'],
      instructions: ['Beat eggs in a bowl.', 'Melt butter in a non-stick pan over medium heat.', 'Pour in eggs, cook until soft, add cheese, and fold in half.'] 
    },
  ]);
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('pantry_items')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setItems(data);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!isManualCategory) {
      setCategory(autoDetectCategory(newName));
    }
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const numQty = Number(quantity) || 1;
    const { error } = await supabase
      .from('pantry_items')
      .insert([{ name: name.trim(), quantity: numQty, unit, category }]);

    if (!error) {
      setName('');
      setQuantity(1);
      setUnit('pcs');
      setIsManualCategory(false);
      fetchItems();
    }
    setLoading(false);
  };

  const adjustQuantity = async (item: PantryItem, delta: number) => {
    const newQty = Math.max(0, Number((item.quantity + delta).toFixed(2)));
    if (newQty === 0) {
      deleteItem(item.id);
      return;
    }

    const { error } = await supabase
      .from('pantry_items')
      .update({ quantity: newQty })
      .eq('id', item.id);

    if (!error) {
      setItems(items.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i)));
    }
  };

  const startEditing = (item: PantryItem) => {
    setEditingId(item.id);
    setEditQuantity(item.quantity);
    setEditUnit(item.unit);
    setEditCategory(item.category || 'Other');
  };

  const saveEdit = async (id: string) => {
    const numQty = Number(editQuantity);
    if (isNaN(numQty) || numQty <= 0) {
      deleteItem(id);
      return;
    }

    const { error } = await supabase
      .from('pantry_items')
      .update({ quantity: numQty, unit: editUnit, category: editCategory })
      .eq('id', id);

    if (!error) {
      setItems(items.map((i) => (i.id === id ? { ...i, quantity: numQty, unit: editUnit, category: editCategory } : i)));
      setEditingId(null);
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('pantry_items').delete().eq('id', id);
    if (!error) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const handleImportRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl.trim()) return;

    setIsImporting(true);
    try {
      const res = await fetch('/api/scrape-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.title) {
        const newRecipe: Recipe = {
          id: Date.now().toString(),
          title: data.title,
          cook_time: data.cook_time || '20 mins',
          category: data.category || 'Other',
          image: data.image || '',
          ingredients: data.ingredients || [],
          instructions: data.instructions || [],
          source_url: data.source_url,
        };

        setRecipes([newRecipe, ...recipes]);
        setImportUrl('');
        setSelectedRecipe(newRecipe);
      } else {
        alert(data.error || 'Could not parse recipe from URL');
      }
    } catch {
      alert('Error fetching recipe from web');
    }
    setIsImporting(false);
  };

  const deleteRecipe = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecipes(recipes.filter((r) => r.id !== id));
    if (selectedRecipe?.id === id) setSelectedRecipe(null);
  };

  const getRecipePantryMatch = (recipe: Recipe) => {
    const matchStatuses = recipe.ingredients.map((ing) => getIngredientStatus(ing, items));
    const matchedCount = matchStatuses.filter((s) => s.status === 'in_stock').length;

    return {
      matchedCount,
      totalCount: recipe.ingredients.length,
      isReady: matchedCount === recipe.ingredients.length && recipe.ingredients.length > 0,
    };
  };

  const lowStockItems = items.filter((i) => i.quantity <= 1);
  const cookableRecipesCount = recipes.filter((r) => getRecipePantryMatch(r).isReady).length;

  const groupedItems = items.reduce((acc, item) => {
    const matchedCat = CATEGORIES.find(
      (c) => c.name.toLowerCase() === (item.category || '').toLowerCase()
    );
    const catName = matchedCat ? matchedCat.name : 'Other';

    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(item);
    return acc;
  }, {} as Record<string, PantryItem[]>);

  return (
    <main 
      className="min-h-screen w-full p-4 md:p-8 space-y-6 flex flex-col font-sans"
      style={{ backgroundColor: '#0D151D', color: '#FFFFFF' }}
    >
      {/* Top Header */}
      <div 
        className="w-full max-w-7xl mx-auto rounded-[28px] p-6 flex justify-between items-center"
        style={{ backgroundColor: '#131F2B', border: '1px solid #1E2E3D' }}
      >
        <div>
          <h1 className="text-3xl font-serif italic font-bold tracking-wide" style={{ color: '#FFFFFF' }}>
            Pantreasy
          </h1>
          <p className="text-xs mt-0.5" style={{ color: '#20B2AA' }}>
            Smart Stock & Recipe Hub
          </p>
        </div>

        {/* Tab Switcher */}
        <div 
          className="flex p-1.5 rounded-2xl text-sm font-bold gap-2"
          style={{ backgroundColor: '#0D151D', border: '1px solid #223446' }}
        >
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-2.5 rounded-xl transition ${activeTab === 'dashboard' ? 'shadow-md' : 'opacity-60'}`}
            style={{
              backgroundColor: activeTab === 'dashboard' ? '#20B2AA' : 'transparent',
              color: activeTab === 'dashboard' ? '#0D151D' : '#FFFFFF',
            }}
          >
            📊 Main
          </button>
          <button
            onClick={() => setActiveTab('pantry')}
            className={`px-6 py-2.5 rounded-xl transition ${activeTab === 'pantry' ? 'shadow-md' : 'opacity-60'}`}
            style={{
              backgroundColor: activeTab === 'pantry' ? '#20B2AA' : 'transparent',
              color: activeTab === 'pantry' ? '#0D151D' : '#FFFFFF',
            }}
          >
            🥗 Pantry
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={`px-6 py-2.5 rounded-xl transition ${activeTab === 'recipes' ? 'shadow-md' : 'opacity-60'}`}
            style={{
              backgroundColor: activeTab === 'recipes' ? '#20B2AA' : 'transparent',
              color: activeTab === 'recipes' ? '#0D151D' : '#FFFFFF',
            }}
          >
            📖 Recipes
          </button>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto flex-1">
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div 
              className="rounded-[28px] p-8 space-y-2"
              style={{ backgroundColor: '#20B2AA', color: '#0D151D' }}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase font-bold tracking-wider opacity-80">Overview</span>
                <span className="text-xs font-bold bg-black/10 px-3 py-1 rounded-full">Live Stats</span>
              </div>
              <h2 className="text-3xl font-bold leading-snug">
                {cookableRecipesCount > 0 
                  ? `You can cook ${cookableRecipesCount} recipe${cookableRecipesCount > 1 ? 's' : ''} right now!`
                  : 'Welcome to Pantreasy'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div 
                onClick={() => setActiveTab('pantry')}
                className="rounded-[28px] p-6 cursor-pointer transition hover:border-[#20B2AA] space-y-2"
                style={{ backgroundColor: '#131F2B', border: '1px solid #1E2E3D' }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-3xl">🥗</span>
                  <span className="text-xs font-bold" style={{ color: '#20B2AA' }}>View Pantry →</span>
                </div>
                <h3 className="text-4xl font-bold">{items.length}</h3>
                <p className="text-sm" style={{ color: '#8A9FB4' }}>Pantry Items In Stock</p>
              </div>

              <div 
                onClick={() => setActiveTab('recipes')}
                className="rounded-[28px] p-6 cursor-pointer transition hover:border-[#FFD166] space-y-2"
                style={{ backgroundColor: '#131F2B', border: '1px solid #1E2E3D' }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-3xl">📖</span>
                  <span className="text-xs font-bold" style={{ color: '#FFD166' }}>View Recipes →</span>
                </div>
                <h3 className="text-4xl font-bold">{recipes.length}</h3>
                <p className="text-sm" style={{ color: '#8A9FB4' }}>Saved Recipes</p>
              </div>

              <div 
                className="rounded-[28px] p-6 space-y-3"
                style={{ backgroundColor: '#131F2B', border: '1px solid #1E2E3D' }}
              >
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#FF7B7B' }}>
                  ⚠️ Low Stock Alert ({lowStockItems.length})
                </span>

                {lowStockItems.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {lowStockItems.map((item) => (
                      <div 
                        key={item.id} 
                        className="flex justify-between items-center p-3 rounded-xl text-xs"
                        style={{ backgroundColor: '#0D151D' }}
                      >
                        <span className="font-bold">{item.name}</span>
                        <span className="font-semibold" style={{ color: '#FF7B7B' }}>
                          {item.quantity} {item.unit} left
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic" style={{ color: '#6C8299' }}>Pantry stock looks good!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PANTRY TAB */}
        {activeTab === 'pantry' && (
          <div className="space-y-6">
            <div 
              className="rounded-[28px] p-6 space-y-4"
              style={{ backgroundColor: '#131F2B', border: '1px solid #1E2E3D' }}
            >
              <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#20B2AA' }}>
                Add Essential
              </h2>

              <form onSubmit={addItem} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <input
                  type="text"
                  placeholder="Item name (e.g. Crisp Lettuce)"
                  value={name}
                  onChange={handleNameChange}
                  className="sm:col-span-5 px-4 py-3 rounded-2xl text-sm focus:outline-none"
                  style={{ backgroundColor: '#0D151D', border: '1px solid #2A3C4E', color: '#FFFFFF' }}
                  required
                />

                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setIsManualCategory(true);
                  }}
                  className="sm:col-span-3 px-3 py-3 rounded-2xl text-xs font-semibold focus:outline-none cursor-pointer"
                  style={{ backgroundColor: '#0D151D', border: '1px solid #2A3C4E', color: '#FFD166' }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.name} value={cat.name} style={{ backgroundColor: '#1A2836', color: '#FFFFFF' }}>
                      {cat.icon} {cat.name}
                    </option>
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
                    className="w-16 px-2 py-3 rounded-2xl text-center text-sm font-bold focus:outline-none"
                    style={{ backgroundColor: '#0D151D', border: '1px solid #2A3C4E', color: '#FFFFFF' }}
                  />

                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="flex-1 px-2 py-3 rounded-2xl text-xs font-semibold focus:outline-none cursor-pointer capitalize"
                    style={{ backgroundColor: '#0D151D', border: '1px solid #2A3C4E', color: '#20B2AA' }}
                  >
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u} style={{ backgroundColor: '#1A2836', color: '#FFFFFF' }}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="sm:col-span-2 font-bold py-3.5 rounded-2xl transition text-sm shadow-md active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: '#FF7B7B', color: '#131F2B' }}
                >
                  {loading ? 'Adding...' : 'Add Item'}
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.keys(groupedItems).length > 0 ? (
                Object.entries(groupedItems).map(([groupCategory, groupList]) => {
                  const categoryIcon = CATEGORIES.find((c) => c.name.toLowerCase() === groupCategory.toLowerCase())?.icon || '📦';

                  return (
                    <div 
                      key={groupCategory} 
                      className="rounded-[28px] p-5 space-y-3"
                      style={{ backgroundColor: '#131F2B', border: '1px solid #1E2E3D' }}
                    >
                      <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: '#233547' }}>
                        <span className="text-base">{categoryIcon}</span>
                        <span className="text-xs font-bold tracking-wider uppercase" style={{ color: '#FFD166' }}>
                          {groupCategory} ({groupList.length})
                        </span>
                      </div>

                      <div className="space-y-2">
                        {groupList.map((item) => {
                          const isEditing = editingId === item.id;
                          const productIcon = getItemIcon(item.name, item.category);

                          return (
                            <div
                              key={item.id}
                              className="rounded-[20px] p-3 transition"
                              style={{ backgroundColor: '#1A2836', border: '1px solid #233547' }}
                            >
                              {!isEditing ? (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div 
                                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                                      style={{ backgroundColor: '#0D151D', border: '1px solid #2A3C4E' }}
                                    >
                                      {productIcon}
                                    </div>
                                    <div>
                                      <h3 className="font-bold text-sm capitalize" style={{ color: '#FFFFFF' }}>
                                        {item.name}
                                      </h3>
                                      <p className="text-xs" style={{ color: '#8A9FB4' }}>
                                        {item.quantity} {item.unit}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => adjustQuantity(item, -1)}
                                      className="w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center"
                                      style={{ backgroundColor: '#0D151D', color: '#FF7B7B', border: '1px solid #2A3C4E' }}
                                    >
                                      -
                                    </button>
                                    <button
                                      onClick={() => adjustQuantity(item, 1)}
                                      className="w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center"
                                      style={{ backgroundColor: '#0D151D', color: '#20B2AA', border: '1px solid #2A3C4E' }}
                                    >
                                      +
                                    </button>
                                    <button
                                      onClick={() => startEditing(item)}
                                      className="p-1.5 text-xs ml-1"
                                      style={{ color: '#8A9FB4' }}
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => deleteItem(item.id)}
                                      className="p-1.5 text-xs"
                                      style={{ color: '#556A7E' }}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold capitalize">Edit: {item.name}</span>
                                    <button onClick={() => setEditingId(null)} className="text-xs" style={{ color: '#8A9FB4' }}>Cancel</button>
                                  </div>

                                  <div className="flex gap-2">
                                    <select
                                      value={editCategory}
                                      onChange={(e) => setEditCategory(e.target.value)}
                                      className="w-28 px-2 py-2 rounded-xl text-xs font-semibold focus:outline-none"
                                      style={{ backgroundColor: '#0D151D', border: '1px solid #20B2AA', color: '#FFD166' }}
                                    >
                                      {CATEGORIES.map((cat) => (
                                        <option key={cat.name} value={cat.name} style={{ backgroundColor: '#1A2836', color: '#FFFFFF' }}>
                                          {cat.icon} {cat.name}
                                        </option>
                                      ))}
                                    </select>

                                    <input
                                      type="number"
                                      step="any"
                                      min="0.01"
                                      value={editQuantity}
                                      onChange={(e) => setEditQuantity(e.target.value)}
                                      className="w-16 px-2 py-2 rounded-xl text-center text-xs font-bold focus:outline-none"
                                      style={{ backgroundColor: '#0D151D', border: '1px solid #20B2AA', color: '#FFFFFF' }}
                                    />

                                    <select
                                      value={editUnit}
                                      onChange={(e) => setEditUnit(e.target.value)}
                                      className="flex-1 px-2 py-2 rounded-xl text-xs font-semibold focus:outline-none capitalize"
                                      style={{ backgroundColor: '#0D151D', border: '1px solid #20B2AA', color: '#20B2AA' }}
                                    >
                                      {COMMON_UNITS.map((u) => (
                                        <option key={u} value={u} style={{ backgroundColor: '#1A2836', color: '#FFFFFF' }}>
                                          {u}
                                        </option>
                                      ))}
                                    </select>

                                    <button
                                      onClick={() => saveEdit(item.id)}
                                      className="px-3 py-2 rounded-xl text-xs font-bold"
                                      style={{ backgroundColor: '#20B2AA', color: '#0D151D' }}
                                    >
                                      Save
                                    </button>
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
                <p className="text-center text-xs py-6 col-span-full" style={{ color: '#6C8299' }}>No pantry items stored.</p>
              )}
            </div>
          </div>
        )}

        {/* RECIPES TAB */}
        {activeTab === 'recipes' && (
          <div className="space-y-6">
            <div 
              className="rounded-[28px] p-6 space-y-3"
              style={{ backgroundColor: '#131F2B', border: '1px solid #1E2E3D' }}
            >
              <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#20B2AA' }}>
                🌐 Import Recipe via Web URL
              </h2>

              <form onSubmit={handleImportRecipe} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  placeholder="Paste recipe URL (e.g. foodnetwork.com/...)"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-2xl text-xs focus:outline-none"
                  style={{ backgroundColor: '#0D151D', border: '1px solid #2A3C4E', color: '#FFFFFF' }}
                  required
                />

                <button
                  type="submit"
                  disabled={isImporting}
                  className="px-8 font-bold py-3.5 rounded-2xl transition text-sm shadow-md active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: '#FFD166', color: '#131F2B' }}
                >
                  {isImporting ? 'Scraping Recipe...' : 'Import to Library'}
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-bold tracking-wider uppercase px-1" style={{ color: '#6C8299' }}>
                Saved Recipes ({recipes.length})
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {recipes.map((recipe) => {
                  const match = getRecipePantryMatch(recipe);

                  return (
                    <div
                      key={recipe.id}
                      onClick={() => setSelectedRecipe(recipe)}
                      className="rounded-[24px] overflow-hidden cursor-pointer transition border hover:border-[#20B2AA] flex flex-col justify-between"
                      style={{ backgroundColor: '#131F2B', borderColor: '#1E2E3D' }}
                    >
                      {recipe.image && (
                        <div className="w-full h-40 overflow-hidden relative bg-black/20">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={recipe.image}
                            alt={recipe.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-base" style={{ color: '#FFFFFF' }}>
                              {recipe.title}
                            </h3>
                            <p className="text-xs mt-1" style={{ color: '#8A9FB4' }}>
                              ⏱️ {recipe.cook_time} • {recipe.category}
                            </p>
                          </div>

                          <button 
                            onClick={(e) => deleteRecipe(recipe.id, e)}
                            className="text-xs p-1 hover:text-white" 
                            style={{ color: '#556A7E' }}
                          >
                            ✕
                          </button>
                        </div>

                        <div className="flex justify-between items-center text-xs pt-3 border-t" style={{ borderColor: '#233547' }}>
                          <span style={{ color: '#8A9FB4' }}>{recipe.ingredients.length} Ingredients</span>
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
                  <p className="text-center text-xs py-6 col-span-full" style={{ color: '#6C8299' }}>No recipes saved yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RECIPE DETAIL MODAL */}
        {selectedRecipe && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 md:p-8 z-50">
            <div 
              className="w-full max-w-5xl rounded-[32px] overflow-hidden max-h-[90vh] flex flex-col"
              style={{ backgroundColor: '#131F2B', border: '1px solid #20B2AA' }}
            >
              {selectedRecipe.image && (
                <div className="w-full h-52 md:h-60 shrink-0 relative bg-black/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedRecipe.image}
                    alt={selectedRecipe.title}
                    className="w-full h-full object-cover"
                  />
                  <button 
                    onClick={() => setSelectedRecipe(null)}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center font-bold text-white text-base hover:bg-black/80 transition"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
                <div className="flex justify-between items-start border-b pb-4" style={{ borderColor: '#233547' }}>
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider" style={{ color: '#FFD166' }}>
                      {selectedRecipe.category}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold leading-snug">{selectedRecipe.title}</h2>
                    <p className="text-xs md:text-sm mt-1" style={{ color: '#8A9FB4' }}>⏱️ Cook time: {selectedRecipe.cook_time}</p>
                  </div>

                  {!selectedRecipe.image && (
                    <button 
                      onClick={() => setSelectedRecipe(null)}
                      className="w-9 h-9 rounded-full bg-black/30 flex items-center justify-center font-bold text-sm hover:bg-black/50 transition"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* LEFT: INGREDIENTS */}
                  <div className="md:col-span-4 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#20B2AA' }}>
                      Ingredients ({selectedRecipe.ingredients.length})
                    </h3>
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
                          <div 
                            key={i} 
                            className="flex justify-between items-center text-xs p-3 rounded-xl"
                            style={{ backgroundColor: '#1A2836' }}
                          >
                            <span style={{ color: status === 'in_stock' ? '#FFFFFF' : '#8A9FB4' }}>{ing}</span>
                            <span className="text-[10px] font-bold shrink-0 ml-2 px-2 py-0.5 rounded-md" style={{ color: badgeColor, backgroundColor: '#0D151D' }}>
                              {badgeText}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* RIGHT: INSTRUCTIONS */}
                  <div className="md:col-span-8 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#20B2AA' }}>
                      Method & Instructions
                    </h3>
                    {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 ? (
                      <div className="space-y-3 text-sm" style={{ color: '#D0E0F0' }}>
                        {selectedRecipe.instructions.map((step, idx) => (
                          <div key={idx} className="p-4 rounded-2xl space-y-1.5" style={{ backgroundColor: '#1A2836' }}>
                            <span className="font-bold text-xs uppercase" style={{ color: '#FFD166' }}>Step {idx + 1}</span>
                            <p className="leading-relaxed">{step}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs italic" style={{ color: '#6C8299' }}>No step-by-step instructions available.</p>
                    )}

                    {selectedRecipe.source_url && (
                      <a
                        href={selectedRecipe.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-5 py-3 rounded-2xl text-xs font-bold transition mt-4"
                        style={{ backgroundColor: '#0D151D', color: '#20B2AA', border: '1px solid #20B2AA' }}
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