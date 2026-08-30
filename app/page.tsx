'use client';

/* ==========================================================================
   1. IMPORTS, TYPES & CONSTANTS
   ========================================================================== */
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface PantryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  track_low_stock?: boolean;
  low_stock_threshold?: number;
  user_id?: string;
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
  user_id?: string;
}

interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
  quantity?: number;
  unit?: string;
  user_id?: string;
}

interface MealPlanItem {
  id: string;
  date: string;
  meal_type: string;
  recipe_id?: string;
  manual_name?: string;
  portions: number;
  recipes?: { title: string; image?: string; cook_time?: string; category?: string };
  user_id?: string;
}

const CATEGORIES = [
  { name: 'Produce' }, { name: 'Dairy & Eggs' }, { name: 'Meat & Seafood' },
  { name: 'Pantry Staples' }, { name: 'Bakery' }, { name: 'Frozen' },
  { name: 'Snacks' }, { name: 'Beverages' }, { name: 'Other' }
];

const COMMON_UNITS = ['pcs', 'kg', 'g', 'lbs', 'oz', 'ml', 'l', 'cups', 'tbsp', 'tsp', 'cans', 'packs'];

/* ==========================================================================
   2. HELPER FUNCTIONS
   ========================================================================== */
function scaleAndConvertIngredient(ingredient: string, multiplier: number, targetSystem: 'metric' | 'imperial'): string {
  let result = ingredient;
  if (multiplier !== 1) {
    result = result.replace(/^([\d.]+)/, (match) => {
      return (parseFloat(match) * multiplier).toFixed(2).replace(/\.?0+$/, ''); 
    });
  }

  const regex = /\b([\d.]+)\s*(g|kg|ml|l|oz|lbs|fl\s*oz|cup|cups)\b/gi;
  result = result.replace(regex, (match, numStr, unit) => {
    let num = parseFloat(numStr);
    let lowerUnit = unit.toLowerCase();
    if (targetSystem === 'imperial') {
      if (lowerUnit === 'g') { num *= 0.035274; lowerUnit = 'oz'; }
      else if (lowerUnit === 'kg') { num *= 2.20462; lowerUnit = 'lbs'; }
      else if (lowerUnit === 'ml') { num *= 0.033814; lowerUnit = 'fl oz'; }
      else if (lowerUnit === 'l') { num *= 4.22675; lowerUnit = 'cups'; }
    } else if (targetSystem === 'metric') {
      if (lowerUnit === 'oz') { num *= 28.3495; lowerUnit = 'g'; }
      else if (lowerUnit === 'lbs') { num *= 0.453592; lowerUnit = 'kg'; }
      else if (lowerUnit === 'fl oz') { num *= 29.5735; lowerUnit = 'ml'; }
      else if (lowerUnit === 'cup' || lowerUnit === 'cups') { num *= 236.588; lowerUnit = 'ml'; }
      if (lowerUnit === 'ml' && num >= 1000) { num /= 1000; lowerUnit = 'l'; }
      if (lowerUnit === 'g' && num >= 1000) { num /= 1000; lowerUnit = 'kg'; }
    }
    return `${num % 1 === 0 ? num.toString() : num.toFixed(1).replace(/\.0$/, '')} ${lowerUnit}`;
  });
  return result;
}

function getAisle(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('apple') || n.includes('banana') || n.includes('lettuce') || n.includes('tomato') || n.includes('lemon') || n.includes('onion') || n.includes('garlic') || n.includes('potato') || n.includes('carrot') || n.includes('berry') || n.includes('fruit') || n.includes('veg')) return 'Produce';
  if (n.includes('milk') || n.includes('cheese') || n.includes('egg') || n.includes('butter') || n.includes('yogurt') || n.includes('cream')) return 'Dairy & Chilled';
  if (n.includes('chicken') || n.includes('beef') || n.includes('pork') || n.includes('fish') || n.includes('salmon') || n.includes('steak') || n.includes('bacon') || n.includes('meat') || n.includes('sausage')) return 'Meat & Seafood';
  if (n.includes('bread') || n.includes('bagel') || n.includes('muffin') || n.includes('croissant') || n.includes('roll') || n.includes('bun') || n.includes('wrap')) return 'Bakery';
  if (n.includes('ice cream') || n.includes('pizza') || n.includes('frozen') || n.includes('peas')) return 'Frozen';
  if (n.includes('water') || n.includes('juice') || n.includes('soda') || n.includes('beer') || n.includes('wine') || n.includes('coffee') || n.includes('tea') || n.includes('drink')) return 'Beverages';
  if (n.includes('chips') || n.includes('crisps') || n.includes('popcorn') || n.includes('chocolate') || n.includes('candy') || n.includes('cookie') || n.includes('snack')) return 'Snacks';
  if (n.includes('pasta') || n.includes('rice') || n.includes('bean') || n.includes('sauce') || n.includes('oil') || n.includes('vinegar') || n.includes('spice') || n.includes('flour') || n.includes('sugar') || n.includes('can') || n.includes('noodle') || n.includes('curry')) return 'World Foods & Pantry';
  if (n.includes('soap') || n.includes('paper') || n.includes('clean') || n.includes('foil') || n.includes('trash') || n.includes('bag') || n.includes('wash')) return 'Household';
  return 'Other';
}

const getNext7Days = () => Array.from({ length: 7 }).map((_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d.toISOString().split('T')[0]; });

/* ==========================================================================
   3. MAIN COMPONENT & STATE MANAGEMENT
   ========================================================================== */
export default function PantryManager() {
  const supabase = createClient();
  const router = useRouter();

  // App & User State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pantry' | 'recipes' | 'shopping' | 'planner'>('dashboard');
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState('');
  const [items, setItems] = useState<PantryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Account Settings Modal
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Recipe Views & Layout State
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeViewMode, setRecipeViewMode] = useState<'grid' | 'list'>('grid');
  const [recipeDetailTab, setRecipeDetailTab] = useState<'ingredients' | 'instructions'>('ingredients');
  const [targetPortions, setTargetPortions] = useState(4);
  const [measurementSystem, setMeasurementSystem] = useState<'metric' | 'imperial'>('metric');
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
  const [recipeCategoryFilter, setRecipeCategoryFilter] = useState('All');
  
  // Recipe Editing & Import State
  const [isEditingRecipe, setIsEditingRecipe] = useState(false);
  const [editRecipeForm, setEditRecipeForm] = useState({ title: '', category: '', cook_time: '', portions: 4, image: '', ingredientsText: '', instructionsText: '' });
  const [showManualAddRecipe, setShowManualAddRecipe] = useState(false);
  const [showImportInput, setShowImportInput] = useState(false);
  const [showAddRecipeMenu, setShowAddRecipeMenu] = useState(false);
  const [manualRecipe, setManualRecipe] = useState({ title: '', category: 'Main Dish', cook_time: '30 mins', portions: 4, ingredientsText: '', instructionsText: '', image: '' });
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Pantry Add States
  const [showAddPantryMenu, setShowAddPantryMenu] = useState(false);
  const [showPantryInput, setShowPantryInput] = useState(false);
  const [name, useStateName] = useState('');
  const [category, setCategory] = useState('Produce');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [isManualCategory, setIsManualCategory] = useState(false);

  // Shopping List States
  const [showAddShoppingMenu, setShowAddShoppingMenu] = useState(false);
  const [showShoppingInput, setShowShoppingInput] = useState(false);
  const [shoppingInputName, setShoppingInputName] = useState('');
  const [shoppingInputQty, setShoppingInputQty] = useState('1');
  const [shoppingInputUnit, setShoppingInputUnit] = useState('pcs');
  
  // Advanced Voice Input States
  const [showVoiceInputScreen, setShowVoiceInputScreen] = useState(false);
  const [voiceContext, setVoiceContext] = useState<'shopping' | 'pantry'>('shopping');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceParsedItems, setVoiceParsedItems] = useState<{id: number, name: string, quantity: number, unit: string, category?: string}[]>([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Meal Planner State
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({});
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [recipePickerTarget, setRecipePickerTarget] = useState<{date: string, mealType: string} | null>(null);
  const [planTargetPortions, setPlanTargetPortions] = useState(4);
  const [allocationsGrid, setAllocationsGrid] = useState<Record<string, number>>({});
  const [manualInputs, setManualInputs] = useState<Record<string, string>>({});

  // Scanners & Inputs
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<any[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recipeFileInputRef = useRef<HTMLInputElement>(null);
  const recipeDropdownRef = useRef<HTMLDivElement>(null);
  const shoppingDropdownRef = useRef<HTMLDivElement>(null);
  const pantryDropdownRef = useRef<HTMLDivElement>(null);

  // Modals & Low Stock
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [showLowStockPage, setShowLowStockPage] = useState(false);
  const [itemToTrackId, setItemToTrackId] = useState('');
  const [newTrackName, setNewTrackName] = useState('');
  const [newTrackCategory, setNewTrackCategory] = useState('Produce');
  const [newTrackUnit, setNewTrackUnit] = useState('pcs');

  const next7Days = getNext7Days();
  const todayStr = new Date().toISOString().split('T')[0];

  /* ==========================================================================
     4. DATA FETCHING & EVENT LISTENERS
     ========================================================================== */
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      
      const uid = session.user.id;
      setUserId(uid);
      setUserEmail(session.user.email || '');

      const { data: pData } = await supabase.from('pantry_items').select('*').eq('user_id', uid).order('created_at', { ascending: false });
      if (pData) setItems(pData);
      
      const { data: rData } = await supabase.from('recipes').select('*').eq('user_id', uid).order('created_at', { ascending: false });
      if (rData) setRecipes(rData);
      
      const { data: sData } = await supabase.from('shopping_list').select('*').eq('user_id', uid).order('created_at', { ascending: false });
      if (sData) setShoppingList(sData);

      const today = new Date().toISOString().split('T')[0];
      const { data: mData } = await supabase.from('meal_plan').select('*, recipes(title, image, cook_time, category)').eq('user_id', uid).gte('date', today).order('date', { ascending: true });
      if (mData) setMealPlans(mData as MealPlanItem[]);
    };
    loadData();
  }, [router, supabase.auth]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (recipeDropdownRef.current && !recipeDropdownRef.current.contains(event.target as Node)) setShowAddRecipeMenu(false);
      if (shoppingDropdownRef.current && !shoppingDropdownRef.current.contains(event.target as Node)) setShowAddShoppingMenu(false);
      if (pantryDropdownRef.current && !pantryDropdownRef.current.contains(event.target as Node)) setShowAddPantryMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    window.history.replaceState({ tab: 'dashboard', type: 'tab' }, '', window.location.pathname);
    const handlePopState = (e: PopStateEvent) => {
      if (e.state) {
        setActiveTab(e.state.tab || 'dashboard');
        if (e.state.type === 'tab') { setSelectedRecipe(null); setShowLowStockPage(false); setIsEditingRecipe(false); } 
        else if (e.state.type === 'recipe') { setSelectedRecipe(e.state.recipe); setShowLowStockPage(false); setIsEditingRecipe(false); } 
        else if (e.state.type === 'lowstock') { setShowLowStockPage(true); setSelectedRecipe(null); setIsEditingRecipe(false); }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (tab: string) => {
    window.history.pushState({ tab, type: 'tab' }, '', `#${tab}`);
    setActiveTab(tab as any); setSelectedRecipe(null); setShowLowStockPage(false);
  };

  const handleOpenRecipe = (recipe: Recipe) => {
    window.history.pushState({ tab: activeTab, recipe, type: 'recipe' }, '', `#recipe-${recipe.id}`);
    setSelectedRecipe(recipe); setTargetPortions(recipe.portions || 4); setIsEditingRecipe(false); setRecipeDetailTab('ingredients'); window.scrollTo(0, 0);
  };

  const handleOpenLowStock = () => { window.history.pushState({ tab: activeTab, type: 'lowstock' }, '', `#lowstock`); setShowLowStockPage(true); };
  const handleBackNavigation = () => window.history.back();

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push('/login'); };

  const handleUpdateAccount = async () => {
    setLoading(true); const updates: any = {};
    if (newEmail) updates.email = newEmail; if (newPassword) updates.password = newPassword;
    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.auth.updateUser(updates);
      if (error) showToast(error.message);
      else { showToast("Account updated!"); setNewEmail(''); setNewPassword(''); setShowAccountModal(false); if (newEmail) setUserEmail(newEmail); }
    }
    setLoading(false);
  };

  /* ==========================================================================
     5. ADVANCED VOICE INPUT PARSING
     ========================================================================== */
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return showToast('Web Speech API not supported.');
    setVoiceTranscript(''); setVoiceParsedItems([]);
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      let fullText = '';
      for (let i = 0; i < event.results.length; i++) fullText += event.results[i][0].transcript + ' ';
      setVoiceTranscript(fullText.trim());
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  useEffect(() => {
    if (!isListening && voiceTranscript.trim() && voiceParsedItems.length === 0) parseVoiceInput(voiceTranscript);
  }, [isListening, voiceTranscript]);

  const parseVoiceInput = (textToParse: string) => {
    if (!textToParse.trim()) return;
    const numberMap: Record<string, string> = { 'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10', 'a': '1', 'an': '1' };
    let cleanText = textToParse.toLowerCase();
    Object.keys(numberMap).forEach(word => { cleanText = cleanText.replace(new RegExp(`\\b${word}\\b`, 'g'), numberMap[word]); });
    
    const rawItems = cleanText.split(/\s+and\s+|,|\s+plus\s+/i).map(s => s.trim()).filter(Boolean);
    const parsed = rawItems.map((itemStr, idx) => {
      let cleanedItemStr = itemStr.replace(/\b(of|some)\b/g, '').replace(/\s+/g, ' ').trim();
      const regex = /^([\d.]+)?\s*(?:\b(kg|g|lbs|oz|ml|l|cups|tbsp|tsp|cans|packs|pcs|grams|kilograms|liters|milliliters)\b)?\s*(.*)$/i;
      const match = cleanedItemStr.match(regex);
      
      let qty = 1; let unit = 'pcs'; let parsedName = cleanedItemStr;
      if (match) {
        if (match[1]) qty = parseFloat(match[1]);
        if (match[2]) {
          const rawUnit = match[2].toLowerCase();
          if (rawUnit === 'grams') unit = 'g'; else if (rawUnit === 'kilograms') unit = 'kg'; else if (rawUnit === 'liters') unit = 'l'; else if (rawUnit === 'milliliters') unit = 'ml'; else unit = rawUnit;
        }
        if (match[3]) parsedName = match[3];
      }
      if (unit === 'pcs') {
        if (parsedName.includes('milk') || parsedName.includes('water')) unit = 'ml';
        if (parsedName.includes('flour') || parsedName.includes('sugar') || parsedName.includes('rice')) unit = 'g';
      }
      parsedName = parsedName.charAt(0).toUpperCase() + parsedName.slice(1);

      let predictedCategory = 'Produce';
      const aisle = getAisle(parsedName);
      if (aisle.includes('Dairy')) predictedCategory = 'Dairy & Eggs'; else if (aisle.includes('Meat')) predictedCategory = 'Meat & Seafood'; else if (aisle.includes('Bakery')) predictedCategory = 'Bakery'; else if (aisle.includes('Frozen')) predictedCategory = 'Frozen'; else if (aisle.includes('Beverages')) predictedCategory = 'Beverages'; else if (aisle.includes('Snacks')) predictedCategory = 'Snacks'; else if (aisle.includes('World') || aisle.includes('Pantry')) predictedCategory = 'Pantry Staples'; else predictedCategory = 'Other';

      return { id: Date.now() + idx, name: parsedName.trim(), quantity: qty, unit, category: predictedCategory };
    });
    setVoiceParsedItems(parsed);
  };

  const updateVoiceItem = (index: number, field: string, value: string | number) => {
    setVoiceParsedItems(prev => { const updated = [...prev]; updated[index] = { ...updated[index], [field]: value }; return updated; });
  };

  const removeVoiceItem = (index: number) => setVoiceParsedItems(prev => prev.filter((_, i) => i !== index));

  const commitVoiceItems = async () => {
    if (voiceParsedItems.length === 0) return;
    setLoading(true);
    if (voiceContext === 'shopping') {
      const inserts = voiceParsedItems.map(item => ({ name: item.name, quantity: item.quantity, unit: item.unit, user_id: userId }));
      const { data } = await supabase.from('shopping_list').insert(inserts).select();
      if (data) { setShoppingList(prev => [...data, ...prev]); showToast('Items added to shopping list!'); }
    } else {
      const inserts = voiceParsedItems.map(item => ({ name: item.name, category: item.category || 'Other', quantity: item.quantity, unit: item.unit, track_low_stock: false, low_stock_threshold: 1, user_id: userId }));
      const { data } = await supabase.from('pantry_items').insert(inserts).select();
      if (data) { setItems(prev => [...data, ...prev]); showToast('Items added to pantry!'); }
    }
    setVoiceParsedItems([]); setVoiceTranscript(''); setShowVoiceInputScreen(false); setLoading(false);
  };

  /* ==========================================================================
     6. CRUD HANDLERS (Pantry, Recipes, Shopping, Meal Planner)
     ========================================================================== */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; useStateName(val);
    if (!isManualCategory && val.length > 2) {
      const lower = val.toLowerCase();
      if (lower.includes('milk') || lower.includes('cheese') || lower.includes('egg')) setCategory('Dairy & Eggs');
      else if (lower.includes('apple') || lower.includes('lettuce') || lower.includes('berry')) setCategory('Produce');
      else if (lower.includes('steak') || lower.includes('chicken') || lower.includes('fish')) setCategory('Meat & Seafood');
    }
  };

  const handleNewTrackNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; setNewTrackName(val);
    if (val.length > 2) {
      const lower = val.toLowerCase();
      if (lower.includes('milk') || lower.includes('cheese') || lower.includes('egg')) setNewTrackCategory('Dairy & Eggs');
      else if (lower.includes('apple') || lower.includes('lettuce') || lower.includes('berry')) setNewTrackCategory('Produce');
      else if (lower.includes('steak') || lower.includes('chicken') || lower.includes('fish')) setNewTrackCategory('Meat & Seafood');
    }
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault(); if (!name.trim()) return;
    setLoading(true);
    const { data } = await supabase.from('pantry_items').insert([{ name: name.trim(), category, quantity: parseFloat(quantity) || 1, unit, track_low_stock: false, low_stock_threshold: 1, user_id: userId }]).select().single();
    if (data) setItems(prev => [data, ...prev]);
    useStateName(''); setQuantity('1'); setIsManualCategory(false); setLoading(false);
  };

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setIsScanning(true);
    const formData = new FormData(); formData.append('receipt', file);
    try {
      const res = await fetch('/api/scan-receipt', { method: 'POST', body: formData }); const data = await res.json();
      if (data.items && data.items.length > 0) setScannedItems(data.items); else showToast(data.message || 'Could not find items.');
    } catch { showToast('Failed to read receipt.'); }
    if (fileInputRef.current) fileInputRef.current.value = ''; setIsScanning(false);
  };

  const updateScannedItem = (index: number, field: string, value: string | number) => {
    setScannedItems(prev => { if (!prev) return prev; const updated = [...prev]; updated[index] = { ...updated[index], [field]: value }; return updated; });
  };
  const removeScannedItem = (index: number) => setScannedItems(prev => prev ? prev.filter((_, i) => i !== index) : prev);

  const commitScannedItems = async () => {
    if (!scannedItems || scannedItems.length === 0) return setScannedItems(null);
    setLoading(true);
    const inserts = scannedItems.map(item => ({ ...item, track_low_stock: false, low_stock_threshold: 1, user_id: userId }));
    const { data, error } = await supabase.from('pantry_items').insert(inserts).select();
    if (!error && data) { setItems(prev => [...data, ...prev]); showToast(`Added ${data.length} items to pantry!`); setScannedItems(null); } 
    else showToast('Failed to save items.');
    setLoading(false);
  };

  const handleRecipeScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; showToast('Screenshot import feature coming soon!'); if (recipeFileInputRef.current) recipeFileInputRef.current.value = '';
  };

  const deleteItem = async (id: string) => { setItems(prev => prev.filter(item => item.id !== id)); await supabase.from('pantry_items').delete().eq('id', id).eq('user_id', userId); };
  
  const adjustQuantity = async (item: PantryItem, delta: number) => {
    const newQty = Math.max(0, Number((item.quantity + delta).toFixed(2)));
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));
    await supabase.from('pantry_items').update({ quantity: newQty }).eq('id', item.id).eq('user_id', userId);
  };

  const startEditing = (item: PantryItem) => { setEditingId(item.id); setEditCategory(item.category); setEditQuantity(item.quantity.toString()); setEditUnit(item.unit); };

  const saveEdit = async (id: string) => {
    const updatedItem = { category: editCategory, quantity: parseFloat(editQuantity) || 0, unit: editUnit };
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updatedItem } : item));
    setEditingId(null); await supabase.from('pantry_items').update(updatedItem).eq('id', id).eq('user_id', userId);
  };

  const enableTrackingForId = async (id: string) => {
    if (!id) return; setItems(prev => prev.map(i => i.id === id ? { ...i, track_low_stock: true, low_stock_threshold: 1 } : i));
    await supabase.from('pantry_items').update({ track_low_stock: true, low_stock_threshold: 1 }).eq('id', id).eq('user_id', userId); setItemToTrackId('');
  };

  const disableTrackingForId = async (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, track_low_stock: false } : i)); await supabase.from('pantry_items').update({ track_low_stock: false }).eq('id', id).eq('user_id', userId);
  };

  const updateLowStockThreshold = async (id: string, threshold: number) => {
    const val = Math.max(0, threshold); setItems(prev => prev.map(i => i.id === id ? { ...i, low_stock_threshold: val } : i));
    await supabase.from('pantry_items').update({ low_stock_threshold: val }).eq('id', id).eq('user_id', userId);
  };

  const addNewTrackedItem = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newTrackName.trim()) return; setLoading(true);
    const { data } = await supabase.from('pantry_items').insert([{ name: newTrackName.trim(), category: newTrackCategory, quantity: 0, unit: newTrackUnit, track_low_stock: true, low_stock_threshold: 1, user_id: userId }]).select().single();
    if (data) setItems(prev => [data, ...prev]); setNewTrackName(''); setLoading(false);
  };

  const handleImportRecipe = async (e: React.FormEvent) => {
    e.preventDefault(); if (!importUrl) return; setIsImporting(true);
    try {
      const res = await fetch('/api/scrape-recipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: importUrl }) });
      const data = await res.json();
      if (res.ok && data.title) {
        const { data: insertedData } = await supabase.from('recipes').insert([{ ...data, portions: 4, user_id: userId }]).select().single();
        if (insertedData) { setRecipes(prev => [insertedData, ...prev]); showToast('Recipe imported!'); setShowImportInput(false); }
      } else showToast(data.error || 'Could not extract a recipe.');
    } catch { showToast('Failed to import recipe.'); }
    setImportUrl(''); setIsImporting(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setFormState: Function) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onloadend = () => { setFormState((prev: any) => ({ ...prev, image: reader.result as string })); }; reader.readAsDataURL(file);
  };

  const saveManualRecipe = async () => {
    if (!manualRecipe.title.trim()) return showToast("Add a recipe title."); setLoading(true);
    const cleanedIngredients = manualRecipe.ingredientsText.split('\n').map(i => i.trim()).filter(i => i !== '');
    const cleanedInstructions = manualRecipe.instructionsText.split('\n').map(i => i.trim()).filter(i => i !== '');
    const newRecipe = { title: manualRecipe.title.trim(), category: manualRecipe.category, cook_time: manualRecipe.cook_time, portions: manualRecipe.portions, image: manualRecipe.image, ingredients: cleanedIngredients, instructions: cleanedInstructions, user_id: userId };
    const { data, error } = await supabase.from('recipes').insert([newRecipe]).select().single();
    if (!error && data) { setRecipes(prev => [data, ...prev]); setShowManualAddRecipe(false); setManualRecipe({ title: '', category: 'Main Dish', cook_time: '30 mins', portions: 4, ingredientsText: '', instructionsText: '', image: '' }); showToast('Recipe created!'); } 
    setLoading(false);
  };

  const startEditingRecipe = () => {
    if (!selectedRecipe) return;
    setEditRecipeForm({ title: selectedRecipe.title, category: selectedRecipe.category || 'Other', cook_time: selectedRecipe.cook_time || '', portions: selectedRecipe.portions || 4, image: selectedRecipe.image || '', ingredientsText: selectedRecipe.ingredients.join('\n'), instructionsText: selectedRecipe.instructions?.join('\n') || '' });
    setIsEditingRecipe(true);
  };

  const saveEditedRecipe = async () => {
    if (!selectedRecipe || !editRecipeForm.title.trim()) return showToast("Recipe title cannot be empty."); setLoading(true);
    const cleanedIngredients = editRecipeForm.ingredientsText.split('\n').map(i => i.trim()).filter(i => i !== '');
    const cleanedInstructions = editRecipeForm.instructionsText.split('\n').map(i => i.trim()).filter(i => i !== '');
    const updatedData = { title: editRecipeForm.title.trim(), category: editRecipeForm.category, cook_time: editRecipeForm.cook_time, portions: editRecipeForm.portions, image: editRecipeForm.image, ingredients: cleanedIngredients, instructions: cleanedInstructions };
    const { data, error } = await supabase.from('recipes').update(updatedData).eq('id', selectedRecipe.id).eq('user_id', userId).select().single();
    if (!error && data) { setRecipes(prev => prev.map(r => r.id === data.id ? data : r)); setSelectedRecipe(data); setIsEditingRecipe(false); showToast('Recipe updated!'); }
    setLoading(false);
  };

  const deleteRecipe = async (id: string, e: React.MouseEvent) => { e.stopPropagation(); setRecipes(prev => prev.filter(r => r.id !== id)); await supabase.from('recipes').delete().eq('id', id).eq('user_id', userId); showToast('Recipe deleted.'); };

  const startDistribution = () => { setPlanTargetPortions(targetPortions); setAllocationsGrid({}); setShowDistributionModal(true); };

  const handlePickRecipeForPlanner = (recipe: Recipe) => {
    if (!recipePickerTarget) return;
    setSelectedRecipe(recipe);
    setTargetPortions(recipe.portions || 4);
    setPlanTargetPortions(recipe.portions || 4);
    const key = `${recipePickerTarget.date}|${recipePickerTarget.mealType}`;
    setAllocationsGrid({ [key]: 1 });
    setRecipePickerTarget(null);
    setShowDistributionModal(true);
  };

  const handleAllocate = (dateStr: string, mealType: string, delta: number) => {
    const key = `${dateStr}|${mealType}`; const current = allocationsGrid[key] || 0;
    if (delta > 0 && remainingPortions <= 0) return; if (delta < 0 && current <= 0) return;
    setAllocationsGrid(prev => ({ ...prev, [key]: current + delta }));
  };

  const saveMealPlan = async () => {
    if (!selectedRecipe) return;
    if (remainingPortions !== 0) return showToast(`Allocate exactly ${planTargetPortions} portions.`); setLoading(true);
    const inserts = Object.entries(allocationsGrid).filter(([_, qty]) => qty > 0).map(([key, qty]) => { const [date, meal_type] = key.split('|'); return { date, meal_type, recipe_id: selectedRecipe.id, portions: qty, user_id: userId }; });
    const { data } = await supabase.from('meal_plan').insert(inserts).select('*, recipes(title)');
    if (data) { setMealPlans(prev => [...prev, ...(data as MealPlanItem[])]); showToast('Meals added to planner!'); setShowDistributionModal(false); }
    setLoading(false);
  };

  const saveManualMeal = async (date: string, mealType: string) => {
    const key = `${date}-${mealType}`; const value = manualInputs[key];
    if (!value || !value.trim()) return;
    const { data } = await supabase.from('meal_plan').insert([{ date, meal_type: mealType, manual_name: value.trim(), portions: 1, user_id: userId }]).select('*, recipes(title)').single();
    if (data) { setMealPlans(prev => [...prev, data as MealPlanItem]); setManualInputs(prev => ({ ...prev, [key]: '' })); }
  };

  const deleteMealPlan = async (id: string) => { setMealPlans(prev => prev.filter(m => m.id !== id)); await supabase.from('meal_plan').delete().eq('id', id).eq('user_id', userId); };

  const handleAddShoppingItem = async (e: React.FormEvent) => {
    e.preventDefault(); if (!shoppingInputName.trim()) return;
    const { data } = await supabase.from('shopping_list').insert([{ name: shoppingInputName.trim(), quantity: parseFloat(shoppingInputQty) || 1, unit: shoppingInputUnit, user_id: userId }]).select().single();
    if (data) setShoppingList(prev => [data, ...prev]); 
    setShoppingInputName(''); setShoppingInputQty('1'); setShoppingInputUnit('pcs');
  };

  const toggleShoppingItem = async (id: string) => {
    const item = shoppingList.find(i => i.id === id); if (!item) return;
    setShoppingList(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
    await supabase.from('shopping_list').update({ checked: !item.checked }).eq('id', id).eq('user_id', userId);
  };

  const deleteShoppingItem = async (id: string) => { setShoppingList(prev => prev.filter(item => item.id !== id)); await supabase.from('shopping_list').delete().eq('id', id).eq('user_id', userId); };

  /* ==========================================================================
     7. COMPUTED DATA FOR RENDERING
     ========================================================================== */
  const trackedItemsList = items.filter(i => i.track_low_stock);
  const untrackedItemsList = items.filter(i => !i.track_low_stock);
  const lowStockItems = trackedItemsList.filter(i => i.quantity <= (i.low_stock_threshold || 1));
  const todaysMeals = mealPlans.filter(m => m.date === todayStr);
  const uniqueRecipeCategories = ['All', ...Array.from(new Set(recipes.map(r => r.category).filter(Boolean)))];
  
  const filteredRecipes = recipes.filter(r => 
    r.title.toLowerCase().includes(recipeSearchQuery.toLowerCase()) && 
    (recipeCategoryFilter === 'All' || r.category === recipeCategoryFilter)
  );
  
  const groupedItems = items.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || []; acc[item.category].push(item); return acc;
  }, {} as Record<string, PantryItem[]>);

  const groupedShoppingList = shoppingList.reduce((acc, item) => {
    const aisle = getAisle(item.name);
    acc[aisle] = acc[aisle] || []; acc[aisle].push(item); return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const getIngredientStatus = (ingredient: string, pantry: PantryItem[]) => {
    const lowerIng = ingredient.toLowerCase(); const match = pantry.find(p => lowerIng.includes(p.name.toLowerCase()));
    if (!match) return { status: 'missing', requiredText: '1', availableText: '0' };
    if (match.quantity <= 0) return { status: 'insufficient', requiredText: '1', availableText: '0' };
    return { status: 'in_stock', requiredText: '1', availableText: `${match.quantity} ${match.unit}` };
  };

  const addLowStockToShopping = async () => {
    const newItems = lowStockItems.map(item => ({ name: `${item.name} (Restock)`, user_id: userId }));
    if (newItems.length === 0) return;
    const { data } = await supabase.from('shopping_list').insert(newItems).select();
    if (data) { setShoppingList(prev => [...data, ...prev]); showToast('Added to shopping list!'); }
  };

  const addMissingRecipeIngredients = async (recipe: Recipe, currentMultiplier: number) => {
    const missing = recipe.ingredients.map(ing => scaleAndConvertIngredient(ing, currentMultiplier, measurementSystem)).filter(scaledIng => getIngredientStatus(scaledIng, items).status !== 'in_stock');
    if (missing.length === 0) return showToast('You already have all ingredients!');
    const { data } = await supabase.from('shopping_list').insert(missing.map(name => ({ name, user_id: userId }))).select();
    if (data) { setShoppingList(prev => [...data, ...prev]); showToast('Missing ingredients added!'); }
  };

  const multiplier = selectedRecipe ? (targetPortions / (selectedRecipe.portions || 4)) : 1;
  const totalAllocated = Object.values(allocationsGrid).reduce((a, b) => a + b, 0);
  const remainingPortions = planTargetPortions - totalAllocated;

  /* ==========================================================================
     8. MAIN RENDER WRAPPER (Handles Modals & Layout Stability)
     ========================================================================== */
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[url('/background.jpg')] bg-cover bg-center bg-fixed text-black p-4 pb-28 md:p-8 md:pb-8 font-montserrat">
      
      {/* Hidden Global Elements */}
      <datalist id="common-units">{COMMON_UNITS.map(u => <option key={u} value={u} />)}</datalist>
      <input type="file" accept="image/*" ref={recipeFileInputRef} className="hidden" onChange={handleRecipeScreenshot} />
      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleScanReceipt} />

      {/* --- GLOBAL TOAST NOTIFICATION --- */}
      {toast && (
        <div className="fixed inset-x-0 top-10 flex items-center justify-center z-[100] px-4 pointer-events-none">
          <div className="bg-black text-white px-6 py-4 rounded-2xl shadow-2xl font-bold text-center animate-in fade-in slide-in-from-top-4 pointer-events-auto">
            {toast}
          </div>
        </div>
      )}

      {/* --- MODAL: SCANNED RECEIPT REVIEW --- */}
      {scannedItems && scannedItems.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
           <div className="bg-white rounded-[32px] w-full max-w-2xl p-6 md:p-8 flex flex-col max-h-[90vh] animate-in zoom-in-95">
             <h2 className="text-2xl font-bold mb-4">Review Scanned Items</h2>
             <div className="overflow-y-auto flex-1 space-y-3 pr-2">
               {scannedItems.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 bg-black/5 p-3 rounded-2xl">
                    <input value={item.name} onChange={e => updateScannedItem(index, 'name', e.target.value)} className="flex-1 px-3 py-2 rounded-xl focus:outline-none placeholder:text-black/50" placeholder="Item Name" />
                    <div className="flex gap-2">
                      <input type="number" step="any" value={item.quantity || 1} onChange={e => updateScannedItem(index, 'quantity', e.target.value)} className="w-16 px-2 py-2 rounded-xl text-center focus:outline-none" />
                      <select value={item.unit || 'pcs'} onChange={e => updateScannedItem(index, 'unit', e.target.value)} className="w-20 px-2 py-2 rounded-xl focus:outline-none capitalize">
                        {COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <select value={item.category || 'Other'} onChange={e => updateScannedItem(index, 'category', e.target.value)} className="w-full sm:w-28 px-2 py-2 rounded-xl focus:outline-none">
                      {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                    <button onClick={() => removeScannedItem(index)} className="px-3 py-2 bg-red-500/80 text-white rounded-xl font-bold hover:bg-red-500 transition">✕</button>
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

      {/* --- MODAL: MEAL DISTRIBUTION PLANNER --- */}
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
                <div className="flex justify-between items-center mb-4 px-1">
                  <span className="font-semibold text-black/70 uppercase tracking-wider text-sm">Tap to Assign Portions</span>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${remainingPortions === 0 ? 'bg-[#6B705C] text-white' : 'bg-amber-200 text-amber-900'}`}>{remainingPortions} remaining</span>
                </div>
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
                                        <span key={m.id} className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded text-center leading-tight truncate w-full" title={`${m.recipe_id ? m.recipes?.title : m.manual_name} (${m.portions})`}>
                                          {m.portions}x {m.recipe_id ? m.recipes?.title : m.manual_name}
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
              <button onClick={saveMealPlan} disabled={remainingPortions !== 0 || loading} className="w-full py-4 rounded-2xl font-bold text-lg bg-black text-white hover:bg-black/80 disabled:opacity-50 transition shadow-sm">
                {loading ? 'Saving...' : remainingPortions === 0 ? 'Confirm Meal Plan' : `Allocate exactly ${planTargetPortions} portions`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: MANUAL RECIPE BUILDER --- */}
      {showManualAddRecipe && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="w-full max-w-4xl rounded-[32px] p-6 md:p-8 bg-white border border-black/20 text-black shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-4 border-black/10 mb-6 shrink-0">
              <h2 className="text-2xl font-bold">Create Recipe</h2>
              <button onClick={() => setShowManualAddRecipe(false)} className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 text-black font-bold">✕</button>
            </div>
            <div className="overflow-y-auto pr-2 space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Title</label>
                  <input type="text" value={manualRecipe.title} onChange={e => setManualRecipe({...manualRecipe, title: e.target.value})} className="w-full p-3 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm" placeholder="e.g. Grandma's Lasagna" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Category</label>
                  <input type="text" value={manualRecipe.category} onChange={e => setManualRecipe({...manualRecipe, category: e.target.value})} className="w-full p-3 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm" placeholder="e.g. Main Dish" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Cook Time</label>
                  <input type="text" value={manualRecipe.cook_time} onChange={e => setManualRecipe({...manualRecipe, cook_time: e.target.value})} className="w-full p-3 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm" placeholder="e.g. 45 mins" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Portions</label>
                  <input type="number" value={manualRecipe.portions} onChange={e => setManualRecipe({...manualRecipe, portions: parseInt(e.target.value) || 1})} className="w-full p-3 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm" />
                </div>
              </div>

              <div className="space-y-1.5 mt-6">
                <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Ingredients</label>
                <textarea 
                  value={manualRecipe.ingredientsText} 
                  onChange={e => setManualRecipe({...manualRecipe, ingredientsText: e.target.value})} 
                  className="w-full p-4 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm min-h-[150px]" 
                  placeholder="Paste one or multiple ingredients (each on a new line)..." 
                />
                <p className="text-xs text-black/50">Press Enter for a new ingredient.</p>
              </div>

              <div className="space-y-1.5 mt-6">
                <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Instructions</label>
                <textarea 
                  value={manualRecipe.instructionsText} 
                  onChange={e => setManualRecipe({...manualRecipe, instructionsText: e.target.value})} 
                  className="w-full p-4 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm min-h-[150px]" 
                  placeholder="Paste one or multiple steps (each on a new line)..." 
                />
                <p className="text-xs text-black/50">Press Enter for a new step.</p>
              </div>
            </div>
            <div className="pt-6 mt-4 border-t border-black/10 shrink-0 flex gap-3">
               <button onClick={() => setShowManualAddRecipe(false)} className="flex-1 py-4 rounded-2xl font-bold text-lg border border-black/20 bg-transparent text-black hover:bg-black/5 transition">Cancel</button>
               <button onClick={saveManualRecipe} disabled={loading} className="flex-1 py-4 rounded-2xl font-bold text-lg bg-black text-white hover:bg-black/80 disabled:opacity-50 transition shadow-sm">
                {loading ? 'Saving...' : 'Save Recipe'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: ADD SAVED RECIPE PICKER (Meal Planner) --- */}
      {recipePickerTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
          <div className="w-full max-w-lg rounded-[32px] p-6 bg-white border border-black/20 shadow-2xl flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl">Select a Recipe</h3>
              <button onClick={() => setRecipePickerTarget(null)} className="text-black/50 hover:text-black font-bold text-xl">✕</button>
            </div>
            <div className="overflow-y-auto flex flex-col gap-3 pr-2 flex-1">
              {recipes.length === 0 ? <p className="text-sm text-black/50 text-center py-4">No saved recipes found.</p> : recipes.map(r => (
                <div key={r.id} onClick={() => handlePickRecipeForPlanner(r)} className="flex items-center gap-4 p-3 rounded-[24px] bg-white border border-black/10 shadow-sm cursor-pointer hover:shadow-md transition">
                  {r.image ? (
                    <img src={r.image} alt={r.title} className="w-16 h-16 rounded-[16px] object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-[16px] bg-[#6B705C]/10 flex items-center justify-center shrink-0 border border-black/5"><span className="text-[10px] font-semibold text-black/40">No Img</span></div>
                  )}
                  <div className="flex-1 min-w-0">
                     <h4 className="font-bold text-base text-black truncate">{r.title}</h4>
                     <p className="text-xs text-black/60 truncate">{r.cook_time} &bull; {r.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: ACCOUNT SETTINGS --- */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[90]">
          <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-2xl w-full max-w-md border border-black/10 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Account Settings</h2>
              <button onClick={() => setShowAccountModal(false)} className="text-black/40 hover:text-black font-bold">✕</button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-black/50 block mb-1">Current Account</label>
                <div className="px-4 py-3 bg-black/5 rounded-2xl font-medium text-black">{userEmail}</div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold uppercase tracking-wider text-black/80">Change Email</label>
                <input type="email" placeholder="New email address..." value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-white border border-black/20 focus:outline-none focus:border-[#6B705C] shadow-sm" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold uppercase tracking-wider text-black/80">Change Password</label>
                <input type="password" placeholder="New password..." value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-white border border-black/20 focus:outline-none focus:border-[#6B705C] shadow-sm" />
              </div>

              <button onClick={handleUpdateAccount} disabled={loading || (!newEmail && !newPassword)} className="w-full py-3.5 bg-[#6B705C] text-white rounded-2xl font-bold shadow-sm hover:bg-[#5a5f4d] disabled:opacity-50 transition">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>

              <div className="border-t border-black/10 pt-6 mt-4">
                <button onClick={handleSignOut} className="w-full py-3.5 bg-red-50 text-red-800 border border-red-200 rounded-2xl font-bold hover:bg-red-100 transition">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SCREENS THAT HIDE MAIN CONTENT --- */}
      {showVoiceInputScreen && (
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <div className="bg-[#6B705C] p-6 md:p-8 rounded-[32px] shadow-2xl w-full max-w-2xl flex flex-col gap-6 text-white border border-black/10 animate-in fade-in zoom-in-95">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">Voice Entry</h2>
              <p className="text-white/80 text-sm">Say something like: "3 bananas and 200g of flour"</p>
            </div>
            
            <div className="flex justify-center mt-2">
              <button 
                onClick={toggleListening}
                className={`px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all shadow-sm ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-black text-white hover:bg-black/80'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                {isListening ? 'Tap to Stop...' : 'Tap to Speak'}
              </button>
            </div>

            {voiceParsedItems.length > 0 && (
              <div className="flex flex-col gap-3 mt-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80 border-b border-white/20 pb-2 mb-2">Review Items</h3>
                {voiceParsedItems.map((item, index) => (
                  <div key={item.id} className="flex flex-row items-center gap-2 bg-white/10 p-2 rounded-2xl w-full">
                    <input value={item.name} onChange={e => updateVoiceItem(index, 'name', e.target.value)} className="flex-1 min-w-[80px] bg-white text-black px-2 py-2 rounded-xl text-sm focus:outline-none placeholder:text-black/50" placeholder="Item Name" />
                    <input type="number" step="any" value={item.quantity} onChange={e => updateVoiceItem(index, 'quantity', e.target.value)} className="w-12 bg-white text-black px-1 py-2 rounded-xl text-sm text-center focus:outline-none" />
                    <select value={item.unit} onChange={e => updateVoiceItem(index, 'unit', e.target.value)} className="w-[70px] bg-white text-black px-1 py-2 rounded-xl text-sm focus:outline-none capitalize">
                      {COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    {voiceContext === 'pantry' && (
                      <select value={item.category} onChange={e => updateVoiceItem(index, 'category', e.target.value)} className="w-24 hidden sm:block bg-white text-black px-2 py-2 rounded-xl text-sm focus:outline-none">
                        {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                    )}
                    <button onClick={() => removeVoiceItem(index)} className="w-8 h-8 shrink-0 flex items-center justify-center bg-red-500/80 text-white rounded-xl font-bold hover:bg-red-500 transition">✕</button>
                  </div>
                ))}
                <button onClick={commitVoiceItems} disabled={loading} className="w-full py-4 mt-4 bg-black text-white rounded-2xl font-bold hover:bg-black/80 shadow-sm transition">
                  {loading ? 'Saving...' : `Confirm & Add to ${voiceContext === 'shopping' ? 'List' : 'Pantry'}`}
                </button>
              </div>
            )}

            <div className="border-t border-white/20 pt-4 mt-2">
              <button onClick={() => { setShowVoiceInputScreen(false); setVoiceParsedItems([]); setVoiceTranscript(''); }} className="w-full py-3 bg-transparent text-white font-bold hover:bg-white/10 rounded-2xl transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- STANDARD MAIN VIEWS --- */}
      {!showVoiceInputScreen && (
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* DESKTOP HEADER & NAVIGATION */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-black/10">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <div className="flex items-center gap-3 md:gap-4">
                <img src="/logo.png" alt="Pantreasy Logo" className="w-[72px] h-[72px] md:w-20 md:h-20 object-contain shrink-0 mix-blend-multiply" />
                <div>
                  <h1 className="text-4xl md:text-6xl font-mogena tracking-tight text-black mt-1">Pantreasy</h1>
                  <p className="text-sm md:text-base text-black/70 mt-1 font-normal hidden md:block">Keep track of your ingredients & dinner plans</p>
                </div>
              </div>
              
              <button onClick={() => setShowAccountModal(true)} className="md:hidden text-black hover:opacity-70 transition p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </button>
            </div>
            
            <nav className="hidden md:flex flex-wrap items-center gap-1 p-1.5">
              {[{ id: 'dashboard', label: 'Dashboard' }, { id: 'pantry', label: 'Pantry' }, { id: 'recipes', label: 'Recipes' }, { id: 'shopping', label: 'Shopping List' }, { id: 'planner', label: 'Planner' }].map((tab) => (
                <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`px-4 py-2 rounded-xl text-sm transition ${activeTab === tab.id ? 'bg-black text-white font-medium' : 'text-black/80 hover:text-black font-normal'}`}>
                  {tab.label}
                </button>
              ))}
              <div className="w-px h-6 bg-black/20 mx-1"></div>
              
              <button onClick={() => setShowAccountModal(true)} className="px-3 py-2 text-black hover:opacity-70 transition flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </button>
            </nav>
          </header>

          {/* DYNAMIC CONTENT ROUTING */}
          {showLowStockPage && !selectedRecipe ? (
            
            /* --- LOW STOCK SCREEN --- */
            <div className="space-y-6">
              <button onClick={handleBackNavigation} className="flex items-center gap-2 text-black/70 hover:text-black font-semibold transition">
                &larr; Back to Dashboard
              </button>
              
              <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-black/10">
                <div className="bg-[#6B705C] text-white p-6 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h2 className="text-4xl md:text-5xl font-bold leading-snug">Low Stock Management</h2>
                    <p className="text-white/80 text-sm mt-2 font-medium">Set thresholds to trigger alerts when essential items run low.</p>
                  </div>
                  <button onClick={addLowStockToShopping} disabled={lowStockItems.length === 0} className="px-5 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/80 transition disabled:opacity-50 shadow-sm shrink-0">
                    + Restock Alerts to List
                  </button>
                </div>

                <div className="p-6 md:p-10 space-y-10">
                  <div className="bg-black/5 p-6 rounded-3xl border border-black/10 space-y-5">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-black">Start Tracking</h3>
                    <div className="flex flex-col lg:flex-row gap-8 lg:items-center">
                      <div className="flex-1 w-full flex flex-col sm:flex-row gap-3">
                        <select value={itemToTrackId} onChange={(e) => setItemToTrackId(e.target.value)} className="w-full sm:flex-1 px-4 py-3 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm text-sm">
                          <option value="">Select an untracked pantry item...</option>
                          {untrackedItemsList.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                        <button onClick={() => enableTrackingForId(itemToTrackId)} disabled={!itemToTrackId} className="w-full sm:w-auto px-5 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/80 disabled:opacity-50 transition shadow-sm">Track</button>
                      </div>

                      <span className="text-[10px] text-black/50 font-bold uppercase tracking-widest shrink-0 self-center">Or Add New</span>

                      <form onSubmit={addNewTrackedItem} className="flex-1 w-full flex flex-col sm:flex-row gap-2">
                        <input type="text" placeholder="New item name..." value={newTrackName} onChange={handleNewTrackNameChange} className="w-full sm:flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none bg-white border border-black/20 text-black shadow-sm" required />
                        <div className="flex gap-2 w-full sm:w-auto">
                          <select value={newTrackCategory} onChange={(e) => setNewTrackCategory(e.target.value)} className="flex-1 sm:w-28 px-2 py-3 rounded-xl text-xs focus:outline-none bg-white border border-black/20 text-black shadow-sm">
                            {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                          </select>
                          <select value={newTrackUnit} onChange={(e) => setNewTrackUnit(e.target.value)} className="flex-1 sm:w-20 px-2 py-3 rounded-xl text-xs focus:outline-none bg-white border border-black/20 text-black shadow-sm">
                            {COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                        <button type="submit" disabled={loading} className="w-full sm:w-auto px-5 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/80 disabled:opacity-50 transition shadow-sm">Add</button>
                      </form>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-black">Set Low Stock Amounts</h3>
                      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                        {trackedItemsList.map(item => (
                           <div key={item.id} className="flex flex-col p-4 rounded-2xl bg-white border border-black/10 shadow-sm gap-3 transition hover:shadow-md">
                             <div className="flex items-center justify-between">
                               <div>
                                 <h4 className="font-semibold text-base capitalize text-black">{item.name}</h4>
                                 <p className="text-xs text-black/60 font-medium">Stock: {item.quantity} {item.unit}</p>
                               </div>
                               <button onClick={() => disableTrackingForId(item.id)} className="text-black/40 hover:text-red-600 font-bold px-2 text-sm">✕</button>
                             </div>
                             <div className="flex items-center justify-between bg-black/5 p-2 px-3 rounded-xl border border-black/5">
                               <span className="text-xs font-semibold uppercase tracking-wider text-black/60">Alert below:</span>
                               <div className="flex items-center gap-2">
                                  <input type="number" step="any" min="0" value={item.low_stock_threshold || 0} onChange={(e) => updateLowStockThreshold(item.id, parseFloat(e.target.value) || 0)} className="w-20 px-3 py-1.5 rounded-lg text-center text-sm border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm" />
                                  <span className="text-xs font-bold text-black w-8">{item.unit}</span>
                               </div>
                             </div>
                           </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-red-800">Actively Low Items</h3>
                      {lowStockItems.length > 0 ? (
                        <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-2">
                          {lowStockItems.map((item) => (
                            <div key={item.id} className="flex justify-between items-center p-4 rounded-2xl bg-red-50 border border-red-200 shadow-sm">
                              <div>
                                <h4 className="font-semibold text-base capitalize text-black">{item.name}</h4>
                                <p className="text-sm text-red-800 font-medium">Have {item.quantity} {item.unit} (Alert at {item.low_stock_threshold || 1})</p>
                              </div>
                              <button onClick={() => adjustQuantity(item, 1)} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-black text-white shadow-sm hover:bg-black/80 transition">+ Add 1</button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-10 rounded-3xl border-2 border-dashed border-black/10 text-center bg-white/50">
                          <p className="text-sm font-medium text-black/50">All tracked items are well stocked!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          ) : selectedRecipe && isEditingRecipe ? (
            
            /* --- RECIPE EDIT SCREEN --- */
            <div className="space-y-6">
              <button onClick={() => setIsEditingRecipe(false)} className="flex items-center gap-2 text-black/70 hover:text-black font-semibold transition">&larr; Cancel Edits</button>
              <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-black/10 p-6 md:p-10 flex flex-col gap-6">
                 <div className="border-b pb-4 border-black/10 mb-2 shrink-0">
                    <h2 className="text-3xl font-bold">Edit Recipe</h2>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Title</label>
                      <input type="text" value={editRecipeForm.title} onChange={e => setEditRecipeForm({...editRecipeForm, title: e.target.value})} className="w-full p-3 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Recipe Image</label>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setEditRecipeForm)} className="w-full p-2 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#6B705C] file:text-white hover:file:bg-[#5a5f4d] cursor-pointer" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Category</label>
                      <input type="text" value={editRecipeForm.category} onChange={e => setEditRecipeForm({...editRecipeForm, category: e.target.value})} className="w-full p-3 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Cook Time</label>
                        <input type="text" value={editRecipeForm.cook_time} onChange={e => setEditRecipeForm({...editRecipeForm, cook_time: e.target.value})} className="w-full p-3 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Base Portions</label>
                        <input type="number" value={editRecipeForm.portions} onChange={e => setEditRecipeForm({...editRecipeForm, portions: parseInt(e.target.value) || 1})} className="w-full p-3 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm" />
                      </div>
                    </div>
                 </div>

                 <div className="space-y-1.5 mt-4">
                    <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Ingredients</label>
                    <textarea 
                      value={editRecipeForm.ingredientsText} 
                      onChange={e => setEditRecipeForm({...editRecipeForm, ingredientsText: e.target.value})} 
                      className="w-full p-4 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm min-h-[150px]" 
                    />
                 </div>

                 <div className="space-y-1.5 mt-4">
                    <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Instructions</label>
                    <textarea 
                      value={editRecipeForm.instructionsText} 
                      onChange={e => setEditRecipeForm({...editRecipeForm, instructionsText: e.target.value})} 
                      className="w-full p-4 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm min-h-[150px]" 
                    />
                 </div>

                 <div className="pt-6 border-t border-black/10 shrink-0 flex gap-3">
                   <button onClick={() => setIsEditingRecipe(false)} className="flex-1 py-4 rounded-2xl font-bold text-lg border border-black/20 bg-transparent text-black hover:bg-black/5 transition">Cancel</button>
                   <button onClick={saveEditedRecipe} disabled={loading} className="flex-1 py-4 rounded-2xl font-bold text-lg bg-black text-white hover:bg-black/80 disabled:opacity-50 transition shadow-sm">
                    {loading ? 'Saving...' : 'Save Changes'}
                   </button>
                 </div>
              </div>
            </div>

          ) : selectedRecipe && !isEditingRecipe ? (

            /* --- RECIPE DETAIL SCREEN --- */
            <div className="space-y-6">
              <button onClick={handleBackNavigation} className="flex items-center gap-2 text-black/70 hover:text-black font-semibold transition">&larr; Back to Recipes</button>
              
              <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-black/10">
                {selectedRecipe.image && <img src={selectedRecipe.image} alt={selectedRecipe.title} className="w-full h-64 md:h-96 object-cover" />}
                
                <div className="bg-[#6B705C] text-white p-6 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex-1">
                    <h2 className="text-4xl md:text-5xl font-bold leading-snug">{selectedRecipe.title}</h2>
                    <div className="flex items-center gap-4 mt-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold uppercase tracking-wider text-white/80">PORTIONS:</span>
                        <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-black/10 shadow-sm text-black">
                          <button onClick={() => setTargetPortions(Math.max(1, targetPortions - 1))} className="w-8 h-8 rounded-lg bg-black text-white hover:bg-black/80 font-bold">-</button>
                          <span className="w-8 text-center font-bold text-lg">{targetPortions}</span>
                          <button onClick={() => setTargetPortions(targetPortions + 1)} className="w-8 h-8 rounded-lg bg-black text-white hover:bg-black/80 font-bold">+</button>
                        </div>
                      </div>

                      <div className="w-px h-6 bg-white/20 hidden md:block"></div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold uppercase tracking-wider text-white/80">UNITS:</span>
                        <div className="flex items-center bg-white rounded-xl p-1 border border-black/10 shadow-sm text-black">
                          <button onClick={() => setMeasurementSystem('metric')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${measurementSystem === 'metric' ? 'bg-black text-white' : 'hover:bg-black/5'}`}>Metric</button>
                          <button onClick={() => setMeasurementSystem('imperial')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${measurementSystem === 'imperial' ? 'bg-black text-white' : 'hover:bg-black/5'}`}>Imperial</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 shrink-0 w-full md:w-56">
                    <button onClick={startDistribution} className="w-full py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/80 transition shadow-sm text-center">+ Add to Meal Plan</button>
                    <button onClick={() => addMissingRecipeIngredients(selectedRecipe, multiplier)} className="w-full py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/80 transition shadow-sm text-center">+ Missing to Shopping</button>
                  </div>
                </div>
                
                <div className="p-6 md:p-10">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex bg-black/5 p-1 rounded-2xl w-full md:w-auto">
                      <button onClick={() => setRecipeDetailTab('ingredients')} className={`flex-1 md:px-8 py-3 text-sm font-bold rounded-xl transition ${recipeDetailTab === 'ingredients' ? 'bg-white shadow-sm text-black' : 'text-black/60 hover:text-black'}`}>Ingredients</button>
                      <button onClick={() => setRecipeDetailTab('instructions')} className={`flex-1 md:px-8 py-3 text-sm font-bold rounded-xl transition ${recipeDetailTab === 'instructions' ? 'bg-white shadow-sm text-black' : 'text-black/60 hover:text-black'}`}>Method</button>
                    </div>
                    
                    <button onClick={startEditingRecipe} className="hidden md:block text-sm font-medium text-black/60 hover:text-black transition underline">Edit Recipe</button>
                  </div>

                  {recipeDetailTab === 'ingredients' && (
                    <div className="space-y-4 animate-in fade-in">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-black/80">Ingredients {multiplier !== 1 && <span className="text-emerald-700 normal-case font-medium ml-2">(Scaled {multiplier}x)</span>}</h3>
                      <div className="space-y-2">
                        {selectedRecipe.ingredients.map((ing, i) => {
                          const scaledIng = scaleAndConvertIngredient(ing, multiplier, measurementSystem);
                          const statusObj = getIngredientStatus(scaledIng, items);
                          return (
                            <div key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm p-3 rounded-xl bg-white border border-black/10 text-black font-medium shadow-sm">
                              <span>{scaledIng}</span>
                              <div className="shrink-0">
                                {statusObj.status === 'in_stock' && <span className="text-[10px] px-2.5 py-1 bg-[#6B705C] text-white rounded-full font-bold uppercase tracking-wider shadow-sm">In Pantry ({statusObj.availableText})</span>}
                                {statusObj.status === 'insufficient' && <span className="text-[10px] px-2.5 py-1 border border-[#6B705C]/50 text-[#6B705C] rounded-full font-bold uppercase tracking-wider">Low Stock</span>}
                                {statusObj.status === 'missing' && <span className="text-[10px] px-2.5 py-1 bg-black text-white rounded-full font-bold uppercase tracking-wider shadow-sm">Missing</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {recipeDetailTab === 'instructions' && (
                    <div className="space-y-5 animate-in fade-in">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-black/80">Method & Instructions</h3>
                      {selectedRecipe.instructions?.length ? selectedRecipe.instructions.map((step, idx) => {
                        if (step.includes('For full cooking instructions, visit')) return null;
                        return (
                          <div key={idx} className="p-4 rounded-2xl space-y-1.5 bg-white border border-black/10 shadow-sm">
                            <span className="font-medium text-sm uppercase text-black/70">Step {idx + 1}</span>
                            <p className="leading-relaxed text-black">{step}</p>
                          </div>
                        );
                      }) : <p className="text-black/50 text-sm italic">No instructions saved. Click "Edit Recipe" to add them manually.</p>}
                      
                      {selectedRecipe.source_url && <a href={selectedRecipe.source_url} target="_blank" rel="noopener noreferrer" className="mt-4 px-6 py-4 bg-white border border-black/20 rounded-2xl text-black font-semibold text-center hover:bg-black/5 transition shadow-sm block">View Full Original Recipe</a>}
                    </div>
                  )}

                  <div className="mt-8 md:hidden text-center">
                     <button onClick={startEditingRecipe} className="text-sm font-medium text-black/60 hover:text-black transition underline">Edit Recipe Details</button>
                  </div>
                </div>
              </div>
            </div>

          ) : (

            /* --- TAB VIEWS --- */
            <>
              {/* --- TAB: DASHBOARD --- */}
              {activeTab === 'dashboard' && (
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
                                {meals.map(meal => (
                                  <div 
                                    key={meal.id} 
                                    onClick={() => {
                                      if (meal.recipe_id) {
                                        const matchedRecipe = recipes.find(r => r.id === meal.recipe_id);
                                        if (matchedRecipe) handleOpenRecipe(matchedRecipe);
                                      }
                                    }}
                                    className={`flex items-center gap-3 bg-white p-3 rounded-2xl border border-black/5 transition ${meal.recipe_id ? 'cursor-pointer hover:shadow-md hover:border-black/20' : ''}`}
                                  >
                                    {meal.recipe_id && meal.recipes?.image ? (
                                      <img src={meal.recipes.image} alt={meal.recipes.title} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-black/5" />
                                    ) : (
                                      <div className="w-14 h-14 rounded-xl bg-[#6B705C]/10 flex items-center justify-center shrink-0 border border-black/5">
                                        <span className="text-[10px] font-semibold text-black/40 text-center leading-tight">{meal.recipe_id ? 'No Img' : 'Manual'}</span>
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold text-sm text-black truncate">{meal.recipe_id ? meal.recipes?.title : meal.manual_name}</p>
                                      <p className="text-xs font-medium text-black/60 mt-0.5">{meal.portions} portion{meal.portions > 1 ? 's' : ''}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div onClick={() => handleTabChange('planner')} className="p-3 bg-white/50 rounded-2xl border border-dashed border-black/10 text-center cursor-pointer hover:bg-white hover:border-black/30 transition">
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
                      <h3 className="text-6xl font-bold">{items.length} <span className="text-xl font-medium text-white/80">items</span></h3>
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
              )}

              {/* --- TAB: SHOPPING LIST --- */}
              {activeTab === 'shopping' && (
                 <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="bg-[#6B705C] text-white p-6 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 rounded-[32px] shadow-sm border border-black/10">
                    <div>
                      <h2 className="text-4xl md:text-5xl font-bold leading-snug">Shopping List</h2>
                      <p className="text-white/80 text-sm mt-2 font-medium">Keep track of what you need to buy.</p>
                    </div>
                    
                    <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto md:items-end">
                      <div className="relative w-full md:w-auto" ref={shoppingDropdownRef}>
                        <button onClick={() => setShowAddShoppingMenu(!showAddShoppingMenu)} className="w-full md:w-auto px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium transition hover:bg-black/80 shadow-sm flex items-center justify-between md:justify-center gap-2 border border-black/20">
                          Add Item ▾
                        </button>
                        {showAddShoppingMenu && (
                          <div className="absolute left-0 md:left-auto md:right-0 mt-2 w-full md:w-[240px] max-w-[90vw] bg-[#1A1A1A] rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-[100] flex flex-col text-white">
                            <button onClick={() => { setShowShoppingInput(true); setShowAddShoppingMenu(false); }} className="px-5 py-4 text-left text-sm font-semibold hover:bg-white/10 transition border-b border-white/5">Type Item Name</button>
                            <button onClick={() => { setVoiceContext('shopping'); setShowVoiceInputScreen(true); setShowAddShoppingMenu(false); }} className="px-5 py-4 text-left text-sm font-semibold hover:bg-white/10 transition">Voice Input</button>
                          </div>
                        )}
                      </div>
                      <button onClick={addLowStockToShopping} disabled={lowStockItems.length === 0} className="w-full md:w-auto px-5 py-2.5 bg-white text-black rounded-xl text-sm font-bold transition hover:bg-gray-100 disabled:opacity-50 shadow-sm border border-black/20 text-center">
                        Add Low Stock Alert Items
                      </button>
                    </div>
                  </div>

                  {showShoppingInput && (
                    <form onSubmit={handleAddShoppingItem} className="flex flex-col gap-3 mb-8 animate-in fade-in slide-in-from-top-2 p-6 bg-[#6B705C]/10 border border-black/10 rounded-[28px]">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B705C]">Add Manually</h3>
                        <button type="button" onClick={() => setShowShoppingInput(false)} className="text-sm font-bold text-black/40 hover:text-black">✕ Close</button>
                      </div>
                      <div className="flex gap-2 w-full">
                        <input type="text" value={shoppingInputName} onChange={(e) => setShoppingInputName(e.target.value)} placeholder="Type product name..." className="flex-1 min-w-0 px-4 py-3 rounded-2xl text-base focus:outline-none bg-white border border-black/20 text-black placeholder:text-black/50 shadow-sm" autoFocus required />
                        <input type="number" step="any" min="0.01" value={shoppingInputQty} onChange={(e) => setShoppingInputQty(e.target.value)} className="w-16 md:w-20 px-2 py-3 rounded-2xl text-center text-base focus:outline-none bg-white border border-black/20 text-black shadow-sm" />
                        <select value={shoppingInputUnit} onChange={(e) => setShoppingInputUnit(e.target.value)} className="w-20 md:w-24 px-2 py-3 rounded-2xl text-base focus:outline-none bg-white border border-black/20 text-black shadow-sm capitalize cursor-pointer">
                          {COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <button type="submit" className="w-full px-6 py-3 font-medium rounded-2xl bg-black text-white hover:bg-black/80 shadow-sm mt-2">Add Item</button>
                    </form>
                  )}

                  <div className="space-y-6">
                    {Object.keys(groupedShoppingList).length === 0 ? (
                      <p className="text-center text-black/60 py-8">Your list is empty.</p>
                    ) : (
                      Object.entries(groupedShoppingList).map(([aisle, aisleItems]) => (
                        <div key={aisle} className="bg-white rounded-[24px] p-5 border border-black/10 shadow-sm">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B705C] mb-4 pb-2 border-b border-black/10">{aisle}</h3>
                          <div className="space-y-2">
                            {aisleItems.map(item => (
                              <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border border-black/10 transition ${item.checked ? 'bg-black/5 opacity-60' : 'bg-white shadow-sm'}`}>
                                <label className="flex items-center gap-3 cursor-pointer flex-1">
                                  <input type="checkbox" checked={item.checked} onChange={() => toggleShoppingItem(item.id)} className="w-5 h-5 accent-black rounded cursor-pointer shrink-0" />
                                  <span className={`font-medium ${item.checked ? 'line-through text-black/50' : ''}`}>
                                    {item.name} <span className="text-xs font-normal text-black/60 ml-1">({item.quantity || 1} {item.unit || 'pcs'})</span>
                                  </span>
                                </label>
                                <button onClick={() => deleteShoppingItem(item.id)} className="text-black/40 hover:text-red-600 font-bold px-2 text-sm shrink-0">✕</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* --- TAB: PANTRY INVENTORY --- */}
              {activeTab === 'pantry' && (
                <div className="space-y-6">
                   <div className="bg-[#6B705C] text-white p-6 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 rounded-[32px] shadow-sm border border-black/10">
                    <div>
                      <h2 className="text-4xl md:text-5xl font-bold leading-snug">Pantry Inventory</h2>
                      <p className="text-white/80 text-sm mt-2 font-medium">Keep track of your ingredients.</p>
                    </div>
                    <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto md:items-end">
                      <div className="relative w-full md:w-auto" ref={pantryDropdownRef}>
                        <button onClick={() => setShowAddPantryMenu(!showAddPantryMenu)} className="w-full md:w-auto px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium transition hover:bg-black/80 shadow-sm flex items-center justify-between md:justify-center gap-2 border border-black/20">
                          Add Item ▾
                        </button>
                        {showAddPantryMenu && (
                          <div className="absolute left-0 md:left-auto md:right-0 mt-2 w-full md:w-[240px] max-w-[90vw] bg-[#1A1A1A] rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-[100] flex flex-col text-white">
                            <button onClick={() => { setShowPantryInput(true); setShowAddPantryMenu(false); }} className="px-5 py-4 text-left text-sm font-semibold hover:bg-white/10 transition border-b border-white/5">Type Item Name</button>
                            <button onClick={() => { fileInputRef.current?.click(); setShowAddPantryMenu(false); }} className="px-5 py-4 text-left text-sm font-semibold hover:bg-white/10 transition border-b border-white/5">Scan Receipt</button>
                            <button onClick={() => { setVoiceContext('pantry'); setShowVoiceInputScreen(true); setShowAddPantryMenu(false); }} className="px-5 py-4 text-left text-sm font-semibold hover:bg-white/10 transition">Voice Input</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {isScanning && <div className="text-center font-bold animate-pulse text-[#6B705C]">Reading Receipt...</div>}

                  {showPantryInput && (
                    <form onSubmit={addItem} className="flex flex-col gap-3 mb-8 animate-in fade-in slide-in-from-top-2 p-6 bg-[#6B705C]/10 border border-black/10 rounded-[28px]">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B705C]">Add Manually</h3>
                        <button type="button" onClick={() => setShowPantryInput(false)} className="text-sm font-bold text-black/40 hover:text-black">✕ Close</button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <input type="text" placeholder="Item name (e.g. Crisp Lettuce)" value={name} onChange={handleNameChange} className="sm:col-span-5 px-4 py-3 rounded-2xl text-base focus:outline-none bg-white border border-black/20 text-black placeholder:text-black/50 shadow-sm" required />
                        <select value={category} onChange={(e) => { setCategory(e.target.value); setIsManualCategory(true); }} className="sm:col-span-3 px-3 py-3 rounded-2xl text-base focus:outline-none cursor-pointer bg-white border border-black/20 text-black shadow-sm">
                          {CATEGORIES.map((cat) => <option key={cat.name} value={cat.name} className="text-black">{cat.name}</option>)}
                        </select>
                        <div className="sm:col-span-2 flex gap-1.5">
                          <input type="number" step="any" min="0.01" placeholder="Qty" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-16 px-2 py-3 rounded-2xl text-center text-base focus:outline-none bg-white border border-black/20 text-black shadow-sm" />
                          <select value={unit} onChange={(e) => setUnit(e.target.value)} className="flex-1 px-2 py-3 rounded-2xl text-base focus:outline-none cursor-pointer capitalize bg-white border border-black/20 text-black shadow-sm">
                            {COMMON_UNITS.map((u) => <option key={u} value={u} className="text-black">{u}</option>)}
                          </select>
                        </div>
                        <button type="submit" disabled={loading} className="sm:col-span-2 font-medium py-3.5 rounded-2xl transition text-base shadow-md active:scale-95 disabled:opacity-50 bg-black text-white hover:bg-black/80">Add</button>
                      </div>
                    </form>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.keys(groupedItems).length > 0 ? (
                      Object.entries(groupedItems).map(([groupCategory, groupList]) => {
                        return (
                          <div key={groupCategory} className="rounded-[28px] p-5 space-y-3 bg-[#6B705C]/30 border border-black/10 shadow-sm">
                            <div className="flex items-center gap-2 pb-2 border-b border-black/10">
                              <span className="text-sm font-semibold tracking-wider uppercase text-black">{groupCategory}</span>
                            </div>
                            <div className="space-y-2">
                              {groupList.map((item) => {
                                const isEditing = editingId === item.id;
                                return (
                                  <div key={item.id} className="rounded-[20px] p-3 transition bg-white border border-black/10 shadow-sm">
                                    {!isEditing ? (
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <h3 className="font-semibold text-base capitalize text-black">{item.name}</h3>
                                          <p className="text-sm text-black/70 font-normal">{item.quantity} {item.unit}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <button onClick={() => adjustQuantity(item, -1)} className="w-7 h-7 rounded-lg text-sm flex items-center justify-center bg-[#6B705C]/10 text-red-700 border border-black/10 hover:bg-black/5">-</button>
                                          <button onClick={() => adjustQuantity(item, 1)} className="w-7 h-7 rounded-lg text-sm flex items-center justify-center bg-[#6B705C]/10 text-emerald-800 border border-black/10 hover:bg-black/5">+</button>
                                          <button onClick={() => startEditing(item)} className="p-1.5 text-sm text-black/60 hover:text-black font-medium px-2">Edit</button>
                                          <button onClick={() => deleteItem(item.id)} className="p-1.5 text-sm text-black/40 hover:text-red-600 font-bold px-2">✕</button>
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
                                            {CATEGORIES.map((cat) => <option key={cat.name} value={cat.name} className="text-black">{cat.name}</option>)}
                                          </select>
                                          <input type="number" step="any" min="0.01" value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)} className="w-16 px-2 py-2 rounded-xl text-center text-sm focus:outline-none bg-white border border-black/20 text-black" />
                                          <select value={editUnit} onChange={(e) => setEditUnit(e.target.value)} className="flex-1 px-2 py-2 rounded-xl text-sm focus:outline-none capitalize bg-white border border-black/20 text-black">
                                            {COMMON_UNITS.map((u) => <option key={u} value={u} className="text-black">{u}</option>)}
                                          </select>
                                          <button onClick={() => saveEdit(item.id)} className="px-3 py-2 rounded-xl text-sm font-medium bg-black text-white">Save</button>
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

              {/* --- TAB: RECIPES & IMPORT --- */}
              {activeTab === 'recipes' && (
                <div className="space-y-6">
                   <div className="rounded-[28px] p-6 bg-[#6B705C] text-white border border-black/10 shadow-sm flex flex-col gap-4">
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="w-full sm:flex-1 min-w-0">
                        <input 
                          type="text" 
                          placeholder="Search recipes..." 
                          value={recipeSearchQuery}
                          onChange={(e) => setRecipeSearchQuery(e.target.value)}
                          className="w-full min-w-0 px-4 py-3 rounded-2xl text-base focus:outline-none bg-white border border-black/20 text-black placeholder:text-black/50 shadow-sm"
                        />
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <select 
                          value={recipeCategoryFilter}
                          onChange={(e) => setRecipeCategoryFilter(e.target.value)}
                          className="flex-1 sm:flex-none min-w-0 px-4 py-3 rounded-2xl text-base focus:outline-none bg-white border border-black/20 text-black shadow-sm sm:w-[200px]"
                        >
                          {uniqueRecipeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        
                        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-black/20 shrink-0">
                          <button onClick={() => setRecipeViewMode('grid')} className={`px-3 flex items-center justify-center rounded-xl transition ${recipeViewMode === 'grid' ? 'bg-[#6B705C] text-white' : 'text-black/40 hover:text-black'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                          </button>
                          <button onClick={() => setRecipeViewMode('list')} className={`px-3 flex items-center justify-center rounded-xl transition ${recipeViewMode === 'list' ? 'bg-[#6B705C] text-white' : 'text-black/40 hover:text-black'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-px bg-white/20 my-2"></div>

                    <div className="flex justify-end relative">
                      <div className="relative w-full md:w-auto" ref={recipeDropdownRef}>
                        <button onClick={() => setShowAddRecipeMenu(!showAddRecipeMenu)} className="w-full md:w-auto px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium transition hover:bg-black/80 shadow-sm flex items-center justify-between md:justify-center gap-2 border border-black/20">
                          Add Recipe ▾
                        </button>
                        {showAddRecipeMenu && (
                          <div className="absolute left-0 md:left-auto md:right-0 mt-2 w-full md:w-[240px] max-w-[90vw] bg-[#1A1A1A] rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-[100] flex flex-col text-white">
                            <button onClick={() => { setShowManualAddRecipe(true); setShowAddRecipeMenu(false); setShowImportInput(false); }} className="px-5 py-4 text-left text-sm font-semibold hover:bg-white/10 transition border-b border-white/5">Create New Recipe</button>
                            <button onClick={() => { setShowImportInput(true); setShowAddRecipeMenu(false); }} className="px-5 py-4 text-left text-sm font-semibold hover:bg-white/10 transition border-b border-white/5">Add using Recipe URL</button>
                            <button onClick={() => { recipeFileInputRef.current?.click(); setShowAddRecipeMenu(false); setShowImportInput(false); }} className="px-5 py-4 text-left text-sm font-semibold hover:bg-white/10 transition">Add using Screenshot</button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {showImportInput && (
                      <form onSubmit={handleImportRecipe} className="flex flex-col sm:flex-row gap-3 pt-2">
                        <input type="url" placeholder="Paste recipe URL (e.g. foodnetwork.com/...)" value={importUrl} onChange={(e) => setImportUrl(e.target.value)} className="flex-1 min-w-0 px-4 py-3 rounded-2xl text-base focus:outline-none bg-white border border-black/20 text-black placeholder:text-black/50 shadow-sm" required />
                        <button type="submit" disabled={isImporting} className="px-8 font-medium py-3.5 rounded-2xl transition text-base shadow-md active:scale-95 disabled:opacity-50 bg-black text-white hover:bg-black/80 shrink-0">Import</button>
                      </form>
                    )}
                  </div>
                  
                  <div className={recipeViewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" : "flex flex-col gap-4"}>
                    {filteredRecipes.map((recipe) => (
                      recipeViewMode === 'grid' ? (
                        <div key={recipe.id} onClick={() => handleOpenRecipe(recipe)} className="rounded-[24px] overflow-hidden cursor-pointer transition border border-black/10 hover:border-black/40 flex flex-col justify-between bg-white shadow-sm hover:shadow-md">
                          {recipe.image && <img src={recipe.image} alt={recipe.title} className="w-full h-40 object-cover" />}
                          <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-bold text-xl text-black">{recipe.title}</h3>
                                <p className="text-sm mt-1 text-black/70">{recipe.cook_time} &bull; {recipe.portions || 4} portions</p>
                              </div>
                              <button onClick={(e) => deleteRecipe(recipe.id, e)} className="text-sm p-1 text-black/50 hover:text-red-600 font-bold shrink-0">✕</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div key={recipe.id} onClick={() => handleOpenRecipe(recipe)} className="flex items-center gap-4 p-3 rounded-[24px] bg-white border border-black/10 shadow-sm cursor-pointer hover:shadow-md transition">
                          {recipe.image ? (
                            <img src={recipe.image} alt={recipe.title} className="w-20 h-20 rounded-[16px] object-cover shrink-0" />
                          ) : (
                            <div className="w-20 h-20 rounded-[16px] bg-[#6B705C]/10 flex items-center justify-center shrink-0 border border-black/5"><span className="text-xs font-semibold text-black/40">No Image</span></div>
                          )}
                          <div className="flex-1 min-w-0">
                             <h3 className="font-bold text-lg text-black truncate">{recipe.title}</h3>
                             <p className="text-sm text-black/60 truncate">{recipe.cook_time} &bull; {recipe.category}</p>
                          </div>
                          <button onClick={(e) => deleteRecipe(recipe.id, e)} className="text-sm p-4 text-black/30 hover:text-red-600 font-bold shrink-0">✕</button>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* --- TAB: MEAL PLANNER (COLLAPSIBLE 7-DAY CALENDAR) --- */}
              {activeTab === 'planner' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Your Week Ahead</h2>
                  </div>
                  <div className="space-y-6">
                    {next7Days.map((dateStr) => {
                      const dateObj = new Date(dateStr);
                      const isToday = dateStr === todayStr;
                      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                      const isCollapsed = collapsedDays[dateStr];

                      return (
                        <div key={dateStr} className={`rounded-[28px] p-6 border transition-all ${isToday ? 'bg-[#6B705C] border-black/20' : 'bg-[#6B705C]/90 border-black/10 shadow-sm'}`}>
                          
                          <div 
                            onClick={() => setCollapsedDays(prev => ({ ...prev, [dateStr]: !prev[dateStr] }))}
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
                                const mealsInSlot = mealPlans.filter(m => m.date === dateStr && m.meal_type === mealType);
                                return (
                                  <div key={mealType} className="bg-white rounded-2xl p-4 border border-black/10 flex flex-col shadow-sm">
                                    <h4 className="font-semibold text-sm uppercase tracking-wider text-black/70 mb-3">{mealType}</h4>
                                    <div className="flex-1 space-y-2 mb-3">
                                      {mealsInSlot.length === 0 ? <p className="text-sm text-black/40 italic">Nothing planned</p> : mealsInSlot.map(meal => (
                                        <div key={meal.id} className="flex justify-between items-start p-2.5 rounded-xl bg-black/5 border border-transparent group">
                                          <div>
                                            <p className="font-semibold text-sm text-black leading-snug">{meal.recipe_id ? meal.recipes?.title : meal.manual_name}</p>
                                            <p className="text-xs text-black/60 mt-0.5">{meal.portions} portion{meal.portions > 1 ? 's' : ''}</p>
                                          </div>
                                          <button onClick={() => deleteMealPlan(meal.id)} className="text-black/30 hover:text-red-600 font-bold px-1 text-xs opacity-0 group-hover:opacity-100 transition">✕</button>
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
              )}
            </>
          )}
        </div>
      )}

      {/* --- MOBILE BOTTOM NAVIGATION BAR --- */}
      {!showVoiceInputScreen && (
        <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-black/10 px-6 pt-3 pb-6 flex justify-between items-center z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          {[
            { id: 'dashboard', label: 'Home', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
            { id: 'pantry', label: 'Pantry', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /> },
            { id: 'recipes', label: 'Recipes', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /> },
            { id: 'shopping', label: 'List', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /> },
            { id: 'planner', label: 'Plan', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 transition ${activeTab === tab.id ? 'text-[#6B705C] scale-110' : 'text-black/40 hover:text-black/70'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{tab.svg}</svg>
              <span className="text-[10px] font-bold tracking-wide">{tab.label}</span>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}