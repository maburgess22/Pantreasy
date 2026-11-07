import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('receipt') as File;
    
    if (!file) return NextResponse.json({ message: 'No receipt image found.' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    
    let mimeType = file.type;
    if (!mimeType || !mimeType.startsWith('image/')) mimeType = 'image/jpeg';

    const systemPrompt = `
      You are an expert grocery receipt parser. Read the attached receipt image.
      RULES:
      1. Convert messy store abbreviations into clean, standard grocery names.
      2. Group identical items together and sum their quantities.
      3. Assign an appropriate unit ('pcs', 'kg', 'g', 'lbs', 'oz', 'ml', 'l', 'packs', 'cans').
      4. Assign ONE of these exact categories: 'Produce', 'Dairy & Eggs', 'Meat & Seafood', 'Pantry Staples', 'Bakery', 'Frozen', 'Snacks', 'Beverages', 'Other'.
      5. Skip non-grocery items like taxes, bags, or hardware.
      
      Respond ONLY with a valid JSON object matching this exact format:
      {
        "items": [ { "name": "Yellow Onion", "quantity": 2, "unit": "pcs", "category": "Produce" } ]
      }
    `;

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) return NextResponse.json({ message: 'GEMINI_API_KEY is missing from .env.local' }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Standardized to the verified active model for fast multimodal parsing
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.5-flash',
      generationConfig: { 
        temperature: 0.1, 
        responseMimeType: "application/json" 
      }
    });

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType
      }
    };

    // The SDK seamlessly handles the multimodal array format
    const result = await model.generateContent([systemPrompt, imagePart]);
    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);

    return NextResponse.json(parsedData, { status: 200 });

  } catch (error: any) {
    console.error("Receipt processing error:", error);
    return NextResponse.json({ message: 'Failed to process receipt.', error: error.message }, { status: 500 });
  }
}