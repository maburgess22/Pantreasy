// --- MASSIVE LOCAL UK GROCERY DICTIONARY ---
const UK_GROCERY_DICT: Record<string, string> = {
  // Spices & Condiments
  'fenugreek': 'Spices & Condiments', 'salt': 'Spices & Condiments', 'pepper': 'Spices & Condiments', 'cumin': 'Spices & Condiments', 'coriander': 'Spices & Condiments', 'turmeric': 'Spices & Condiments', 'paprika': 'Spices & Condiments', 'cinnamon': 'Spices & Condiments', 'nutmeg': 'Spices & Condiments', 'garam masala': 'Spices & Condiments', 'curry powder': 'Spices & Condiments', 'chilli powder': 'Spices & Condiments', 'chili flakes': 'Spices & Condiments', 'oregano': 'Spices & Condiments', 'basil': 'Spices & Condiments', 'thyme': 'Spices & Condiments', 'rosemary': 'Spices & Condiments', 'parsley': 'Spices & Condiments', 'mint': 'Spices & Condiments', 'dill': 'Spices & Condiments', 'bay leaves': 'Spices & Condiments', 'soy sauce': 'Spices & Condiments', 'mayo': 'Spices & Condiments', 'mayonnaise': 'Spices & Condiments', 'ketchup': 'Spices & Condiments', 'tomato ketchup': 'Spices & Condiments', 'brown sauce': 'Spices & Condiments', 'mustard': 'Spices & Condiments', 'vinegar': 'Spices & Condiments', 'balsamic vinegar': 'Spices & Condiments', 'honey': 'Spices & Condiments', 'maple syrup': 'Spices & Condiments', 'jam': 'Spices & Condiments', 'marmalade': 'Spices & Condiments', 'peanut butter': 'Spices & Condiments', 'marmite': 'Spices & Condiments', 'stock cubes': 'Spices & Condiments', 'gravy granules': 'Spices & Condiments', 'vanilla extract': 'Spices & Condiments', 'pesto': 'Spices & Condiments',
  
  // Produce
  'apple': 'Produce', 'apples': 'Produce', 'banana': 'Produce', 'bananas': 'Produce', 'orange': 'Produce', 'oranges': 'Produce', 'lemon': 'Produce', 'lemons': 'Produce', 'lime': 'Produce', 'limes': 'Produce', 'grape': 'Produce', 'grapes': 'Produce', 'strawberry': 'Produce', 'strawberries': 'Produce', 'raspberry': 'Produce', 'raspberries': 'Produce', 'blueberry': 'Produce', 'blueberries': 'Produce', 'carrot': 'Produce', 'carrots': 'Produce', 'potato': 'Produce', 'potatoes': 'Produce', 'onion': 'Produce', 'onions': 'Produce', 'garlic': 'Produce', 'garlic bulb': 'Produce', 'tomato': 'Produce', 'tomatoes': 'Produce', 'cucumber': 'Produce', 'pepper': 'Produce', 'peppers': 'Produce', 'bell pepper': 'Produce', 'lettuce': 'Produce', 'spinach': 'Produce', 'broccoli': 'Produce', 'cauliflower': 'Produce', 'cabbage': 'Produce', 'mushroom': 'Produce', 'mushrooms': 'Produce', 'courgette': 'Produce', 'courgettes': 'Produce', 'aubergine': 'Produce', 'sweet potato': 'Produce', 'celery': 'Produce', 'leek': 'Produce', 'leeks': 'Produce', 'spring onion': 'Produce', 'spring onions': 'Produce', 'avocado': 'Produce', 'avocados': 'Produce', 'kale': 'Produce',
  
  // Dairy & Eggs
  'milk': 'Dairy & Eggs', 'semi skimmed milk': 'Dairy & Eggs', 'skimmed milk': 'Dairy & Eggs', 'whole milk': 'Dairy & Eggs', 'oat milk': 'Dairy & Eggs', 'almond milk': 'Dairy & Eggs', 'soya milk': 'Dairy & Eggs', 'butter': 'Dairy & Eggs', 'unsalted butter': 'Dairy & Eggs', 'cheese': 'Dairy & Eggs', 'cheddar': 'Dairy & Eggs', 'cheddar cheese': 'Dairy & Eggs', 'mozzarella': 'Dairy & Eggs', 'parmesan': 'Dairy & Eggs', 'brie': 'Dairy & Eggs', 'feta': 'Dairy & Eggs', 'yogurt': 'Dairy & Eggs', 'yoghurt': 'Dairy & Eggs', 'greek yogurt': 'Dairy & Eggs', 'egg': 'Dairy & Eggs', 'eggs': 'Dairy & Eggs', 'free range eggs': 'Dairy & Eggs', 'cream': 'Dairy & Eggs', 'double cream': 'Dairy & Eggs', 'single cream': 'Dairy & Eggs', 'sour cream': 'Dairy & Eggs', 'creme fraiche': 'Dairy & Eggs', 'margarine': 'Dairy & Eggs',
  
  // Meat & Poultry
  'chicken': 'Meat & Poultry', 'chicken breast': 'Meat & Poultry', 'chicken thighs': 'Meat & Poultry', 'minced beef': 'Meat & Poultry', 'beef mince': 'Meat & Poultry', 'beef': 'Meat & Poultry', 'steak': 'Meat & Poultry', 'pork': 'Meat & Poultry', 'pork chops': 'Meat & Poultry', 'lamb': 'Meat & Poultry', 'bacon': 'Meat & Poultry', 'sausage': 'Meat & Poultry', 'sausages': 'Meat & Poultry', 'ham': 'Meat & Poultry', 'turkey': 'Meat & Poultry', 'duck': 'Meat & Poultry',
  
  // Seafood
  'salmon': 'Seafood', 'salmon fillets': 'Seafood', 'tuna': 'Seafood', 'canned tuna': 'Seafood', 'cod': 'Seafood', 'haddock': 'Seafood', 'prawns': 'Seafood', 'shrimp': 'Seafood', 'mackerel': 'Seafood', 'fish': 'Seafood',
  
  // Bakery
  'bread': 'Bakery', 'sliced bread': 'Bakery', 'white bread': 'Bakery', 'brown bread': 'Bakery', 'wholemeal bread': 'Bakery', 'rolls': 'Bakery', 'bread rolls': 'Bakery', 'wraps': 'Bakery', 'tortillas': 'Bakery', 'pita bread': 'Bakery', 'crumpets': 'Bakery', 'bagels': 'Bakery', 'croissant': 'Bakery', 'croissants': 'Bakery', 'baguette': 'Bakery',
  
  // Pantry Staples
  'rice': 'Pantry Staples', 'basmati rice': 'Pantry Staples', 'pasta': 'Pantry Staples', 'spaghetti': 'Pantry Staples', 'penne': 'Pantry Staples', 'macaroni': 'Pantry Staples', 'noodles': 'Pantry Staples', 'flour': 'Pantry Staples', 'plain flour': 'Pantry Staples', 'self raising flour': 'Pantry Staples', 'sugar': 'Pantry Staples', 'caster sugar': 'Pantry Staples', 'granulated sugar': 'Pantry Staples', 'brown sugar': 'Pantry Staples', 'icing sugar': 'Pantry Staples', 'baked beans': 'Pantry Staples', 'chopped tomatoes': 'Pantry Staples', 'tinned tomatoes': 'Pantry Staples', 'chickpeas': 'Pantry Staples', 'lentils': 'Pantry Staples', 'kidney beans': 'Pantry Staples', 'black beans': 'Pantry Staples', 'oats': 'Pantry Staples', 'porridge oats': 'Pantry Staples', 'cereal': 'Pantry Staples', 'cornflakes': 'Pantry Staples', 'muesli': 'Pantry Staples', 'granola': 'Pantry Staples', 'baking powder': 'Pantry Staples', 'bicarbonate of soda': 'Pantry Staples', 'cocoa powder': 'Pantry Staples', 'olive oil': 'Pantry Staples', 'vegetable oil': 'Pantry Staples', 'sunflower oil': 'Pantry Staples',
  
  // Frozen Foods
  'frozen peas': 'Frozen Foods', 'ice cream': 'Frozen Foods', 'chips': 'Frozen Foods', 'frozen chips': 'Frozen Foods', 'fish fingers': 'Frozen Foods', 'frozen pizza': 'Frozen Foods', 'hash browns': 'Frozen Foods', 'frozen mixed veg': 'Frozen Foods',
  
  // Snacks & Sweets
  'crisps': 'Snacks & Sweets', 'potato crisps': 'Snacks & Sweets', 'chocolate': 'Snacks & Sweets', 'chocolate bar': 'Snacks & Sweets', 'biscuits': 'Snacks & Sweets', 'digestives': 'Snacks & Sweets', 'hobnobs': 'Snacks & Sweets', 'sweets': 'Snacks & Sweets', 'popcorn': 'Snacks & Sweets', 'peanuts': 'Snacks & Sweets', 'cookies': 'Snacks & Sweets', 'crackers': 'Snacks & Sweets',
  
  // Beverages
  'water': 'Beverages', 'sparkling water': 'Beverages', 'tea': 'Beverages', 'tea bags': 'Beverages', 'coffee': 'Beverages', 'instant coffee': 'Beverages', 'juice': 'Beverages', 'orange juice': 'Beverages', 'apple juice': 'Beverages', 'squash': 'Beverages', 'cordial': 'Beverages', 'cola': 'Beverages', 'lemonade': 'Beverages', 'beer': 'Beverages', 'wine': 'Beverages', 'red wine': 'Beverages', 'white wine': 'Beverages', 'prosecco': 'Beverages', 'cider': 'Beverages', 'vodka': 'Beverages', 'gin': 'Beverages', 'whisky': 'Beverages',
  
  // Deli & Prepared Foods
  'ham slices': 'Deli & Prepared Foods', 'salami': 'Deli & Prepared Foods', 'cooked chicken': 'Deli & Prepared Foods', 'hummus': 'Deli & Prepared Foods', 'houmous': 'Deli & Prepared Foods', 'coleslaw': 'Deli & Prepared Foods', 'potato salad': 'Deli & Prepared Foods', 'sandwich': 'Deli & Prepared Foods', 'sausage roll': 'Deli & Prepared Foods', 'pork pie': 'Deli & Prepared Foods', 'quiche': 'Deli & Prepared Foods', 'ready meal': 'Deli & Prepared Foods',
  
  // Vegetarian Products
  'tofu': 'Vegetarian Products', 'quorn': 'Vegetarian Products', 'tempeh': 'Vegetarian Products', 'meat free mince': 'Vegetarian Products', 'vegan sausages': 'Vegetarian Products', 'vegetarian sausages': 'Vegetarian Products',
  
  // Household & Cleaning
  'toilet roll': 'Household & Cleaning', 'toilet paper': 'Household & Cleaning', 'kitchen roll': 'Household & Cleaning', 'kitchen towel': 'Household & Cleaning', 'washing up liquid': 'Household & Cleaning', 'bleach': 'Household & Cleaning', 'laundry detergent': 'Household & Cleaning', 'washing powder': 'Household & Cleaning', 'fabric conditioner': 'Household & Cleaning', 'sponge': 'Household & Cleaning', 'sponges': 'Household & Cleaning', 'bin bags': 'Household & Cleaning', 'foil': 'Household & Cleaning', 'tin foil': 'Household & Cleaning', 'cling film': 'Household & Cleaning', 'baking parchment': 'Household & Cleaning', 'dishwasher tablets': 'Household & Cleaning', 'multisurface cleaner': 'Household & Cleaning',
  
  // Health & Personal Care
  'shampoo': 'Health & Personal Care', 'conditioner': 'Health & Personal Care', 'shower gel': 'Health & Personal Care', 'body wash': 'Health & Personal Care', 'soap': 'Health & Personal Care', 'hand wash': 'Health & Personal Care', 'toothpaste': 'Health & Personal Care', 'toothbrush': 'Health & Personal Care', 'deodorant': 'Health & Personal Care', 'paracetamol': 'Health & Personal Care', 'ibuprofen': 'Health & Personal Care', 'plasters': 'Health & Personal Care', 'tampons': 'Health & Personal Care', 'sanitary towels': 'Health & Personal Care', 'toiletries': 'Health & Personal Care',
  
  // Pet Care
  'dog food': 'Pet Care', 'cat food': 'Pet Care', 'cat litter': 'Pet Care', 'pet treats': 'Pet Care', 'dog treats': 'Pet Care', 'cat treats': 'Pet Care'
};

// --- UPDATED: STRICTLY PERISHABLE UK SHELF LIFE DICTIONARY ---
// Removed all ambient, frozen, bakery, and dry goods. Only tracks true perishables.
const UK_SHELF_LIFE_DICT: Record<string, number> = {
  // Produce (Ambient & Fridge)
  'potato': 30, 'potatoes': 30, 'onion': 30, 'onions': 30, 'garlic': 60, 'ginger': 30, 'squash': 30, 'pumpkin': 30,
  'apple': 14, 'apples': 14, 'orange': 14, 'oranges': 14, 'lemon': 14, 'lemons': 14, 'lime': 14, 'limes': 14, 'carrot': 14, 'carrots': 14, 'celery': 14, 'cabbage': 14,
  'banana': 7, 'bananas': 7, 'tomato': 7, 'tomatoes': 7, 'cucumber': 7, 'pepper': 7, 'peppers': 7, 'broccoli': 7, 'cauliflower': 7, 'courgette': 7, 'leek': 7,
  'lettuce': 5, 'spinach': 5, 'kale': 5, 'mushroom': 5, 'mushrooms': 5, 'avocado': 5, 'strawberry': 5, 'strawberries': 5, 'raspberry': 5, 'blueberry': 5, 'grapes': 7,
  
  // Dairy & Eggs
  'milk': 7, 'whole milk': 7, 'semi skimmed milk': 7, 'skimmed milk': 7, 'oat milk': 7, 'soya milk': 7,
  'cheese': 21, 'cheddar': 30, 'parmesan': 60, 'mozzarella': 7, 'brie': 7, 'feta': 14, 'cream cheese': 14, 'soft cheese': 7,
  'yogurt': 14, 'yoghurt': 14, 'greek yogurt': 14,
  'butter': 30, 'margarine': 60,
  'egg': 28, 'eggs': 28,
  'cream': 5, 'double cream': 5, 'single cream': 5, 'sour cream': 7, 'creme fraiche': 7,

  // Meat & Poultry (Strict FSA Use-By Standards)
  'chicken': 3, 'chicken breast': 3, 'chicken thighs': 3, 'whole chicken': 3,
  'beef': 4, 'steak': 4, 'minced beef': 2, 'beef mince': 2,
  'pork': 3, 'pork chops': 3,
  'lamb': 3, 'lamb chops': 3,
  'bacon': 14, 'sausage': 4, 'sausages': 4,
  'turkey': 3, 'duck': 3,
  'ham': 5, 'salami': 14, 'prosciutto': 14, 'chorizo': 30,

  // Seafood (Strict FSA Use-By Standards)
  'fish': 2, 'salmon': 2, 'cod': 2, 'haddock': 2, 'tuna steak': 2,
  'prawns': 2, 'shrimp': 2, 'mussels': 2,
  'smoked salmon': 14,

  // Deli & Prepared Foods
  'hummus': 5, 'houmous': 5, 'coleslaw': 4, 'potato salad': 4,
  'sandwich': 2, 'quiche': 4, 'sausage roll': 4, 'ready meal': 5,

  // Vegetarian/Vegan Alternatives
  'tofu': 7, 'quorn': 7, 'tempeh': 7, 'vegan sausages': 7, 'meat free': 7
};

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

export function getCachedCategory(itemName: string) {
  const lower = itemName.toLowerCase().trim();
  
  if (UK_GROCERY_DICT[lower]) return UK_GROCERY_DICT[lower];

  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('categoryCache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed[lower]) return parsed[lower];
      }
    } catch(e) {}
  }
  
  return getAisle(itemName);
}

export function getAisle(itemName: string) {
  const lower = itemName.toLowerCase().trim();
  
  if (/(soap|clean|detergent|paper towel|trash|foil|tissue|bleach|sponge|mop|broom|wipe|spray|polish|softener|wrapper|ziploc|bag|parchment|napkin|plate|cup|cutlery|battery|bulb|fairy|persil|ariel|lenor|comfort|bold|daz|surf|cif|flash|mr muscle|domestos|zoflora|ecover|method|toilet roll|kitchen roll|bin bag|trash bag|cling film|baking paper|washing up liquid|dishwasher|scourer|cloth|air freshener|lightbulb|match|lighter)/.test(lower)) return 'Household & Cleaning';
  if (/(shampoo|lotion|toothpaste|medicine|vitamin|dental|deodorant|body wash|conditioner|razor|shaving|tampon|pad|diaper|band-aid|plaster|advil|tylenol|ibuprofen|paracetamol|aspirin|allergy|supplement|protein powder|shower gel|antiperspirant|toothbrush|mouthwash|floss|moisturiser|cream|suncream|makeup|cotton|liner|nappy|wipes|bandage|colgate|oral b|gillette|nivea|dove|pantene|head and shoulders|tresemme|loreal|sanex|radox|carex|simple)/.test(lower)) return 'Health & Personal Care';
  if (/(dog|cat|pet|kibble|treat|litter|chew|toy|pedigree|whiskas|felix|purina|bakers|winalot)/.test(lower)) return 'Pet Care';
  if (/(spice|herb|salt|pepper|sauce|ketchup|mustard|mayo|mayonnaise|dressing|vinegar|syrup|honey|cumin|paprika|cinnamon|nutmeg|turmeric|coriander|ginger|bay leaf|oregano|thyme|basil|rosemary|parsley|cilantro|mint|dill|sage|tarragon|cardamom|cardamon|clove|saffron|vanilla|teriyaki|sriracha|salsa|relish|chutney|jam|jelly|marmalade|peanut butter|almond butter|spread|molasses|gravy|seasoning|chili|chilli|powder|granules|flakes|extract|curry|garam masala|marinade|pickle|pesto|paste|puree|marmite|vegemite|msg|anise|cayenne|allspice|mace|sumac|zaatar|bouillon|stock cube|fennel seed|caraway|mustard seed|celery seed|peppercorn|pod|hellmanns|heinz|hp sauce|branston|schwartz|bisto|oxo|knorr|colmans|frank's|nandos|tabasco)/.test(lower)) return 'Spices & Condiments';
  if (/(rice|pasta|flour|sugar|oil|canned|bean|lentil|broth|soup|cereal|oat|noodle|spaghetti|macaroni|chickpea|garbanzo|quinoa|barley|couscous|bulgur|polenta|cornmeal|stock|bouillon|yeast|baking powder|baking soda|cornstarch|cocoa|chocolate chip|peanut|almond|walnut|pecan|cashew|hazelnut|macadamia|pistachio|sunflower seed|pumpkin seed|chia|flax|hemp|sesame|olive|caper|penne|fusilli|linguine|tagliatelle|muesli|granola|porridge|tinned|baking|crispbread|tortilla chips|taco shells|napolina|mutti|tilda|uncle bens|bachelors|ambrosia|kelloggs|nestle|weetabix|quaker|ryvita)/.test(lower)) return 'Pantry Staples';
  if (/(pizza|ice cream|frozen|gelato|sorbet|popsicle|fish stick|fish fingers|hash brown|waffle|lolly|chips|fries|wedges|peas|sweetcorn|mixed veg|birds eye|mccain|aunt bessies|goodfellas|chicago town|magnum|ben and jerrys|haagen dazs)/.test(lower)) return 'Frozen Foods';
  if (/(deli|hummus|prepared|salad kit|coleslaw|potato salad|macaroni salad|pasta salad|rotisserie|pate|guac|guacamole|tzatziki|sushi|sliced meat|cold cuts|olives|antipasti|sandwich|pasty|sausage roll|quiche|ready meal|ginsters)/.test(lower)) return 'Deli & Prepared Foods';
  if (/(water|sparkling|juice|soda|coffee|tea|beer|wine|liquor|beverage|drink|lemonade|cider|espresso|cappuccino|latte|matcha|kombucha|cola|pop|champagne|prosecco|vodka|rum|whiskey|whisky|gin|tequila|cocktail|smoothie|squash|cordial|pepsi|sprite|fanta|tonic|hot chocolate|milkshake|liqueur|twinings|pg tips|yorkshire tea|nescafe|kenco|douwe egberts|robinsons|ribena|vimto|capri sun|innocent|tropicana|coca cola|dr pepper|red bull|monster|san pellegrino)/.test(lower)) return 'Beverages';
  if (/(chip|crisp|cookie|chocolate|candy|nut|popcorn|cracker|pretzel|nacho|puff|jerky|fruit leather|gummy|marshmallow|caramel|toffee|fudge|nougat|mint|gum|doritos|pringles|sweets|haribo|cadbury|mars|snickers|kitkat|twix|maltesers|walkers|mcvities|galaxy|tyrrells|kettle|hula hoops|skips|quavers|wotsits|monster munch|jaffa cakes|digestives|hobnobs)/.test(lower)) return 'Snacks & Sweets';
  if (/(tofu|tempeh|seitan|quorn|beyond meat|impossible|linda mccartney|cauldron|soya|meatless|vegan|vegetarian|plant-based|plant based|nutritional yeast|aquafaba|tvp|meat free|dairy free)/.test(lower)) return 'Vegetarian Products';
  if (/(milk|cheese|yogurt|yoghurt|butter|egg|cream|feta|mozzarella|cheddar|parmesan|brie|paneer|halloumi|ghee|whey|dairy|kefir|quark|mascarpone|ricotta|provolone|gouda|swiss|camembert|gorgonzola|roquefort|buttermilk|margarine|alpro|oatly|yakult|actimel|lurpak|flora|bertolli|sour cream|creme fraiche|kerrygold|yeo valley|cathedral city|babybel|laughing cow|philadelphia|muller|rachels)/.test(lower)) return 'Dairy & Eggs';
  if (/(chicken|beef|pork|lamb|sausage|bacon|turkey|duck|veal|ham|salami|prosciutto|pepperoni|steak|mince|venison|goose|quail|rabbit|chorizo|pancetta|pastrami|bresaola|bratwurst|frankfurter|meatball|patty|black pudding|haggis|richmond|heck|peperami)/.test(lower)) return 'Meat & Poultry';
  if (/(fish|salmon|tuna|shrimp|prawn|cod|crab|lobster|seafood|mussel|scallop|squid|calamari|oyster|clam|haddock|trout|mackerel|sardine|anchovy|halibut|tilapia|mahi|swordfish|octopus|eel|caviar|bass|bream|crayfish|surimi|john west|princes|youngs)/.test(lower)) return 'Seafood';
  if (/(apple|banana|berr|tomato|lettuce|onion|garlic|potato|carrot|pepper|spinach|broccoli|fruit|veg|avocado|avacado|mushroom|celery|cabbage|melon|orange|lemon|lime|grape|peach|plum|pear|asparagus|zucchini|courgette|aubergine|eggplant|strawberr|blueberr|raspberr|blackberr|cranberr|cherr|apricot|nectarine|grapefruit|tangerine|pomelo|papaya|mango|pineapple|kiwi|pomegranate|fig|date|watermelon|cantaloupe|honeydew|radish|turnip|parsnip|beet|rutabaga|yam|squash|pumpkin|leek|scallion|chive|shallot|artichoke|brussels sprout|cauliflower|bok choy|chard|collard|arugula|rocket|watercress|endive|radicchio|fennel|okra|corn|pea|edamame|kale|guava|lychee|dragonfruit|sweet potato|spring onion|swede|beetroot|satsuma|clementine|mandarin)/.test(lower)) return 'Produce';
  
  return 'Other';
}

export async function fetchSmartCategory(itemName: string, userId: string, supabase: any): Promise<string> {
  const lower = itemName.toLowerCase().trim();
  
  const cachedCat = getCachedCategory(lower);
  if (cachedCat !== 'Other') return cachedCat;

  if (!userId || !supabase) return 'Other';

  try {
    const { data: existing } = await supabase
      .from('user_item_dictionary')
      .select('category')
      .eq('user_id', userId)
      .eq('item_name', lower)
      .single();

    if (existing && existing.category) {
      if (typeof window !== 'undefined') {
        const cached = JSON.parse(localStorage.getItem('categoryCache') || '{}');
        cached[lower] = existing.category;
        localStorage.setItem('categoryCache', JSON.stringify(cached));
      }
      return existing.category;
    }

    console.log(`[Helpers] Local DB missed. Triggering AI Fallback for: "${itemName}"`);
    const res = await fetch('/api/categorise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemName })
    });
    
    if (!res.ok) {
       console.error(`[Helpers] AI API returned status ${res.status}`);
       return 'Other'; 
    }
    
    const data = await res.json();
    
    if (data.category && data.category !== 'Other') {
      console.log(`[Helpers] Saving ${itemName} as ${data.category} permanently to Supabase.`);
      await supabase.from('user_item_dictionary').insert([{ 
        user_id: userId, 
        item_name: lower, 
        category: data.category 
      }]);
      
      if (typeof window !== 'undefined') {
        const cached = JSON.parse(localStorage.getItem('categoryCache') || '{}');
        cached[lower] = data.category;
        localStorage.setItem('categoryCache', JSON.stringify(cached));
      }
      return data.category;
    }
  } catch (err) {
    console.error("[Helpers] AI Categorization failed entirely", err);
  }
  
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

// --- UPDATED: STRICTLY PERISHABLE EXPIRY FILTER ---
export async function getEstimatedShelfLifeDays(itemName: string): Promise<number | null> {
  const normalized = itemName.toLowerCase().trim();
  const category = getCachedCategory(itemName); 
  
  const perishableCategories = ['Produce', 'Dairy & Eggs', 'Meat & Poultry', 'Seafood', 'Deli & Prepared Foods', 'Vegetarian Products'];
  
  // 1. Guard check: If it's not a perishable, instantly return null to skip tracking
  if (!perishableCategories.includes(category)) {
    return null;
  }
  
  // 2. Check exact dictionary matches first (e.g. 'chicken breast' -> 3 days)
  if (UK_SHELF_LIFE_DICT[normalized]) return UK_SHELF_LIFE_DICT[normalized];

  // 3. Check keyword containment for partial names
  const coreWords = extractCoreItemName(itemName);
  for (const [key, days] of Object.entries(UK_SHELF_LIFE_DICT)) {
     if (coreWords.some(word => key.includes(word) || word.includes(key))) {
       return days;
     }
  }
  
  // 4. Fallback to broad UK category averages (only for allowed perishables)
  const categoryDefaults: Record<string, number> = {
    'Produce': 7, 'Dairy & Eggs': 14, 'Meat & Poultry': 3,
    'Seafood': 2, 'Deli & Prepared Foods': 4, 'Vegetarian Products': 7
  };

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

export async function learnItemCategory(itemName: string, category: string, userId: string, supabase: any) {
  const lower = itemName.toLowerCase().trim();
  
  if (typeof window !== 'undefined') {
    const cached = JSON.parse(localStorage.getItem('categoryCache') || '{}');
    cached[lower] = category;
    localStorage.setItem('categoryCache', JSON.stringify(cached));
  }

  if (!userId || !supabase) return;

  try {
    await supabase.from('user_item_dictionary')
      .delete()
      .eq('user_id', userId)
      .eq('item_name', lower);

    await supabase.from('user_item_dictionary')
      .insert([{ user_id: userId, item_name: lower, category }]);
      
  } catch (err) {
    console.error("[Helpers] Failed to learn manual category", err);
  }
}