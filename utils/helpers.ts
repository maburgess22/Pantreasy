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

export function learnItemCategory(itemName: string, category: string) {
  if (typeof window !== 'undefined') {
    try {
      const learned = localStorage.getItem('learnedCategories');
      const parsed = learned ? JSON.parse(learned) : {};
      parsed[itemName.toLowerCase().trim()] = category;
      localStorage.setItem('learnedCategories', JSON.stringify(parsed));
    } catch(e) { console.warn("Failed to learn category", e); }
  }
}

// --- UPDATED: HIERARCHY-INVERTED DICTIONARY ---
export function getAisle(itemName: string) {
  const lower = itemName.toLowerCase().trim();
  
  // 1. SMART OVERRIDES: Always trust user-taught preferences first
  if (typeof window !== 'undefined') {
    try {
      const learned = localStorage.getItem('learnedCategories');
      if (learned) {
        const parsed = JSON.parse(learned);
        if (parsed[lower]) return parsed[lower];
      }
    } catch(e) {}
  }

  // 2. EXTREMELY SPECIFIC NON-FOODS
  if (/(soap|clean|detergent|paper towel|trash|foil|tissue|bleach|sponge|mop|broom|wipe|spray|polish|softener|wrapper|ziploc|bag|parchment|napkin|plate|cup|cutlery|battery|bulb|fairy|persil|ariel|lenor|comfort|bold|daz|surf|cif|flash|mr muscle|toilet roll|kitchen roll|bin bag|trash bag|cling film|baking paper|washing up liquid|dishwasher|scourer|cloth|air freshener|lightbulb|match|lighter)/.test(lower)) return 'Household & Cleaning';
  if (/(shampoo|lotion|toothpaste|medicine|vitamin|dental|deodorant|body wash|conditioner|razor|shaving|tampon|pad|diaper|band-aid|plaster|advil|tylenol|ibuprofen|paracetamol|aspirin|allergy|supplement|protein powder|shower gel|antiperspirant|toothbrush|mouthwash|floss|moisturiser|cream|suncream|makeup|cotton|liner|nappy|wipes|bandage|colgate|oral b|gillette|nivea|dove|pantene|head and shoulders|tresemme|loreal)/.test(lower)) return 'Health & Personal Care';
  if (/(dog|cat|pet|kibble|treat|litter|chew|toy|pedigree|whiskas|felix|purina)/.test(lower)) return 'Pet Care';
  
  // 3. PROCESSED MODIFIERS (Must evaluate BEFORE base ingredients so "Onion Powder" doesn't become Produce)
  if (/(spice|herb|salt|pepper|sauce|ketchup|mustard|mayo|mayonnaise|dressing|vinegar|syrup|honey|cumin|paprika|cinnamon|nutmeg|turmeric|coriander|ginger|bay leaf|oregano|thyme|basil|rosemary|parsley|cilantro|mint|dill|sage|tarragon|cardamom|clove|saffron|vanilla|teriyaki|sriracha|salsa|relish|chutney|jam|jelly|marmalade|peanut butter|almond butter|spread|molasses|gravy|seasoning|chili|chilli|powder|granules|flakes|extract|curry|garam masala|marinade|pickle|pesto|paste|puree|marmite|vegemite|msg)/.test(lower)) return 'Spices & Condiments';
  
  if (/(rice|pasta|flour|sugar|oil|canned|bean|lentil|broth|soup|cereal|oat|noodle|spaghetti|macaroni|chickpea|garbanzo|quinoa|barley|couscous|bulgur|polenta|cornmeal|stock|bouillon|yeast|baking powder|baking soda|cornstarch|cocoa|chocolate chip|peanut|almond|walnut|pecan|cashew|hazelnut|macadamia|pistachio|sunflower seed|pumpkin seed|chia|flax|hemp|sesame|olive|caper|penne|fusilli|linguine|tagliatelle|muesli|granola|porridge|tinned|baking|heinz|crispbread)/.test(lower)) return 'Pantry Staples';
  
  if (/(pizza|ice cream|frozen|gelato|sorbet|popsicle|fish stick|fish fingers|hash brown|waffle|lolly|chips|fries|wedges|peas|sweetcorn|mixed veg)/.test(lower)) return 'Frozen Foods';
  
  if (/(deli|hummus|prepared|salad kit|coleslaw|potato salad|macaroni salad|pasta salad|rotisserie|pate|guac|guacamole|tzatziki|sushi|sliced meat|cold cuts|olives|antipasti|sandwich|pasty|sausage roll|quiche|ready meal)/.test(lower)) return 'Deli & Prepared Foods';

  // 4. BEVERAGES & SNACKS
  if (/(water|sparkling|juice|soda|coffee|tea|beer|wine|liquor|beverage|drink|lemonade|cider|espresso|cappuccino|latte|matcha|kombucha|cola|pop|champagne|prosecco|vodka|rum|whiskey|whisky|gin|tequila|cocktail|smoothie|squash|cordial|pepsi|sprite|fanta|tonic|hot chocolate|milkshake|liqueur)/.test(lower)) return 'Beverages';
  
  if (/(chip|crisp|cookie|chocolate|candy|nut|popcorn|cracker|pretzel|nacho|puff|jerky|fruit leather|gummy|marshmallow|caramel|toffee|fudge|nougat|mint|gum|doritos|pringles|sweets|haribo|cadbury|mars|snickers|kitkat|twix|maltesers)/.test(lower)) return 'Snacks & Sweets';

  // 5. BASE REFRIGERATED INGREDIENTS
  if (/(tofu|tempeh|seitan|quorn|beyond meat|impossible|linda mccartney|cauldron|soya|meatless|vegan|vegetarian|plant-based|plant based|nutritional yeast|aquafaba|tvp|meat free|dairy free)/.test(lower)) return 'Vegetarian Products';
  
  if (/(milk|cheese|yogurt|yoghurt|butter|egg|cream|feta|mozzarella|cheddar|parmesan|brie|paneer|halloumi|ghee|whey|dairy|kefir|quark|mascarpone|ricotta|provolone|gouda|swiss|camembert|gorgonzola|roquefort|buttermilk|margarine|alpro|oatly|yakult|actimel|lurpak|flora|bertolli|sour cream|creme fraiche)/.test(lower)) return 'Dairy & Eggs';
  
  if (/(chicken|beef|pork|lamb|sausage|bacon|turkey|duck|veal|ham|salami|prosciutto|pepperoni|steak|mince|venison|goose|quail|rabbit|chorizo|pancetta|pastrami|bresaola|bratwurst|frankfurter|meatball|patty|black pudding|haggis)/.test(lower)) return 'Meat & Poultry';
  
  if (/(fish|salmon|tuna|shrimp|prawn|cod|crab|lobster|seafood|mussel|scallop|squid|calamari|oyster|clam|haddock|trout|mackerel|sardine|anchovy|halibut|tilapia|mahi|swordfish|octopus|eel|caviar|bass|bream|crayfish|surimi)/.test(lower)) return 'Seafood';
  
  // 6. RAW PRODUCE (Bottom of the stack so it doesn't accidentally catch processed foods containing veg names)
  if (/(apple|banana|berr|tomato|lettuce|onion|garlic|potato|carrot|pepper|spinach|broccoli|fruit|veg|avocado|avacado|mushroom|celery|cabbage|melon|orange|lemon|lime|grape|peach|plum|pear|asparagus|zucchini|courgette|aubergine|eggplant|strawberr|blueberr|raspberr|blackberr|cranberr|cherr|apricot|nectarine|grapefruit|tangerine|pomelo|papaya|mango|pineapple|kiwi|pomegranate|fig|date|watermelon|cantaloupe|honeydew|radish|turnip|parsnip|beet|rutabaga|yam|squash|pumpkin|leek|scallion|chive|shallot|artichoke|brussels sprout|cauliflower|bok choy|chard|collard|arugula|rocket|watercress|endive|radicchio|fennel|okra|corn|pea|edamame|kale|guava|lychee|dragonfruit|sweet potato|spring onion|swede|beetroot|satsuma|clementine|mandarin)/.test(lower)) return 'Produce';
  
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

// --- MERGED FOODKEEPER INTEGRATION ---

let usdaCache: any[] | null = null;

export async function fetchUSDAFoodKeeper() {
  if (usdaCache) return usdaCache;
  
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('usda_foodkeeper_cache');
      if (stored) {
        usdaCache = JSON.parse(stored);
        if (usdaCache && usdaCache.length > 0) return usdaCache;
      }
    }

    const res = await fetch('https://www.fsis.usda.gov/shared/data/EN/FoodKeeper-Data.json');
    const data = await res.json();
    
    const productsSheet = data.sheets?.find((s: any) => s.name === 'Product');
    if (!productsSheet || !productsSheet.data) return null;

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

      days = toDays(p.DOP_Refrigerate_Max, p.DOP_Refrigerate_Metric) || 
             toDays(p.DOP_Pantry_Max, p.DOP_Pantry_Metric);

      const keywords = (p.Keywords || '').split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean);
      const name = (p.Name || '').toLowerCase().trim();
      if (name && !keywords.includes(name)) keywords.push(name);

      return { keywords, days };
    }).filter((p: any) => p.days !== null);

    usdaCache = parsedProducts;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('usda_foodkeeper_cache', JSON.stringify(parsedProducts));
    }
    return usdaCache;
  } catch (err) {
    console.warn("USDA Fetch failed.", err);
    return null;
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
    'morrisons', 'marks', 'spencer', 'co-op', 'kroger', 'walmart', 'trader', 'joes', 'whole',
    'british', 'scottish', 'irish', 'welsh', 'english', 'local', 'imported', 'grown',
    'cubes', 'cube', 'sliced', 'slices', 'diced', 'grated', 'shredded', 'chopped', 'pieces', 'chunks', 'minced', 'mince'
  ];
  
  return cleaned.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
}

export async function getEstimatedShelfLifeDays(itemName: string): Promise<number | null> {
  const normalized = itemName.toLowerCase().trim();
  const usdaData = await fetchUSDAFoodKeeper();
  
  const dbToUse = [...(foodKeeperData || []), ...(usdaData || [])];

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
  
  const categoryDefaults: Record<string, number> = {
    'Produce': 7, 'Dairy & Eggs': 14, 'Meat & Poultry': 4,
    'Seafood': 3, 'Deli & Prepared Foods': 5, 'Vegetarian Products': 7, 'Bakery': 5
  };

  const category = getAisle(itemName);
  if (categoryDefaults[category]) return categoryDefaults[category];
  return null;
}

export async function computeExpiryDate(itemName: string, fromDate = new Date()): Promise<string | null> {
  const days = await getEstimatedShelfLifeDays(itemName);
  if (!days) return null;
  const targetDate = new Date(fromDate);
  targetDate.setDate(targetDate.getDate() + days);
  return targetDate.toISOString().split('T')[0];
}

export function getExpiryStatus(expirationDateStr?: string | null): { 
  label: string; color: 'expired' | 'warning' | 'good' | 'none'; daysRemaining: number | null;
} {
  if (!expirationDateStr) return { label: 'No date', color: 'none', daysRemaining: null };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [year, month, day] = expirationDateStr.split('-').map(Number);
  const expiry = new Date(year, month - 1, day); expiry.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `Expired`, color: 'expired', daysRemaining: diffDays };
  if (diffDays === 0) return { label: 'Expires today', color: 'expired', daysRemaining: 0 };
  if (diffDays <= 3) return { label: `Expires in ${diffDays}d`, color: 'warning', daysRemaining: diffDays };
  return { label: `Expires in ${diffDays}d`, color: 'good', daysRemaining: diffDays };
}

export const normalizeForScaler = (ingStr: string) => {
  if (ingStr.startsWith('##')) return ingStr;
  let clean = ingStr.replace(/^1\s*pcs\s+/i, ''); 
  const dashMatch = clean.match(/^(.*?)\s*[-—–]\s*([\d.\/]+)\s*(.*)$/);
  return dashMatch ? `${dashMatch[2]} ${dashMatch[3] || ''} ${dashMatch[1]}`.replace(/\s+/g, ' ').trim() : clean;
};

export const formatIngredientDisplay = (scaledStr: string) => {
  if (scaledStr.startsWith('##')) return scaledStr.replace('##', '').trim();
  const match = scaledStr.trim().match(/^([\d.\/]+)\s*(kg|g|lbs|oz|ml|l|cups|tbsp|tsp|cans|packs|pcs|pinch|dash|cloves)?\s*(.*)$/i);
  if (match && match[3]) {
    const qty = match[1]; const unit = match[2] || 'pcs'; const name = match[3];
    return `${name} - ${qty} ${unit}`.trim();
  }
  if (scaledStr.includes('-')) return scaledStr;
  return `${scaledStr} - 1 pcs`; 
};

export const getIngredientStatus = (ingredient: string, pantry: any[]) => { 
  if (ingredient.startsWith('##')) return { status: 'header' };
  const match = ingredient.match(/^([\d.\/]+)\s*(kg|g|lbs|oz|ml|l|cups|tbsp|tsp|cans|packs|pcs|pinch|dash|cloves)?\s*(.*)$/i);
  const qty = parseFloat(match?.[1] || '1') || 1;
  const unit = (match?.[2] || 'pcs').toLowerCase();
  const nameMatch = (match?.[3] || ingredient).toLowerCase();

  const pantryMatch = (pantry || []).find(p => { const pName = (p.name || '').toLowerCase(); return nameMatch.includes(pName) || pName.includes(nameMatch); });
  if (!pantryMatch || pantryMatch.quantity <= 0) return { status: 'missing' };
  const neededBase = toBaseUnit(qty, unit); const availableBase = toBaseUnit(pantryMatch.quantity, pantryMatch.unit || 'pcs');
  if (neededBase.base === availableBase.base) {
    if (availableBase.qty >= neededBase.qty) return { status: 'in_stock' }; return { status: 'insufficient' };
  }
  if (pantryMatch.quantity >= qty) return { status: 'in_stock' }; return { status: 'insufficient' };
};