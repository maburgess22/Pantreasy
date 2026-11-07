import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { itemName } = await request.json();
    if (!itemName) return NextResponse.json({ category: 'Other' }, { status: 400 });

    const systemPrompt = `
      You are an expert UK grocery categorization engine.
      Categorize the item "${itemName}" into EXACTLY ONE of the following categories:
      'Produce', 'Dairy & Eggs', 'Meat & Poultry', 'Seafood', 'Vegetarian Products', 
      'Pantry Staples', 'Spices & Condiments', 'Bakery', 'Frozen Foods', 'Snacks & Sweets', 
      'Beverages', 'Deli & Prepared Foods', 'Household & Cleaning', 'Health & Personal Care', 'Pet Care', 'Other'.
      
      Respond ONLY with a valid JSON object matching this exact format:
      {
        "category": "Selected Category Name"
      }
    `;

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) return NextResponse.json({ category: 'Other', message: 'API key missing' }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // FIXED: Using the officially verified active model for fast JSON categorization
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.5-flash',
      generationConfig: { 
        temperature: 0.1, 
        responseMimeType: "application/json" 
      }
    });

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);
    
    let category = parsedData.category || 'Other';
    
    const validCategories = ['Produce', 'Dairy & Eggs', 'Meat & Poultry', 'Seafood', 'Vegetarian Products', 'Pantry Staples', 'Spices & Condiments', 'Bakery', 'Frozen Foods', 'Snacks & Sweets', 'Beverages', 'Deli & Prepared Foods', 'Household & Cleaning', 'Health & Personal Care', 'Pet Care', 'Other'];
    if (!validCategories.includes(category)) category = 'Other';

    return NextResponse.json({ category }, { status: 200 });

  } catch (error: any) {
    console.error("Categorization error:", error);
    return NextResponse.json({ category: 'Other' }, { status: 500 });
  }
}