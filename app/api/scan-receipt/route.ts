import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    console.log("📥 Received receipt scan request...");
    
    const formData = await req.formData();
    const file = formData.get('receipt') as File;
    
    if (!file) {
      console.log("❌ Error: No file uploaded");
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log(`📄 File received: ${file.name} (${file.type})`);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log("❌ Error: Missing GEMINI_API_KEY in environment variables");
      return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
    }

    const bytes = await file.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString('base64');

    const genAI = new GoogleGenerativeAI(apiKey);

    const responseSchema = {
      type: SchemaType.ARRAY,
      description: "A list of grocery items extracted from the receipt.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, description: "Clean product name" },
          category: { 
            type: SchemaType.STRING, 
            enum: ["Produce", "Dairy & Eggs", "Meat & Seafood", "Pantry Staples", "Bakery", "Frozen", "Snacks", "Beverages", "Other"] 
          },
          quantity: { type: SchemaType.NUMBER },
          unit: { type: SchemaType.STRING },
        },
        required: ["name", "category", "quantity", "unit"],
      },
    };

    // FIXED: Changed gemini-3.6-flash to gemini-1.5-flash
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema as any, 
        temperature: 0.1, 
      }
    });

    const prompt = `You are a highly accurate grocery receipt transcription AI. 
    Analyze this receipt image. 
    Extract ONLY the purchased food and grocery items. 
    Ignore taxes, subtotals, discounts, store information, and non-grocery items.
    Translate abbreviated store receipt jargon into normal, readable grocery names.
    If the image is too blurry, not a receipt, or you are completely uncertain, return an empty array [].`;

    console.log("🤖 Sending image to Gemini AI...");
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType: file.type } }
    ]);

    const text = result.response.text();
    console.log("✨ Raw Gemini Response:", text);

    let items = JSON.parse(text);

    // Sometimes Gemini wraps arrays in an object like { "items": [...] } despite the schema. Let's catch that!
    if (!Array.isArray(items) && items.items && Array.isArray(items.items)) {
       items = items.items;
    }

    if (!Array.isArray(items) || items.length === 0) {
      console.log("⚠️ Result was empty or not an array after parsing.");
      return NextResponse.json({ items: [], message: "No clear grocery items could be read from this receipt." });
    }

    console.log(`✅ Successfully parsed ${items.length} items!`);
    return NextResponse.json({ items });
    
  } catch (error: any) {
    console.error("❌ Receipt Scan Error:", error.message || error);
    return NextResponse.json({ error: 'Failed to process receipt image', details: error.message }, { status: 500 });
  }
}