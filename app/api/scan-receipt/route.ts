// app/api/scan-receipt/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Grab the image file from the frontend request
    const formData = await request.formData();
    const file = formData.get('receipt') as File;
    
    if (!file) {
      return NextResponse.json({ message: 'No receipt image found.' }, { status: 400 });
    }

    // 2. Convert the image file into a Base64 string so Gemini can read it
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';

    // 3. Define the strict instructions for the AI
    const systemPrompt = `
      You are an expert grocery receipt parser. 
      Read the attached receipt image and extract the grocery items.
      
      RULES:
      1. Convert messy store abbreviations into clean, standard grocery names (e.g. "KLLG CRNFLK 18OZ" -> "Corn Flakes", "ONION YEL MED" -> "Yellow Onion").
      2. Group identical items together and sum their quantities.
      3. Assign an appropriate unit ('pcs', 'kg', 'g', 'lbs', 'oz', 'ml', 'l', 'packs', 'cans').
      4. Assign ONE of these exact categories: 'Produce', 'Dairy & Eggs', 'Meat & Seafood', 'Pantry Staples', 'Bakery', 'Frozen', 'Snacks', 'Beverages', 'Other'.
      5. Skip non-grocery items like taxes, bags, or hardware.
      
      You must respond ONLY with a valid JSON object matching this exact format:
      {
        "items": [
          {
            "name": "Yellow Onion",
            "quantity": 2,
            "unit": "pcs",
            "category": "Produce"
          }
        ]
      }
    `;

    // 4. Send the image and prompt directly to the Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1, // Keep it low so the AI is factual, not creative
          responseMimeType: "application/json" // Forces perfect JSON output
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini Error:", errorText);
      return NextResponse.json({ message: 'Failed to communicate with AI scanner.' }, { status: 500 });
    }

    // 5. Extract and return the clean data!
    const aiData = await response.json();
    const rawContent = aiData.candidates[0].content.parts[0].text;
    
    const parsedData = JSON.parse(rawContent);
    return NextResponse.json(parsedData, { status: 200 });

  } catch (error: any) {
    console.error("Receipt processing error:", error);
    return NextResponse.json({ message: 'Failed to process receipt.', error: error.message }, { status: 500 });
  }
}