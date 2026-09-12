import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('receipt') as File;
    
    if (!file) return NextResponse.json({ message: 'No receipt image found.' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    
    // Safely enforce image MIME type so Google doesn't reject mobile photos
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

// 4. Send the image and prompt directly to the Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // ... keep the rest of the body exactly the same
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { inlineData: { mimeType: mimeType, data: base64Image } }
            ]
          }
        ],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errMsg = 'Failed to communicate with AI scanner.';
      try { const errObj = JSON.parse(errorText); if (errObj.error?.message) errMsg = errObj.error.message; } catch (e) {}
      console.error("Gemini API Error:", errorText);
      return NextResponse.json({ message: errMsg }, { status: response.status });
    }

    const aiData = await response.json();
    const rawContent = aiData.candidates[0].content.parts[0].text;
    const parsedData = JSON.parse(rawContent);

    return NextResponse.json(parsedData, { status: 200 });

  } catch (error: any) {
    console.error("Receipt processing error:", error);
    return NextResponse.json({ message: 'Failed to process receipt.', error: error.message }, { status: 500 });
  }
}