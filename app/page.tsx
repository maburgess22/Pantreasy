'use client';

/* ==========================================================================
   1. IMPORTS, TYPES & CONSTANTS
   ========================================================================== */
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

// IMPORT OUR SHARED TYPES & HELPERS
import { PantryItem, Recipe, ShoppingItem, MealPlanItem } from '@/utils/types';
import { 
  toBaseUnit, fromBaseUnit, scaleAndConvertIngredient, cleanIngredientName, 
  getStandardGroceryItem, getAisle, compressImage, normalizeName, getNext7Days 
} from '@/utils/helpers';

// IMPORT OUR CUSTOM UI & TABS
import CustomSelect from '@/components/ui/CustomSelect';
import TopHeader from '@/components/TopHeader';
import BottomNav from '@/components/BottomNav';
import AccountSettingsModal from '@/components/modals/AccountSettingsModal';
import DashboardTab from '@/components/tabs/DashboardTab';
import PantryTab from '@/components/tabs/PantryTab';
import ShoppingTab from '@/components/tabs/ShoppingTab';
import RecipesTab from '@/components/tabs/RecipesTab';
import PlannerTab from '@/components/tabs/PlannerTab';
import LowStockTab from '@/components/tabs/LowStockTab';

const CATEGORIES = [
  { name: 'Produce' }, { name: 'Dairy & Eggs' }, { name: 'Meat & Seafood' },
  { name: 'Pantry Staples' }, { name: 'Bakery' }, { name: 'Frozen' },
  { name: 'Snacks' }, { name: 'Beverages' }, { name: 'Other' }
];

const COMMON_UNITS = ['pcs', 'kg', 'g', 'lbs', 'oz', 'ml', 'l', 'cups', 'tbsp', 'tsp', 'cans', 'packs', 'dash', 'pinch', 'cloves'];
const DEFAULT_CATEGORIES = ['Produce', 'Dairy & Eggs', 'Meat & Seafood', 'Pantry Staples', 'Bakery', 'Frozen', 'Snacks', 'Beverages', 'Other'];

/* ==========================================================================
   2. MAIN COMPONENT & STATE MANAGEMENT
   ========================================================================== */
export default function PantryManager() {
  const supabase = createClient();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // App & User State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pantry' | 'recipes' | 'shopping' | 'planner' | 'lowstock'>('dashboard');
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState('');
  const [items, setItems] = useState<PantryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // 3-Dot Menus Bottom Sheets
  const [pantryActionMenu, setPantryActionMenu] = useState<{isOpen: boolean, item: PantryItem | null}>({isOpen: false, item: null});
  const [recipeActionMenu, setRecipeActionMenu] = useState<{isOpen: boolean, recipe: Recipe | null}>({isOpen: false, recipe: null});
  const [editingPantryItem, setEditingPantryItem] = useState<PantryItem | null>(null);

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeViewMode, setRecipeViewMode] = useState<'grid' | 'list'>('grid');
  const [recipeDetailTab, setRecipeDetailTab] = useState<'ingredients' | 'instructions'>('ingredients');
  const [targetPortions, setTargetPortions] = useState(4);
  const [measurementSystem, setMeasurementSystem] = useState<'metric' | 'imperial'>('metric');
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
  const [recipeCategoryFilter, setRecipeCategoryFilter] = useState('All');
  
  const [isEditingRecipe, setIsEditingRecipe] = useState(false);
  const [editRecipeForm, setEditRecipeForm] = useState({ title: '', category: '', cook_time: '', portions: 4, image: '', ingredientsText: '', instructionsText: '' });
  const [showManualAddRecipe, setShowManualAddRecipe] = useState(false);
  const [manualRecipe, setManualRecipe] = useState({ title: '', category: 'Main Dish', cook_time: '30 mins', portions: 4, ingredientsText: '', instructionsText: '', image: '' });
  const [showImportInput, setShowImportInput] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showAddRecipeMenu, setShowAddRecipeMenu] = useState(false);

  const [showAddPantryMenu, setShowAddPantryMenu] = useState(false);
  const [showPantryInput, setShowPantryInput] = useState(false);
  const [name, useStateName] = useState('');
  const [category, setCategory] = useState('Produce');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [isManualCategory, setIsManualCategory] = useState(false);

  const [showAddShoppingMenu, setShowAddShoppingMenu] = useState(false);
  const [showShoppingInput, setShowShoppingInput] = useState(false);
  const [shoppingInputName, setShoppingInputName] = useState('');
  const [shoppingInputQty, setShoppingInputQty] = useState('1');
  const [shoppingInputUnit, setShoppingInputUnit] = useState('pcs');
  
  const [showVoiceInputScreen, setShowVoiceInputScreen] = useState(false);
  const [voiceContext, setVoiceContext] = useState<'shopping' | 'pantry'>('shopping');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceParsedItems, setVoiceParsedItems] = useState<{id: number, name: string, quantity: number, unit: string, category?: string}[]>([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({});
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [recipePickerTarget, setRecipePickerTarget] = useState<{date: string, mealType: string} | null>(null);
  const [planTargetPortions, setPlanTargetPortions] = useState(4);
  const [allocationsGrid, setAllocationsGrid] = useState<Record<string, number>>({});
  const [manualInputs, setManualInputs] = useState<Record<string, string>>({});
  const [manualInputsQty, setManualInputsQty] = useState<Record<string, number>>({}); 

  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<any[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recipeDropdownRef = useRef<HTMLDivElement>(null);
  const shoppingDropdownRef = useRef<HTMLDivElement>(null);
  const pantryDropdownRef = useRef<HTMLDivElement>(null);
  const lowStockDropdownRef = useRef<HTMLDivElement>(null);

  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');
  
  const [itemToTrackId, setItemToTrackId] = useState('');
  const [newTrackName, setNewTrackName] = useState('');
  const [newTrackCategory, setNewTrackCategory] = useState('Produce');
  const [newTrackUnit, setNewTrackUnit] = useState('pcs');
  const [showAddTrackMenu, setShowAddTrackMenu] = useState(false);
  const [showTrackPantryInput, setShowTrackPantryInput] = useState(false);
  const [showTrackNewInput, setShowTrackNewInput] = useState(false);

  const next7Days = getNext7Days();
  const todayStr = new Date().toISOString().split('T')[0];

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const dynamicCategories = Array.from(new Set([
    ...DEFAULT_CATEGORIES,
    ...(items || []).map(i => i?.category)
  ])).filter(Boolean);

  /* ==========================================================================
     3. DATA FETCHING & EVENT LISTENERS
     ========================================================================== */
  useEffect(() => {
    setIsMounted(true);
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
      if (lowStockDropdownRef.current && !lowStockDropdownRef.current.contains(event.target as Node)) setShowAddTrackMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleTabChange = (tab: string) => {
    window.history.pushState({ tab, type: 'tab' }, '', `#${tab}`);
    setActiveTab(tab as any); setSelectedRecipe(null);
  };

  const handleOpenRecipe = (recipe: Recipe) => {
    window.history.pushState({ tab: activeTab, recipe, type: 'recipe' }, '', `#recipe-${recipe.id}`);
    setSelectedRecipe(recipe); setTargetPortions(recipe.portions || 4); setIsEditingRecipe(false); setRecipeDetailTab('ingredients'); window.scrollTo(0, 0);
  };

  const handleOpenLowStock = () => { 
    window.history.pushState({ tab: 'lowstock', type: 'tab' }, '', `#lowstock`); 
    setActiveTab('lowstock'); 
    setSelectedRecipe(null);
  };

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
     4. BARCODE SCANNING INTEGRATION
     ========================================================================== */
  useEffect(() => {
    let html5QrCode: any;
    if (showBarcodeScanner) {
      import('html5-qrcode').then(({ Html5Qrcode }) => {
        html5QrCode = new Html5Qrcode("barcode-reader");
        html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          async (decodedText: string) => {
            try { await html5QrCode.stop(); html5QrCode.clear(); } catch(e) {}
            setShowBarcodeScanner(false);
            await handleBarcodeScanned(decodedText);
          },
          (err: any) => { }
        ).catch((err: any) => {
           showToast("Camera access denied or unavailable.");
           setShowBarcodeScanner(false);
        });
      }).catch(err => {
         showToast("Barcode scanner library failed to load.");
         setShowBarcodeScanner(false);
      });
    }
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch((e: any) => console.log(e));
      }
    };
  }, [showBarcodeScanner]);

  const handleBarcodeScanned = async (barcode: string) => {
    setLoading(true);
    showToast('Barcode recognized! Fetching details...');
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,generic_name,brands,quantity,categories_tags`);
      const data = await res.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        const itemName = p.product_name || p.generic_name || 'Unknown Item';
        const brand = p.brands ? `${p.brands.split(',')[0]} ` : '';
        const fullName = `${brand}${itemName}`.trim().charAt(0).toUpperCase() + `${brand}${itemName}`.trim().slice(1).toLowerCase();
        useStateName(fullName);
        setCategory(getAisle(fullName));
        if (p.quantity) {
           const match = p.quantity.match(/^([\d.]+)\s*([a-zA-Z]+)/);
           if (match) { setQuantity(match[1]); setUnit(match[2].toLowerCase()); }
        }
        setShowPantryInput(true);
        showToast('Item loaded! Please review and save.');
      } else {
        showToast('Product not found in database. Try typing manually.');
        setShowPantryInput(true);
      }
    } catch (e) {
      showToast('Error looking up barcode.');
    }
    setLoading(false);
  };

  /* ==========================================================================
     5. MERGING / ACCUMULATION ENGINES
     ========================================================================== */
  const addOrMergePantryItem = async (newItem: { name: string, category: string, quantity: number, unit: string, track_low_stock: boolean, low_stock_threshold: number }) => {
    const existing = items.find(i => normalizeName(i.name) === normalizeName(newItem.name));
    if (existing) {
      const existingBase = toBaseUnit(existing.quantity, existing.unit);
      const newBase = toBaseUnit(newItem.quantity, newItem.unit);
      if (existingBase.base === newBase.base || existing.quantity === 0) {
        const combinedBaseQty = existing.quantity === 0 ? newBase.qty : existingBase.qty + newBase.qty;
        const combinedBaseUnit = existing.quantity === 0 ? newBase.base : existingBase.base;
        const final = fromBaseUnit(combinedBaseQty, combinedBaseUnit);
        await supabase.from('pantry_items').update({ quantity: final.qty, unit: final.unit, track_low_stock: newItem.track_low_stock || existing.track_low_stock }).eq('id', existing.id).eq('user_id', userId);
        setItems(prev => prev.map(i => i.id === existing.id ? { ...i, quantity: final.qty, unit: final.unit, track_low_stock: newItem.track_low_stock || i.track_low_stock } : i));
        return;
      }
    }
    const { data } = await supabase.from('pantry_items').insert([{ ...newItem, user_id: userId }]).select().single();
    if (data) setItems(prev => [data, ...prev]);
  };

  const addOrMergeShoppingItem = async (newItem: { name: string, quantity: number, unit: string }) => {
    const existing = shoppingList.find(i => normalizeName(i.name) === normalizeName(newItem.name) && !i.checked);
    if (existing) {
      const existingBase = toBaseUnit(existing.quantity || 1, existing.unit || 'pcs');
      const newBase = toBaseUnit(newItem.quantity, newItem.unit);
      if (existingBase.base === newBase.base) {
        const combinedBaseQty = existingBase.qty + newBase.qty;
        const final = fromBaseUnit(combinedBaseQty, existingBase.base);
        await supabase.from('shopping_list').update({ quantity: final.qty, unit: final.unit }).eq('id', existing.id).eq('user_id', userId);
        setShoppingList(prev => prev.map(i => i.id === existing.id ? { ...i, quantity: final.qty, unit: final.unit } : i));
        return;
      }
    } 
    const { data } = await supabase.from('shopping_list').insert([{ ...newItem, user_id: userId }]).select().single();
    if (data) setShoppingList(prev => [data, ...prev]);
  };

  /* ==========================================================================
     6. VOICE INPUT PARSING
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

  const parseVoiceInput = async (textToParse: string) => {
    if (!textToParse.trim()) return;
    const numberMap: Record<string, string> = { 'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10', 'a': '1', 'an': '1' };
    let cleanText = textToParse.toLowerCase();
    Object.keys(numberMap).forEach(word => { cleanText = cleanText.replace(new RegExp(`\\b${word}\\b`, 'g'), numberMap[word]); });
    const rawItems = cleanText.split(/\s+and\s+|,|\s+plus\s+/i).map(s => s.trim()).filter(Boolean);
    const parsedPromises = rawItems.map(async (itemStr, idx) => {
      let cleanedItemStr = itemStr.replace(/\b(of|some)\b/g, '').replace(/\s+/g, ' ').trim();
      const regex = /^([\d.]+)?\s*(?:\b(kg|g|lbs|oz|ml|l|cups|tbsp|tsp|cans|packs|pcs|grams|kilograms|liters|milliliters|cloves)\b)?\s*(.*)$/i;
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
      let standardizedName = parsedName.charAt(0).toUpperCase() + parsedName.slice(1);
      let predictedCategory = 'Other';
      if (unit === 'pcs') {
        if (standardizedName.toLowerCase().includes('milk') || standardizedName.toLowerCase().includes('water')) unit = 'ml';
        if (standardizedName.toLowerCase().includes('flour') || standardizedName.toLowerCase().includes('sugar') || standardizedName.toLowerCase().includes('rice')) unit = 'g';
      }
      if (predictedCategory === 'Other') predictedCategory = getAisle(standardizedName);
      return { id: Date.now() + idx, name: standardizedName.trim(), quantity: qty, unit, category: predictedCategory };
    });
    const parsed = await Promise.all(parsedPromises);
    setVoiceParsedItems(parsed);
  };

  const updateVoiceItem = (index: number, field: string, value: string | number) => {
    setVoiceParsedItems(prev => { const updated = [...prev]; updated[index] = { ...updated[index], [field]: value }; return updated; });
  };

  const removeVoiceItem = (index: number) => setVoiceParsedItems(prev => prev.filter((_, i) => i !== index));

  const commitVoiceItems = async () => {
    if (voiceParsedItems.length === 0) return;
    setLoading(true);
    for (const item of voiceParsedItems) {
       if (voiceContext === 'shopping') {
         await addOrMergeShoppingItem({ name: item.name, quantity: item.quantity, unit: item.unit });
       } else {
         await addOrMergePantryItem({ name: item.name, category: item.category || 'Other', quantity: item.quantity, unit: item.unit, track_low_stock: false, low_stock_threshold: 1 });
       }
    }
    if (voiceContext === 'shopping') showToast('Items added to list!'); else showToast('Items added to pantry!');
    setVoiceParsedItems([]); setVoiceTranscript(''); setShowVoiceInputScreen(false); setLoading(false);
  };

  /* ==========================================================================
     7. CRUD HANDLERS
     ========================================================================== */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement> | {target: {value: string}}) => {
    const val = e.target.value; useStateName(val);
    if (!isManualCategory && val.length > 2) {
      setCategory(getAisle(val));
    }
  };

  const handleNewTrackNameChange = (e: React.ChangeEvent<HTMLInputElement> | {target: {value: string}}) => {
    const val = e.target.value; setNewTrackName(val);
    if (val.length > 2) {
      setNewTrackCategory(getAisle(val));
    }
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault(); if (!name.trim()) return; setLoading(true);
    await addOrMergePantryItem({ name: name.trim(), category, quantity: parseFloat(quantity) || 1, unit, track_low_stock: false, low_stock_threshold: 1 });
    useStateName(''); setQuantity('1'); setIsManualCategory(false); setLoading(false); setShowPantryInput(false); showToast('Item added to pantry!');
  };

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setIsScanning(true);
    try {
      const compressedFile = await compressImage(file);
      const formData = new FormData(); formData.append('receipt', compressedFile);
      const res = await fetch('/api/scan-receipt', { method: 'POST', body: formData }); 
      const data = await res.json();
      if (data.items && data.items.length > 0) setScannedItems(data.items); 
      else showToast(data.message || 'Scanner API didn\'t find any items.');
    } catch { showToast('Failed to read receipt. Image may be too large or backend error.'); }
    if (fileInputRef.current) fileInputRef.current.value = ''; setIsScanning(false);
  };

  const updateScannedItem = (index: number, field: string, value: string | number) => {
    setScannedItems(prev => { if (!prev) return prev; const updated = [...prev]; updated[index] = { ...updated[index], [field]: value }; return updated; });
  };
  const removeScannedItem = (index: number) => setScannedItems(prev => prev ? prev.filter((_, i) => i !== index) : prev);

  const commitScannedItems = async () => {
    if (!scannedItems || scannedItems.length === 0) return setScannedItems(null);
    setLoading(true);
    for (const item of scannedItems) {
      await addOrMergePantryItem({ name: item.name, category: item.category || 'Other', quantity: parseFloat(item.quantity) || 1, unit: item.unit || 'pcs', track_low_stock: false, low_stock_threshold: 1 });
    }
    showToast(`Added ${scannedItems.length} items to pantry!`); setScannedItems(null); setLoading(false);
  };

  const deleteItem = async (id: string) => { setItems(prev => prev.filter(item => item.id !== id)); await supabase.from('pantry_items').delete().eq('id', id).eq('user_id', userId); showToast('Item deleted.'); };
  
  const adjustQuantity = async (item: PantryItem, delta: number) => {
    const newQty = Math.max(0, Number((item.quantity + delta).toFixed(2)));
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));
    await supabase.from('pantry_items').update({ quantity: newQty }).eq('id', item.id).eq('user_id', userId);
    if (pantryActionMenu.item && pantryActionMenu.item.id === item.id) {
       setPantryActionMenu({ isOpen: true, item: { ...pantryActionMenu.item, quantity: newQty } });
    }
  };

  const startEditing = (item: PantryItem) => { 
    setEditingPantryItem(item);
    setEditName(item.name); 
    setEditCategory(item.category); 
    setEditQuantity(item.quantity.toString()); 
    setEditUnit(item.unit); 
  };

  const saveEdit = async (id: string) => {
    const updatedItem = { name: editName.trim(), category: editCategory, quantity: parseFloat(editQuantity) || 0, unit: editUnit };
    if (!updatedItem.name) return showToast("Item name cannot be empty.");
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updatedItem } : item));
    setEditingPantryItem(null); 
    await supabase.from('pantry_items').update(updatedItem).eq('id', id).eq('user_id', userId);
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
    const existing = items.find(i => 
      (i.name || '').toLowerCase().trim() === newTrackName.toLowerCase().trim() || 
      normalizeName(i.name || '') === normalizeName(newTrackName)
    );
    if (existing) {
       await supabase.from('pantry_items').update({ track_low_stock: true, low_stock_threshold: 1 }).eq('id', existing.id).eq('user_id', userId);
       setItems(prev => prev.map(i => i.id === existing.id ? { ...i, track_low_stock: true, low_stock_threshold: 1 } : i));
       showToast(`Linked tracker to existing ${existing.name} in pantry!`);
    } else {
       await addOrMergePantryItem({ name: newTrackName.trim(), category: newTrackCategory, quantity: 0, unit: newTrackUnit, track_low_stock: true, low_stock_threshold: 1 });
       showToast('Tracking added!');
    }
    setNewTrackName(''); setLoading(false); setShowTrackNewInput(false);
  };

  const handleImportRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl) return;
    setIsImporting(true);
    try {
      const res = await fetch('/api/scrape-recipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: importUrl }) });
      const data = await res.json();
      if (res.ok && data.title) {
        const { data: insertedData, error } = await supabase.from('recipes').insert([{ ...data, portions: 4, user_id: userId }]).select().single();
        if (error) throw error;
        if (insertedData) { setRecipes(prev => [insertedData, ...prev]); showToast('Recipe imported!'); setShowImportInput(false); }
      } else {
        showToast(data.error || 'Could not extract a recipe from that URL.');
      }
    } catch {
      showToast('Failed to import recipe.');
    }
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
    setEditRecipeForm({ title: selectedRecipe.title || '', category: selectedRecipe.category || 'Other', cook_time: selectedRecipe.cook_time || '', portions: selectedRecipe.portions || 4, image: selectedRecipe.image || '', ingredientsText: (selectedRecipe.ingredients || []).join('\n'), instructionsText: (selectedRecipe.instructions || []).join('\n') });
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

  const deleteRecipe = async (id: string, e?: React.MouseEvent) => { 
    if (e) e.stopPropagation(); 
    setRecipes(prev => prev.filter(r => r.id !== id)); 
    await supabase.from('recipes').delete().eq('id', id).eq('user_id', userId); 
    showToast('Recipe deleted.'); 
  };

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
    const { data } = await supabase.from('meal_plan').insert(inserts).select('*, recipes(title, image, cook_time, category)');
    if (data) { setMealPlans(prev => [...prev, ...(data as MealPlanItem[])]); showToast('Meals added to planner!'); setShowDistributionModal(false); }
    setLoading(false);
  };

  const saveManualMeal = async (date: string, mealType: string) => {
    const key = `${date}-${mealType}`; 
    const value = manualInputs[key];
    const qty = manualInputsQty[key] || 1;
    if (!value || !value.trim()) return;
    const { data } = await supabase.from('meal_plan').insert([{ date, meal_type: mealType, manual_name: value.trim(), portions: qty, user_id: userId }]).select('*, recipes(title)').single();
    if (data) { setMealPlans(prev => [...prev, data as MealPlanItem]); setManualInputs(prev => ({ ...prev, [key]: '' })); setManualInputsQty(prev => ({ ...prev, [key]: 1 })); }
  };
  
  const deleteMealPlan = async (id: string) => { setMealPlans(prev => prev.filter(m => m.id !== id)); await supabase.from('meal_plan').delete().eq('id', id).eq('user_id', userId); };

  const handleAddShoppingItem = async (e: React.FormEvent) => {
    e.preventDefault(); if (!shoppingInputName.trim()) return;
    await addOrMergeShoppingItem({ name: shoppingInputName.trim(), quantity: parseFloat(shoppingInputQty) || 1, unit: shoppingInputUnit });
    setShoppingInputName(''); setShoppingInputQty('1'); setShoppingInputUnit('pcs'); setShowShoppingInput(false); showToast('Added to list!');
  };

  const toggleShoppingItem = async (id: string) => {
    const item = shoppingList.find(i => i.id === id); if (!item) return;
    setShoppingList(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
    await supabase.from('shopping_list').update({ checked: !item.checked }).eq('id', id).eq('user_id', userId);
  };

  const deleteShoppingItem = async (id: string) => { setShoppingList(prev => prev.filter(item => item.id !== id)); await supabase.from('shopping_list').delete().eq('id', id).eq('user_id', userId); };

  const removeCheckedShoppingItems = async () => {
    const checkedIds = shoppingList.filter(item => item.checked).map(item => item.id);
    if (checkedIds.length === 0) return;
    setShoppingList(prev => prev.filter(item => !item.checked));
    await supabase.from('shopping_list').delete().in('id', checkedIds).eq('user_id', userId);
    showToast('Checked items removed.');
  };

  /* ==========================================================================
     8. COMPUTED DATA FOR RENDERING
     ========================================================================== */
  const trackedItemsList = items.filter(i => i.track_low_stock);
  const untrackedItemsList = items.filter(i => !i.track_low_stock);
  const lowStockItems = trackedItemsList.filter(i => i.quantity <= (i.low_stock_threshold || 1));
  const todaysMeals = mealPlans.filter(m => m.date === todayStr);
  const uniqueRecipeCategories = ['All', ...Array.from(new Set((recipes || []).map(r => r?.category).filter(Boolean)))];
  const hasCheckedShoppingItems = shoppingList.some(item => item.checked);
  
  const filteredRecipes = (recipes || []).filter(r => 
    (r?.title || '').toLowerCase().includes(recipeSearchQuery.toLowerCase()) && 
    (recipeCategoryFilter === 'All' || r?.category === recipeCategoryFilter)
  );
  
  const visiblePantryItems = items.filter(i => i.quantity > 0);
  const groupedItems = visiblePantryItems.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || []; acc[item.category].push(item); return acc;
  }, {} as Record<string, PantryItem[]>);

  const groupedShoppingList = shoppingList.reduce((acc, item) => {
    const aisle = getAisle(item.name);
    acc[aisle] = acc[aisle] || []; acc[aisle].push(item); return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const getIngredientStatus = (ingredient: string, pantry: PantryItem[]) => {
    const lowerIng = (ingredient || '').toLowerCase(); 
    const match = (pantry || []).find(p => lowerIng.includes((p.name || '').toLowerCase()));
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
    setLoading(true);
    const rawMissing = (recipe.ingredients || []).map(ing => scaleAndConvertIngredient(ing, currentMultiplier, measurementSystem)).filter(scaledIng => getIngredientStatus(scaledIng, items).status !== 'in_stock');
    if (rawMissing.length === 0) { showToast('You already have all ingredients!'); setLoading(false); return; }
    
    for (const rawIng of rawMissing) {
      const match = rawIng.match(/^([\d.]+)?\s*(?:\b(kg|g|lbs|oz|ml|l|cups|tbsp|tsp|cans|packs|pcs|pinch|dash|cloves)\b)?\s*(.*)$/i);
      let qty = parseFloat(match?.[1] || '1') || 1;
      let unit = (match?.[2] || 'pcs').toLowerCase();
      let rawName = match?.[3] || rawIng;
      let cleanName = cleanIngredientName(rawName);
      const standard = getStandardGroceryItem(`${qty} ${unit} ${cleanName}`);
      const stdMatch = standard.match(/^([\d.]+)?\s*(?:\b(kg|g|lbs|oz|ml|l|cups|tbsp|tsp|cans|packs|pcs|pinch|dash|cloves)\b)?\s*(.*)$/i);
      let finalQty = parseFloat(stdMatch?.[1] || '1') || 1;
      let finalUnit = (stdMatch?.[2] || unit).toLowerCase();
      let finalName = stdMatch?.[3] || standard;

      if (!stdMatch?.[1]) { finalQty = 1; finalUnit = 'pcs'; finalName = standard; }

      await addOrMergeShoppingItem({ name: finalName, quantity: finalQty, unit: finalUnit });
    }
    showToast('Missing ingredients added!');
    setLoading(false);
  };

  const multiplier = selectedRecipe ? (targetPortions / (selectedRecipe.portions || 4)) : 1;
  const totalAllocated = Object.values(allocationsGrid).reduce((a, b) => a + b, 0);
  const remainingPortions = planTargetPortions - totalAllocated;

  if (!isMounted) return null; // Hydration protection

  /* ==========================================================================
     9. RENDER JSX
     ========================================================================== */
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[url('/background.jpg')] bg-cover bg-center bg-fixed text-black p-4 pb-28 md:p-8 md:pb-8 font-montserrat">
      
      <datalist id="common-units">{COMMON_UNITS.map(u => <option key={u} value={u} />)}</datalist>

      {/* --- GLOBAL TOAST NOTIFICATION --- */}
      {toast && (
        <div className="fixed inset-x-0 top-10 flex items-center justify-center z-[100] px-4 pointer-events-none">
          <div className="bg-black text-white px-6 py-4 rounded-2xl shadow-2xl font-bold text-center animate-in fade-in slide-in-from-top-4 pointer-events-auto">
            {toast}
          </div>
        </div>
      )}

      {/* --- EXTRACTED NAVIGATION & MODALS --- */}
      <TopHeader activeTab={activeTab} handleTabChange={handleTabChange} setShowAccountModal={setShowAccountModal} />
      
      <AccountSettingsModal 
        showModal={showAccountModal} 
        setShowModal={setShowAccountModal} 
        userEmail={userEmail} 
        newEmail={newEmail} 
        setNewEmail={setNewEmail} 
        newPassword={newPassword} 
        setNewPassword={setNewPassword} 
        handleUpdateAccount={handleUpdateAccount} 
        handleSignOut={handleSignOut} 
        loading={loading} 
      />

      {/* --- MODALS RETAINED IN PAGE.TSX --- */}
      {showBarcodeScanner && (
        <div className="fixed inset-0 bg-black/90 z-[120] flex flex-col items-center justify-center p-4">
          <div className="bg-[#6B705C] p-6 md:p-8 rounded-[32px] shadow-2xl w-full max-w-sm flex flex-col items-center gap-6 text-white border border-black/10 animate-in fade-in zoom-in-95">
             <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">Scan Barcode</h2>
                <p className="text-white/80 text-sm">Align the barcode within the frame</p>
             </div>
             <div id="barcode-reader" className="w-full rounded-2xl overflow-hidden shadow-inner bg-black"></div>
             <button onClick={() => setShowBarcodeScanner(false)} className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-100 shadow-sm transition">Cancel</button>
          </div>
        </div>
      )}

      {pantryActionMenu.isOpen && pantryActionMenu.item && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity" onClick={() => setPantryActionMenu({isOpen: false, item: null})}>
           <div className="bg-white w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-6 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-xl mb-6 text-center border-b border-black/10 pb-4">{pantryActionMenu.item.name}</h3>
              <div className="bg-black/5 rounded-2xl p-4 mb-4 flex items-center justify-between shadow-sm">
                 <span className="font-semibold text-xs uppercase tracking-wider text-black/60">Amount</span>
                 <div className="flex items-center gap-3">
                    <button onClick={() => adjustQuantity(pantryActionMenu.item!, -1)} className="w-8 h-8 rounded-lg bg-white shadow-sm font-bold flex items-center justify-center hover:bg-black/5">-</button>
                    <span className="font-bold min-w-[3rem] text-center text-sm">{pantryActionMenu.item.quantity} {pantryActionMenu.item.unit}</span>
                    <button onClick={() => adjustQuantity(pantryActionMenu.item!, 1)} className="w-8 h-8 rounded-lg bg-white shadow-sm font-bold flex items-center justify-center hover:bg-black/5">+</button>
                 </div>
              </div>
              <div className="flex flex-col gap-2">
                 <button onClick={() => { startEditing(pantryActionMenu.item!); setPantryActionMenu({isOpen: false, item: null}); }} className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition shadow-sm">Edit Details</button>
                 <button onClick={() => { deleteItem(pantryActionMenu.item!.id); setPantryActionMenu({isOpen: false, item: null}); }} className="w-full py-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl font-bold transition mt-2 shadow-sm">Remove Item</button>
              </div>
           </div>
        </div>
      )}

      {editingPantryItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-[32px] p-6 md:p-8 w-full max-w-md shadow-2xl flex flex-col gap-4 animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-2 border-b border-black/10 pb-4 shrink-0">
               <h2 className="text-2xl font-bold text-black">Edit Item</h2>
               <button onClick={() => setEditingPantryItem(null)} className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 text-black font-bold">✕</button>
             </div>
             <div className="space-y-4 mt-2 overflow-y-auto pr-1 flex-1">
               <div className="space-y-1.5 relative z-20">
                 <label className="text-xs font-bold uppercase tracking-wider text-black/60">Item Name</label>
                 <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-black/5 focus:outline-none border border-transparent focus:border-[#6B705C] text-black font-medium" />
               </div>
               <div className="space-y-1.5 relative z-10">
                 <label className="text-xs font-bold uppercase tracking-wider text-black/60">Category</label>
                 <CustomSelect value={editCategory} onChange={setEditCategory} options={dynamicCategories.map(c => ({label: c, value: c}))} className="w-full bg-black/5 rounded-xl border border-transparent" />
               </div>
               <div className="flex gap-4 relative z-0">
                 <div className="space-y-1.5 flex-1">
                   <label className="text-xs font-bold uppercase tracking-wider text-black/60">Quantity</label>
                   <input type="number" step="any" min="0" value={editQuantity} onChange={e => setEditQuantity(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-black/5 focus:outline-none border border-transparent focus:border-[#6B705C] text-black font-medium text-center" />
                 </div>
                 <div className="space-y-1.5 flex-1">
                   <label className="text-xs font-bold uppercase tracking-wider text-black/60">Unit</label>
                   <CustomSelect value={editUnit} onChange={setEditUnit} options={COMMON_UNITS.map(u => ({label: u, value: u}))} className="w-full bg-black/5 rounded-xl border border-transparent" />
                 </div>
               </div>
             </div>
             <div className="pt-2 shrink-0">
                <button onClick={() => saveEdit(editingPantryItem.id)} className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-black/80 shadow-sm transition">Save Changes</button>
             </div>
          </div>
        </div>
      )}

      {recipeActionMenu.isOpen && recipeActionMenu.recipe && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity" onClick={() => setRecipeActionMenu({isOpen: false, recipe: null})}>
           <div className="bg-white w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-6 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-xl mb-4 text-center px-4 leading-tight">{recipeActionMenu.recipe.title}</h3>
              <div className="flex flex-col gap-2">
                 <button onClick={() => { handleOpenRecipe(recipeActionMenu.recipe!); setRecipeActionMenu({isOpen: false, recipe: null}); }} className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition">View Recipe</button>
                 <button onClick={() => { handleTabChange('planner'); setRecipeActionMenu({isOpen: false, recipe: null}); }} className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition">Add to Planner</button>
                 <button onClick={() => { deleteRecipe(recipeActionMenu.recipe!.id); setRecipeActionMenu({isOpen: false, recipe: null}); }} className="w-full py-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl font-bold transition mt-2">Delete Recipe</button>
              </div>
           </div>
        </div>
      )}

      {scannedItems && scannedItems.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
           <div className="bg-white rounded-[32px] w-full max-w-2xl p-6 md:p-8 flex flex-col max-h-[90vh] animate-in zoom-in-95">
             <h2 className="text-2xl font-bold mb-4">Review Scanned Items</h2>
             <div className="overflow-y-auto flex-1 space-y-3 pr-2">
               {scannedItems.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 bg-black/5 p-3 rounded-2xl relative z-0 hover:z-10">
                    <input value={item.name} onChange={e => updateScannedItem(index, 'name', e.target.value)} className="flex-1 px-3 py-2 rounded-xl focus:outline-none placeholder:text-black/50" placeholder="Item Name" />
                    <div className="flex gap-2">
                      <input type="number" step="any" value={item.quantity || 1} onChange={e => updateScannedItem(index, 'quantity', e.target.value)} className="w-16 px-2 py-2 rounded-xl text-center focus:outline-none" />
                      <CustomSelect value={item.unit || 'pcs'} onChange={v => updateScannedItem(index, 'unit', v)} options={COMMON_UNITS.map(u => ({label: u, value: u}))} className="w-24 bg-white rounded-xl" />
                    </div>
                    <CustomSelect value={item.category || 'Other'} onChange={v => updateScannedItem(index, 'category', v)} options={CATEGORIES.map(c => ({label: c.name, value: c.name}))} className="w-full sm:w-28 bg-white rounded-xl" />
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
              <button onClick={saveMealPlan} disabled={remainingPortions !== 0 || loading} className="w-full py-4 rounded-2xl font-bold text-lg bg-black text-white hover:bg-black/80 disabled:opacity-50 transition shadow-sm">
                {loading ? 'Saving...' : remainingPortions === 0 ? 'Confirm Meal Plan' : `Allocate exactly ${planTargetPortions} portions`}
              </button>
            </div>
          </div>
        </div>
      )}

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
                <div className="space-y-1.5 relative z-10">
                  <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Category</label>
                  <CustomSelect value={manualRecipe.category} onChange={v => setManualRecipe({...manualRecipe, category: v})} options={uniqueRecipeCategories.map(c => ({label: c, value: c}))} className="w-full bg-white rounded-xl border border-black/20 shadow-sm" />
                </div>
                <div className="space-y-1.5 relative z-0">
                  <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Cook Time</label>
                  <input type="text" value={manualRecipe.cook_time} onChange={e => setManualRecipe({...manualRecipe, cook_time: e.target.value})} className="w-full p-3 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm" placeholder="e.g. 45 mins" />
                </div>
                <div className="space-y-1.5 relative z-0">
                  <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Portions</label>
                  <input type="number" value={manualRecipe.portions} onChange={e => setManualRecipe({...manualRecipe, portions: parseInt(e.target.value) || 1})} className="w-full p-3 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm" />
                </div>
              </div>
              <div className="space-y-1.5 mt-6">
                <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Ingredients</label>
                <textarea value={manualRecipe.ingredientsText} onChange={e => setManualRecipe({...manualRecipe, ingredientsText: e.target.value})} className="w-full p-4 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm min-h-[150px]" placeholder="Paste one or multiple ingredients (each on a new line)..." />
                <p className="text-xs text-black/50">Press Enter for a new ingredient.</p>
              </div>
              <div className="space-y-1.5 mt-6">
                <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Instructions</label>
                <textarea value={manualRecipe.instructionsText} onChange={e => setManualRecipe({...manualRecipe, instructionsText: e.target.value})} className="w-full p-4 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm min-h-[150px]" placeholder="Paste one or multiple steps (each on a new line)..." />
                <p className="text-xs text-black/50">Press Enter for a new step.</p>
              </div>
            </div>
            <div className="pt-6 mt-4 border-t border-black/10 shrink-0 flex gap-3">
               <button onClick={() => setShowManualAddRecipe(false)} className="flex-1 py-4 rounded-2xl font-bold text-lg border border-black/20 bg-transparent text-black hover:bg-black/5 transition">Cancel</button>
               <button onClick={saveManualRecipe} disabled={loading} className="flex-1 py-4 rounded-2xl font-bold text-lg bg-black text-white hover:bg-black/80 disabled:opacity-50 transition shadow-sm">{loading ? 'Saving...' : 'Save Recipe'}</button>
            </div>
          </div>
        </div>
      )}

      {recipePickerTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
          <div className="w-full max-w-lg rounded-[32px] p-6 bg-white border border-black/20 shadow-2xl flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95">
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

      {/* --- EXTRACTED DYNAMIC TABS --- */}
      {!showVoiceInputScreen && (
        <div className="max-w-6xl mx-auto space-y-8 mt-6">
          {activeTab === 'lowstock' && !selectedRecipe && (
            <LowStockTab 
              handleBackNavigation={handleBackNavigation} lowStockDropdownRef={lowStockDropdownRef} 
              showAddTrackMenu={showAddTrackMenu} setShowAddTrackMenu={setShowAddTrackMenu} 
              setShowTrackPantryInput={setShowTrackPantryInput} setShowTrackNewInput={setShowTrackNewInput} 
              addLowStockToShopping={addLowStockToShopping} lowStockItems={lowStockItems} 
              showTrackPantryInput={showTrackPantryInput} itemToTrackId={itemToTrackId} 
              setItemToTrackId={setItemToTrackId} untrackedItemsList={untrackedItemsList} 
              enableTrackingForId={enableTrackingForId} showTrackNewInput={showTrackNewInput} 
              addNewTrackedItem={addNewTrackedItem} newTrackName={newTrackName} 
              setNewTrackName={setNewTrackName} handleNewTrackNameChange={handleNewTrackNameChange} 
              newTrackCategory={newTrackCategory} setNewTrackCategory={setNewTrackCategory} 
              dynamicCategories={dynamicCategories} newTrackUnit={newTrackUnit} 
              setNewTrackUnit={setNewTrackUnit} COMMON_UNITS={COMMON_UNITS} loading={loading} 
              trackedItemsList={trackedItemsList} updateLowStockThreshold={updateLowStockThreshold} 
              disableTrackingForId={disableTrackingForId} adjustQuantity={adjustQuantity} 
            />
          )}

          {selectedRecipe && isEditingRecipe && (
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
                    <div className="space-y-1.5 relative z-10">
                      <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Category</label>
                      <CustomSelect value={editRecipeForm.category} onChange={v => setEditRecipeForm({...editRecipeForm, category: v})} options={uniqueRecipeCategories.map(c => ({label: c, value: c}))} className="w-full bg-white rounded-xl border border-black/20 shadow-sm" />
                    </div>
                    <div className="space-y-1.5 relative z-0">
                      <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Cook Time</label>
                      <input type="text" value={editRecipeForm.cook_time} onChange={e => setEditRecipeForm({...editRecipeForm, cook_time: e.target.value})} className="w-full p-3 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm" />
                    </div>
                    <div className="space-y-1.5 relative z-0">
                      <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Base Portions</label>
                      <input type="number" value={editRecipeForm.portions} onChange={e => setEditRecipeForm({...editRecipeForm, portions: parseInt(e.target.value) || 1})} className="w-full p-3 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm" />
                    </div>
                 </div>
                 <div className="space-y-1.5 mt-4">
                    <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Ingredients</label>
                    <textarea value={editRecipeForm.ingredientsText} onChange={e => setEditRecipeForm({...editRecipeForm, ingredientsText: e.target.value})} className="w-full p-4 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm min-h-[150px]" />
                 </div>
                 <div className="space-y-1.5 mt-4">
                    <label className="text-sm font-semibold uppercase tracking-wider text-black/70">Instructions</label>
                    <textarea value={editRecipeForm.instructionsText} onChange={e => setEditRecipeForm({...editRecipeForm, instructionsText: e.target.value})} className="w-full p-4 rounded-xl border border-black/20 focus:outline-none focus:border-[#6B705C] bg-white shadow-sm min-h-[150px]" />
                 </div>
                 <div className="pt-6 border-t border-black/10 shrink-0 flex gap-3">
                   <button onClick={() => setIsEditingRecipe(false)} className="flex-1 py-4 rounded-2xl font-bold text-lg border border-black/20 bg-transparent text-black hover:bg-black/5 transition">Cancel</button>
                   <button onClick={saveEditedRecipe} disabled={loading} className="flex-1 py-4 rounded-2xl font-bold text-lg bg-black text-white hover:bg-black/80 disabled:opacity-50 transition shadow-sm">{loading ? 'Saving...' : 'Save Changes'}</button>
                 </div>
              </div>
            </div>
          )}

          {selectedRecipe && !isEditingRecipe && (
            <div className="space-y-6">
              <button onClick={handleBackNavigation} className="flex items-center gap-2 text-black/70 hover:text-black font-semibold transition">&larr; Back to Recipes</button>
              <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-black/10">
                {selectedRecipe.image && <img src={selectedRecipe.image} alt={selectedRecipe.title} className="w-full h-64 md:h-96 object-cover" />}
                <div className="bg-[#6B705C] text-white p-6 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex-1">
                    <h2 className="text-4xl md:text-5xl font-bold leading-snug">{selectedRecipe.title}</h2>
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
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/5 p-4 rounded-2xl border border-black/5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-black/60">Portions:</span>
                          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-black/10 shadow-sm text-black">
                            <button onClick={() => setTargetPortions(Math.max(1, targetPortions - 1))} className="w-6 h-6 rounded-md bg-black text-white hover:bg-black/80 font-bold text-sm flex items-center justify-center">-</button>
                            <span className="w-6 text-center font-bold text-sm">{targetPortions}</span>
                            <button onClick={() => setTargetPortions(targetPortions + 1)} className="w-6 h-6 rounded-md bg-black text-white hover:bg-black/80 font-bold text-sm flex items-center justify-center">+</button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-black/60">Units:</span>
                          <div className="flex items-center bg-white rounded-lg p-1 border border-black/10 shadow-sm text-black">
                            <button onClick={() => setMeasurementSystem('metric')} className={`px-3 py-1 rounded-md text-xs font-bold transition ${measurementSystem === 'metric' ? 'bg-black text-white' : 'hover:bg-black/5'}`}>Metric</button>
                            <button onClick={() => setMeasurementSystem('imperial')} className={`px-3 py-1 rounded-md text-xs font-bold transition ${measurementSystem === 'imperial' ? 'bg-black text-white' : 'hover:bg-black/5'}`}>Imperial</button>
                          </div>
                        </div>
                      </div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-black/80 mt-2">Ingredients {multiplier !== 1 && <span className="text-emerald-700 normal-case font-medium ml-2">(Scaled {multiplier}x)</span>}</h3>
                      <div className="space-y-0">
                        {(selectedRecipe.ingredients || []).map((ing, i) => {
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
                      {(selectedRecipe.instructions || []).length ? (selectedRecipe.instructions || []).map((step, idx) => {
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
          )}

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
              pantryDropdownRef={pantryDropdownRef} showAddPantryMenu={showAddPantryMenu} 
              setShowAddPantryMenu={setShowAddPantryMenu} showPantryInput={showPantryInput} 
              setShowPantryInput={setShowPantryInput} name={name} useStateName={useStateName} 
              handleNameChange={handleNameChange} category={category} setCategory={setCategory} 
              setIsManualCategory={setIsManualCategory} dynamicCategories={dynamicCategories} 
              quantity={quantity} setQuantity={setQuantity} unit={unit} setUnit={setUnit} 
              COMMON_UNITS={COMMON_UNITS} loading={loading} addItem={addItem} 
              setShowBarcodeScanner={setShowBarcodeScanner} setVoiceContext={setVoiceContext} 
              setShowVoiceInputScreen={setShowVoiceInputScreen} isScanning={isScanning} 
              fileInputRef={fileInputRef} groupedItems={groupedItems} editingId={editingId} 
              setEditingId={setEditingId} editName={editName} setEditName={setEditName} 
              editCategory={editCategory} setEditCategory={setEditCategory} editQuantity={editQuantity} 
              setEditQuantity={setEditQuantity} editUnit={editUnit} setEditUnit={setEditUnit} 
              saveEdit={saveEdit} setPantryActionMenu={setPantryActionMenu} 
              visiblePantryItems={visiblePantryItems}
            />
          )}

          {!selectedRecipe && activeTab === 'shopping' && (
            <ShoppingTab 
              shoppingDropdownRef={shoppingDropdownRef} showAddShoppingMenu={showAddShoppingMenu} 
              setShowAddShoppingMenu={setShowAddShoppingMenu} showShoppingInput={showShoppingInput} 
              setShowShoppingInput={setShowShoppingInput} shoppingInputName={shoppingInputName} 
              setShoppingInputName={setShoppingInputName} shoppingInputQty={shoppingInputQty} 
              setShoppingInputQty={setShoppingInputQty} shoppingInputUnit={shoppingInputUnit} 
              setShoppingInputUnit={setShoppingInputUnit} COMMON_UNITS={COMMON_UNITS} loading={loading} 
              handleAddShoppingItem={handleAddShoppingItem} setVoiceContext={setVoiceContext} 
              setShowVoiceInputScreen={setShowVoiceInputScreen} addLowStockToShopping={addLowStockToShopping} 
              lowStockItems={lowStockItems} hasCheckedShoppingItems={hasCheckedShoppingItems} 
              removeCheckedShoppingItems={removeCheckedShoppingItems} groupedShoppingList={groupedShoppingList} 
              toggleShoppingItem={toggleShoppingItem} deleteShoppingItem={deleteShoppingItem} 
            />
          )}

          {!selectedRecipe && activeTab === 'recipes' && (
            <RecipesTab 
              recipeSearchQuery={recipeSearchQuery} setRecipeSearchQuery={setRecipeSearchQuery} 
              recipeCategoryFilter={recipeCategoryFilter} setRecipeCategoryFilter={setRecipeCategoryFilter} 
              uniqueRecipeCategories={uniqueRecipeCategories} recipeViewMode={recipeViewMode} 
              setRecipeViewMode={setRecipeViewMode} recipeDropdownRef={recipeDropdownRef} 
              showAddRecipeMenu={showAddRecipeMenu} setShowAddRecipeMenu={setShowAddRecipeMenu} 
              setShowManualAddRecipe={setShowManualAddRecipe} showImportInput={showImportInput} 
              setShowImportInput={setShowImportInput} handleImportRecipe={handleImportRecipe} 
              importUrl={importUrl} setImportUrl={setImportUrl} isImporting={isImporting} 
              filteredRecipes={filteredRecipes} handleOpenRecipe={handleOpenRecipe} 
              setRecipeActionMenu={setRecipeActionMenu} 
            />
          )}

          {!selectedRecipe && activeTab === 'planner' && (
            <PlannerTab 
              next7Days={next7Days} todayStr={todayStr} mealPlans={mealPlans} 
              collapsedDays={collapsedDays} setCollapsedDays={setCollapsedDays} 
              recipes={recipes} handleOpenRecipe={handleOpenRecipe} 
              deleteMealPlan={deleteMealPlan} setRecipePickerTarget={setRecipePickerTarget} 
              manualInputs={manualInputs} setManualInputs={setManualInputs} 
              saveManualMeal={saveManualMeal} manualInputsQty={manualInputsQty} 
              setManualInputsQty={setManualInputsQty} 
            />
          )}
        </div>
      )}

      {/* --- EXTRACTED MOBILE BOTTOM NAVIGATION BAR --- */}
      <BottomNav activeTab={activeTab} handleTabChange={handleTabChange} showVoiceInputScreen={showVoiceInputScreen} />

    </main>
  );
}