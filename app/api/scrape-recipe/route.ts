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
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
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
    
    // 🛑 We hardcode the instructions here and NEVER scrape them!
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
            
            // NOTICE: All the messy instruction-parsing code that used to be here has been deleted!
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

    // NOTICE: The fallback instruction-parsing code that used to be here has also been deleted!

    return NextResponse.json({
      title: title || 'Imported Recipe',
      cook_time: cookTime,
      category,
      image,
      ingredients,
      instructions, // This now safely passes our single hardcoded link string
      source_url: url,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error parsing URL' }, { status: 500 });
  }
}