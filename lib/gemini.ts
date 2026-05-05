import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' 
});

export async function analyzeArchaeologyTile(imageData: string, prompt: string) {
  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not defined");
  }

  const model = "gemini-3-flash-preview";

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: imageData.split(',')[1], // Strip data:image/jpeg;base64,
    },
  };

  const textPart = {
    text: `You are an expert archaeologist and remote sensing specialist. 
    Analyze this satellite tile for potential Roman fortified structures or archaeological anomalies. 
    Consider the Enki-Turkana pipeline context: multi-sensor fusion (RGB, NDVI, SAR).
    
    ${prompt}`,
  };

  const response = await ai.models.generateContent({
    model,
    contents: { parts: [imagePart, textPart] },
  });

  return response.text;
}
