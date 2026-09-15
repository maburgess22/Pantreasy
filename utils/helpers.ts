import foodKeeperData from './foodKeeperData.json';

export function toBaseUnit(qty: number, unit: string) {
  const map: Record<string, number> = {
    'kg': 1000, 'g': 1, 'lbs': 453.592, 'oz': 28.3495,
    'l': 1000, 'ml': 1, 'tbsp': 15, 'tsp': 5, 'cups': 240,
    'pcs': 1, 'cloves': 1, 'pinch': 1, 'dash': 1, 'packs': 1, 'cans': 1
  };
  const baseQty = qty * (map[unit.toLowerCase()] || 1);
  return { 
    qty: baseQty, 
    base: ['kg', 'g', 'lbs', 'oz'].includes(unit.toLowerCase()) ? 'weight' : 
          ['l', 'ml', 'cups', 'tbsp', 'tsp'].includes(unit.toLowerCase()) ? 'volume' : 'count' 
  };
}

export function fromBaseUnit(baseQty: number, baseType: string) {
  if (baseType === 'weight') return baseQty >= 1000 ? { qty: Number((baseQty / 1000).toFixed(2)), unit: 'kg' } : { qty: Math.round(baseQty), unit: 'g' };
  if (baseType === 'volume') return baseQty >= 1000 ? { qty: Number((baseQty / 1000).toFixed(2)), unit: 'l' } : { qty: Math.round(baseQty), unit: 'ml' };
  return { qty: Math.round(baseQty), unit: 'pcs' };
}

export function scaleAndConvertIngredient(ingStr: string, multiplier: number, system: 'metric' | 'imperial'): string {
  const match = ingStr.match(/^([\d.\/]+)?\s*(kg|g|lbs|oz|ml|l|cups|tbsp|tsp|cans|packs|pcs|pinch|dash|cloves)?\s*(.*)$/i);
  if (!match) return ingStr;

  let qty = parseFloat(match[1] || '1') * multiplier;
  let unit = (match[2] || 'pcs').toLowerCase();
  const name = match[3] || '';

  if (system === 'metric') {
    if (unit === 'lbs') { qty = qty * 453.592; unit = 'g'; }
    if (unit === 'oz') { qty = qty * 28.3495; unit = 'g'; }
    if (unit === 'cups') { qty = qty * 240; unit = 'ml'; }
    if (unit === 'g' && qty >= 1000) { qty = qty / 1000; unit = 'kg'; }
    if (unit === 'ml' && qty >= 1000) { qty = qty / 1000; unit = 'l'; }
  } else if (system === 'imperial') {
    if (unit === 'kg') { qty = qty * 2.20462; unit = 'lbs'; }
    if (unit === 'g' && qty < 1000) { qty = qty / 28.3495; unit = 'oz'; }
    if (unit === 'g' && qty >= 1000) { qty = (qty / 1000) * 2.20462; unit = 'lbs'; }
    if (unit === 'l') { qty = (qty * 1000) / 240; unit = 'cups'; }
    if (unit === 'ml') { qty = qty / 240; unit = 'cups'; }
  }

  const formattedQty = qty % 1 === 0 ? qty.toString() : qty.toFixed(2).replace(/\.00$/, '');
  return `${formattedQty} ${unit} ${name}`.replace(/\s+/g, ' ').trim();
}

export function cleanIngredientName(name: string) {
  return name.replace(/\b(organic|fresh|premium|quality|brand|frozen|canned|tinned)\b/ig, '')
             .replace(/[0-9.,\-'"&()]/g, '')
             .replace(/\s+/g, ' ')
             .trim();
}

export function getStandardGroceryItem(str: string) {
  return str; 
}

export function getAisle(itemName: string) {
  const lower = itemName.toLowerCase();
  
  if (/(tofu|tempeh|seitan|quorn|beyond|impossible|meatless|vegan|vegetarian|plant-based|plant based)/.test(lower)) return 'Vegetarian Products';
  if (/(milk|cheese|yogurt|butter|egg|cream)/.test(lower)) return 'Dairy & Eggs';
  if (/(chicken|beef|pork|lamb|sausage|bacon|turkey)/.test(lower)) return 'Meat & Poultry';
  if (/(fish|salmon|tuna|shrimp|prawn|cod|crab|lobster|seafood)/.test(lower)) return 'Seafood';
  if (/(apple|banana|berry|tomato|lettuce|onion|garlic|potato|carrot|pepper|spinach|broccoli|fruit|veg|avocado|avacado|mushroom|celery|cabbage|melon|orange|lemon|lime|grape)/.test(lower)) return 'Produce';
  if (/(bread|bagel|bun|pastry|croissant|muffin|cake)/.test(lower)) return 'Bakery';
  if (/(spice|herb|salt|pepper|sauce|ketchup|mustard|mayo|dressing|vinegar|syrup|honey)/.test(lower)) return 'Spices & Condiments';
  if (/(rice|pasta|flour|sugar|oil|canned|bean|lentil|broth|soup|cereal|oat)/.test(lower)) return 'Pantry Staples';
  if (/(water|juice|soda|coffee|tea|beer|wine|liquor)/.test(lower)) return 'Beverages';
  if (/(chip|crisp|cookie|chocolate|candy|nut|popcorn)/.test(lower)) return 'Snacks & Sweets';
  if (/(pizza|ice cream|frozen)/.test(lower)) return 'Frozen Foods';
  if (/(deli|hummus|prepared|salad kit)/.test(lower)) return 'Deli & Prepared Foods';
  if (/(soap|clean|detergent|paper towel|trash|foil|tissue)/.test(lower)) return 'Household & Cleaning';
  if (/(shampoo|lotion|toothpaste|medicine|vitamin|dental)/.test(lower)) return 'Health & Personal Care';
  if (/(dog|cat|pet)/.test(lower)) return 'Pet Care';
  
  return 'Other';
}

export const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; const MAX_HEIGHT = 800;
        let width = img.width; let height = img.height;
        if (width > height && width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } 
        else if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) { const compressedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }); resolve(compressedFile); } 
          else { reject(new Error('Canvas is empty')); }
        }, 'image/jpeg', 0.7);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export function normalizeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

export function getNext7Days() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

// --- OFFICAL USDA FOODKEEPER INTEGRATION ---

let usdaCache: any[] | null = null;

export async function fetchUSDAFoodKeeper() {
  if (usdaCache) return usdaCache;
  
  try {
    // 1. Check if we already cached the huge JSON in the browser to save data
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('usda_foodkeeper_cache');
      if (stored) {
        usdaCache = JSON.parse(stored);
        if (usdaCache && usdaCache.length > 0) return usdaCache;
      }
    }

    // 2. Reach out to the official government endpoint
    const res = await fetch('https://www.fsis.usda.gov/shared/data/EN/FoodKeeper-Data.json');
    const data = await res.json();
    
    // 3. Drill down into the specific "Product" sheet
    const productsSheet = data.sheets?.find((s: any) => s.name === 'Product');
    if (!productsSheet || !productsSheet.data) return null;

    // 4. Translate USDA's complex matrix into simple { keywords, days } objects
    const parsedProducts = productsSheet.data.map((p: any) => {
      let days = null;
      
      const toDays = (max: number, metric: string) => {
        if (!max || !metric) return null;
        const m = metric.toLowerCase();
        if (m.includes('day')) return max;
        if (m.includes('week')) return max * 7;
        if (m.includes('month')) return max * 30;
        if (m.includes('year')) return max * 365;
        return null;
      };

      // Prefer Fridge estimates, then Pantry if not refrigerated
      days = toDays(p.DOP_Refrigerate_Max, p.DOP_Refrigerate_Metric) || 
             toDays(p.DOP_Pantry_Max, p.DOP_Pantry_Metric);

      const keywords = (p.Keywords || '').split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean);
      const name = (p.Name || '').toLowerCase().trim();
      if (name && !keywords.includes(name)) keywords.push(name);

      return { keywords, days };
    }).filter((p: any) => p.days !== null);

    usdaCache = parsedProducts;
    
    // 5. Store it permanently
    if (typeof window !== 'undefined') {
      localStorage.setItem('usda_foodkeeper_cache', JSON.stringify(parsedProducts));
    }
    return usdaCache;
  } catch (err) {
    console.warn("USDA Fetch failed, falling back to local foodKeeperData.json", err);
    return null; // Will fallback to the JSON file safely
  }
}

export function extractCoreItemName(fullName: string): string[] {
  let cleaned = fullName.toLowerCase();
  cleaned = cleaned.replace(/[0-9.,\-'"&()]/g, ' ');
  
  const stopWords = [
    'organic', 'fresh', 'premium', 'quality', 'brand', 'frozen', 'canned', 
    'tinned', 'pcs', 'kg', 'g', 'lbs', 'oz', 'ml', 'l', 'pack', 'cans', 
    'the', 'a', 'an', 'with', 'and', 'value', 'farm', 'farms', 'free', 'range',
    'sainsburys', 'sainsbury', 'tesco', 'asda', 'aldi', 'lidl', 'waitrose', 
    'morrisons', 'marks', 'spencer', 'co-op', 'kroger', 'walmart', 'trader', 'joes', 'whole'
  ];
  
  return cleaned.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
}

export async function getEstimatedShelfLifeDays(itemName: string): Promise<number | null> {
  const normalized = itemName.toLowerCase().trim();
  
  // Pull the USDA database, OR fall back to the local file if offline
  const usdaData = await fetchUSDAFoodKeeper();
  const dbToUse = (usdaData && usdaData.length > 0) ? usdaData : foodKeeperData;

  for (const entry of dbToUse) {
    if (entry.keywords.some((k: string) => normalized.includes(k) || k.includes(normalized))) {
      return entry.days;
    }
  }

  const coreWords = extractCoreItemName(itemName);
  for (const entry of dbToUse) {
    for (const keyword of entry.keywords) {
       if (coreWords.some((word: string) => keyword.includes(word) || word.includes(keyword))) {
         return entry.days;
       }
    }
  }
  
  return null;
}

export async function computeExpiryDate(itemName: string, fromDate = new Date()): Promise<string | null> {
  // Because it now fetches online data, this function is now asynchronous (await)
  const days = await getEstimatedShelfLifeDays(itemName);
  if (!days) return null;

  const targetDate = new Date(fromDate);
  targetDate.setDate(targetDate.getDate() + days);
  return targetDate.toISOString().split('T')[0];
}

export function getExpiryStatus(expirationDateStr?: string | null): { 
  label: string; 
  color: 'expired' | 'warning' | 'good' | 'none';
  daysRemaining: number | null;
} {
  if (!expirationDateStr) {
    return { label: 'No date', color: 'none', daysRemaining: null };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = expirationDateStr.split('-').map(Number);
  const expiry = new Date(year, month - 1, day);
  expiry.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `Expired`, color: 'expired', daysRemaining: diffDays };
  }
  if (diffDays === 0) {
    return { label: 'Expires today', color: 'expired', daysRemaining: 0 };
  }
  if (diffDays <= 3) {
    return { label: `Expires in ${diffDays}d`, color: 'warning', daysRemaining: diffDays };
  }
  return { label: `Expires in ${diffDays}d`, color: 'good', daysRemaining: diffDays };
}