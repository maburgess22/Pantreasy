import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Please enter a valid URL' }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
        'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0'
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Site returned error code ${response.status}.` },
        { status: response.status }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let title = '';
    let cookTime = '20 mins';
    let category = 'Other';
    let image = '';
    let ingredients: string[] = [];
    
    // We hardcode the instructions here and NEVER scrape them!
    let instructions: string[] = [`For full cooking instructions, visit the original recipe here: ${url}`];

    // Helper to extract image URL from various schema formats
    const parseSchemaImage = (imgData: any): string => {
      if (!imgData) return '';
      if (typeof imgData === 'string') return imgData;
      if (Array.isArray(imgData)) {
        return typeof imgData[0] === 'string' ? imgData[0] : imgData[0]?.url || '';
      }
      if (typeof imgData === 'object' && imgData.url) return imgData.url;
      return '';
    };

    // --- METHOD 1: JSON-LD Extraction ---
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const parsed = JSON.parse($(el).html() || '');
        const items = Array.isArray(parsed) ? parsed : [parsed];

        for (const item of items) {
          let recipeObj = null;

          if (item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))) {
            recipeObj = item;
          } else if (item['@graph']) {
            recipeObj = item['@graph'].find(
              (g: any) => g['@type'] === 'Recipe' || (Array.isArray(g['@type']) && g['@type'].includes('Recipe'))
            );
          }

          if (recipeObj) {
            title = recipeObj.name || title;
            image = parseSchemaImage(recipeObj.image);

            const rawTime = recipeObj.totalTime || recipeObj.cookTime;
            if (rawTime) {
              const match = rawTime.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
              if (match) {
                const hours = match[1] ? `${match[1]}h ` : '';
                const mins = match[2] ? `${match[2]}m` : '';
                cookTime = (hours + mins).trim() || cookTime;
              }
            }

            if (recipeObj.recipeCategory) {
              category = Array.isArray(recipeObj.recipeCategory)
                ? recipeObj.recipeCategory[0]
                : recipeObj.recipeCategory;
            }

            if (Array.isArray(recipeObj.recipeIngredient)) {
              ingredients = recipeObj.recipeIngredient.map((i: string) => i.trim()).filter(Boolean);
            }
            break;
          }
        }
      } catch {
        // Skip malformed JSON
      }
    });

    // --- METHOD 2: HTML Meta Fallback Parser ---
    if (!title) {
      title = $('h1').first().text().trim() || $('title').text().split('-')[0].trim();
    }

    if (!image) {
      image =
        $('meta[property="og:image"]').attr('content') ||
        $('meta[name="twitter:image"]').attr('content') ||
        $('[itemprop="image"]').attr('src') ||
        '';
    }

    if (ingredients.length === 0) {
      $('[itemprop="recipeIngredient"], .ingredient, .ingredients li, [class*="ingredient"]').each((_, el) => {
        const text = $(el).text().trim().replace(/\s+/g, ' ');
        if (text && text.length < 150 && !ingredients.includes(text)) {
          ingredients.push(text);
        }
      });
    }

    // --- NEW: GEMINI INGREDIENT CLEANING ---
    if (ingredients.length > 0 && process.env.GEMINI_API_KEY) {
      try {
        const systemPrompt = `
          You are a strict recipe ingredient parser. I will give you a JSON array of messy, verbose recipe ingredients.
          Your ONLY job is to extract the core item name, the numeric amount, and the unit.
          
          RULES:
          1. Format EVERY line exactly like this: "Item Name - Amount Unit" (e.g., "Chili Powder - 0.5 tsp" or "Olive Oil - 1 tbsp").
          2. Strip out all cooking instructions, alternate measurements, preparation steps (e.g. "chopped", "diced"), and fluffy adjectives.
          3. Convert fractions like "½" to decimals like "0.5".
          4. If an ingredient has no amount, assume "1 pcs" (e.g. "Salt" -> "Salt - 1 pcs").
          
          You MUST return a JSON object with a single key called "cleaned_ingredients" containing an array of strings.
          Example: { "cleaned_ingredients": ["Chili Powder - 0.5 tsp", "Chicken Breast - 2 pcs"] }
        `;

        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: systemPrompt },
                  { text: JSON.stringify(ingredients) }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json"
            }
          })
        });

        if (geminiResponse.ok) {
          const aiData = await geminiResponse.json();
          const rawContent = aiData.candidates[0].content.parts[0].text;
          const parsedData = JSON.parse(rawContent);
          
          if (parsedData.cleaned_ingredients && Array.isArray(parsedData.cleaned_ingredients) && parsedData.cleaned_ingredients.length > 0) {
            ingredients = parsedData.cleaned_ingredients;
          }
        } else {
          console.error("Gemini Recipe Cleaning Failed:", await geminiResponse.text());
        }
      } catch (err) {
        console.error("Gemini Processing Error:", err);
      }
    }

    return NextResponse.json({
      title: title || 'Imported Recipe',
      cook_time: cookTime,
      category,
      image,
      ingredients,
      instructions,
      source_url: url,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error parsing URL' }, { status: 500 });
  }
}