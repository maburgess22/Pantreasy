// utils/helpers.ts

export const searchFoodFacts = async (query: string) => {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query.trim())}&search_simple=1&action=process&fields=product_name,generic_name,categories&json=1&page_size=10`);
    const data = await res.json();
    if (data.products) {
      const uniqueMap = new Map<string, string>();
      data.products.forEach((p: any) => {
        const name = p.product_name || p.generic_name;
        if (!name) return;
        const properName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        if (!uniqueMap.has(properName)) {
           let cat = 'Other';
           if (p.categories) cat = p.categories.split(',')[0].trim();
           uniqueMap.set(properName, cat);
        }
      });
      return Array.from(uniqueMap.entries()).map(([name, category]) => ({ name, category })).slice(0, 5);
    }
  } catch (e) {
    console.error("FoodFacts API Error:", e);
  }
  return [];
};

export function toBaseUnit(qty: number, unit: string) {
  const u = (unit || '').toLowerCase();
  if (u === 'kg') return { qty: qty * 1000, base: 'g' };
  if (u === 'l') return { qty: qty * 1000, base: 'ml' };
  if (u === 'lbs') return { qty: qty * 16, base: 'oz' };
  return { qty, base: u || 'pcs' };
}

export function fromBaseUnit(qty: number, base: string) {
  if (base === 'g' && qty >= 1000) return { qty: qty / 1000, unit: 'kg' };
  if (base === 'ml' && qty >= 1000) return { qty: qty / 1000, unit: 'l' };
  if (base === 'oz' && qty >= 16) return { qty: qty / 16, unit: 'lbs' };
  return { qty, unit: base };
}

export function scaleAndConvertIngredient(ingredient: string, multiplier: number, targetSystem: 'metric' | 'imperial'): string {
  let result = ingredient || '';
  if (multiplier !== 1) {
    result = result.replace(/^([\d.]+)/, (match) => {
      return (parseFloat(match) * multiplier).toFixed(2).replace(/\.?0+$/, ''); 
    });
  }

  const regex = /\b([\d.]+)\s*(g|kg|ml|l|oz|lbs|fl\s*oz|cup|cups|tbsp|tsp)\b/gi;
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

export function cleanIngredientName(rawName: string): string {
  if (!rawName) return '';
  let clean = rawName.split(',')[0]; 
  clean = clean.replace(/\(.*?\)/g, ''); 
  const descriptors = /\b(finely|roughly|chopped|diced|sliced|minced|peeled|crushed|grated|large|medium|small|fresh|dried|to serve|can|cans|tin|tins|jar|jars)\b/gi;
  clean = clean.replace(descriptors, '');
  return clean.replace(/\s+/g, ' ').trim();
}

export function getStandardGroceryItem(ingredient: string): string {
  const match = ingredient.match(/^([\d.]+)?\s*(?:\b(kg|g|lbs|oz|ml|l|cups|tbsp|tsp|cans|packs|pcs|pinch|dash|cloves)\b)?\s*(.*)$/i);
  if (!match) return ingredient;

  let qty = parseFloat(match[1]) || 0;
  let unit = (match[2] || '').toLowerCase();
  let name = (match[3] || '').trim();
  const lowerName = name.toLowerCase();

  const staples = ['oil', 'vinegar', 'sauce', 'paste', 'mustard', 'mayo', 'ketchup', 'salt', 'pepper', 'spice', 'powder', 'extract', 'sugar', 'flour', 'honey', 'syrup', 'jam', 'butter', 'garlic', 'ginger', 'cinnamon', 'cumin', 'paprika', 'oregano', 'basil', 'thyme', 'chili', 'chilli', 'seeds', 'flaxseeds'];
  if (staples.some(s => lowerName.includes(s))) return name.charAt(0).toUpperCase() + name.slice(1);

  const liquids = ['milk', 'cream', 'broth', 'stock', 'water', 'juice'];
  if (liquids.some(l => lowerName.includes(l))) {
    let mlQty = qty;
    if (unit === 'l') mlQty = qty * 1000;
    else if (unit === 'cups') mlQty = qty * 250;
    else if (unit === 'tbsp') mlQty = qty * 15;
    else if (unit === 'tsp') mlQty = qty * 5;
    
    if (mlQty > 0) {
      if (mlQty <= 250) return `250ml ${name}`;
      if (mlQty <= 500) return `500ml ${name}`;
      if (mlQty <= 1000) return `1L ${name}`;
      return `${Math.ceil(mlQty / 1000)}L ${name}`;
    }
    return name;
  }

  const dryGoods = ['pasta', 'rice', 'oats', 'lentils', 'beans', 'quinoa', 'couscous'];
  if (dryGoods.some(d => lowerName.includes(d))) {
     let gQty = qty;
     if (unit === 'kg') gQty = qty * 1000;
     else if (unit === 'cups') gQty = qty * 200;
     else if (unit === 'oz') gQty = qty * 28;
     else if (unit === 'lbs') gQty = qty * 450;

     if (gQty > 0) {
        if (gQty <= 500) return `500g ${name}`;
        return `${Math.ceil(gQty / 1000)}kg ${name}`;
     }
     return name;
  }
  return ingredient;
}

export function getAisle(name: string): string {
  const n = (name || '').toLowerCase();
  if (n.includes('apple') || n.includes('banana') || n.includes('lettuce') || n.includes('tomato') || n.includes('lemon') || n.includes('onion') || n.includes('garlic') || n.includes('potato') || n.includes('carrot') || n.includes('berry') || n.includes('fruit') || n.includes('veg')) return 'Produce';
  if (n.includes('milk') || n.includes('cheese') || n.includes('egg') || n.includes('butter') || n.includes('yogurt') || n.includes('cream')) return 'Dairy & Chilled';
  if (n.includes('chicken') || n.includes('beef') || n.includes('pork') || n.includes('fish') || n.includes('salmon') || n.includes('steak') || n.includes('bacon') || n.includes('meat') || n.includes('sausage')) return 'Meat & Seafood';
  if (n.includes('bread') || n.includes('bagel') || n.includes('muffin') || n.includes('croissant') || n.includes('roll') || n.includes('bun') || n.includes('wrap')) return 'Bakery';
  if (n.includes('ice cream') || n.includes('pizza') || n.includes('frozen') || n.includes('peas')) return 'Frozen';
  if (n.includes('water') || n.includes('juice') || n.includes('soda') || n.includes('beer') || n.includes('wine') || n.includes('coffee') || n.includes('tea') || n.includes('drink')) return 'Beverages';
  if (n.includes('chips') || n.includes('crisps') || n.includes('popcorn') || n.includes('chocolate') || n.includes('candy') || n.includes('cookie') || n.includes('snack')) return 'Snacks';
  if (n.includes('pasta') || n.includes('rice') || n.includes('bean') || n.includes('sauce') || n.includes('oil') || n.includes('vinegar') || n.includes('spice') || n.includes('flour') || n.includes('sugar') || n.includes('can') || n.includes('noodle') || n.includes('curry') || n.includes('seeds') || n.includes('extract')) return 'World Foods & Pantry';
  if (n.includes('soap') || n.includes('paper') || n.includes('clean') || n.includes('foil') || n.includes('trash') || n.includes('bag') || n.includes('wash')) return 'Household';
  return 'Other';
}

export const compressImage = (file: File, maxWidth = 1080): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          else reject(new Error('Canvas is empty'));
        }, 'image/jpeg', 0.8);
      };
    };
    reader.onerror = error => reject(error);
  });
};

export const normalizeName = (name: string) => {
  let w = (name || '').toLowerCase().trim();
  if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.endsWith('oes')) return w.slice(0, -2);
  if (w.endsWith('es') && /(sh|ch|ss|x|z)$/.test(w.slice(0,-2))) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
};

export const getNext7Days = () => Array.from({ length: 7 }).map((_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d.toISOString().split('T')[0]; });