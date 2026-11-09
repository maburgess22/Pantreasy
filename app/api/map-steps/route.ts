import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper function to pause execution
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function POST(request: Request) {
  try {
    const { ingredients, instructions } = await request.json();
    
    if (!ingredients || !instructions) {
      return NextResponse.json({ error: 'Missing ingredients or instructions' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is missing in .env.local' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.5-flash',
      generationConfig: { 
        temperature: 0.1, 
        responseMimeType: "application/json" 
      }
    });

    const indexedIngredients = ingredients.map((text: string, index: number) => ({ index, text }));
    const indexedInstructions = instructions.map((text: string, index: number) => ({ index, text }));

    const prompt = `
      You are an expert culinary AI mapping recipe ingredients to instruction steps.
      
      Ingredients:
      ${JSON.stringify(indexedIngredients)}
      
      Instructions:
      ${JSON.stringify(indexedInstructions)}
      
      RULES:
      1. Output ONLY a valid JSON object.
      2. The keys of the JSON must be the string index of the instruction step (e.g., "0", "1", "2").
      3. The values must be arrays of INTEGER INDICES from the Ingredients list representing what is used in that step (e.g., [0, 2, 5]).
      4. ONLY MAP AN INGREDIENT TO THE VERY FIRST STEP IT APPEARS IN. Do not include it in any subsequent steps. (This saves processing time).
      5. Do not return strings in the array. Only the integer 'index' of the matched ingredient.
      6. If a step uses no new ingredients, provide an empty array [].
      7. Use culinary context (e.g. "marinade ingredients" implies the yogurt, lime, and spices).
      8. NEVER invent an index that does not exist in the Ingredients list.
    `;

    let responseText = '';
    let attempt = 0;
    const maxRetries = 3;

    // Retry loop for handling 503 high demand errors gracefully
    while (attempt < maxRetries) {
      try {
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        break; 
      } catch (error: any) {
        attempt++;
        const is503 = error.message && error.message.includes('503');
        if (attempt >= maxRetries || !is503) {
          throw error; 
        }
        await delay(1000 * Math.pow(2, attempt - 1));
      }
    }

    const parsedData = JSON.parse(responseText);

    let finalMap: Record<string, number[]> = {};
    if (Array.isArray(parsedData)) {
       parsedData.forEach(item => {
           const stepKey = item.stepIndex ?? item.step ?? item.id;
           const ingArr = item.ingredientIndices ?? item.ingredients ?? item.indices ?? [];
           if (stepKey !== undefined) finalMap[String(stepKey)] = Array.isArray(ingArr) ? ingArr.map(Number) : [];
       });
    } else if (parsedData.map && typeof parsedData.map === 'object') {
       finalMap = parsedData.map;
    } else {
       finalMap = parsedData;
    }

    return NextResponse.json({ map: finalMap }, { status: 200 });

  } catch (error: any) {
    console.error('Map steps error:', error);
    return NextResponse.json({ error: error.message || 'Unknown AI API error' }, { status: 500 });
  }
}