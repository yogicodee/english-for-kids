import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getGrammarFeedback(sentence: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a friendly Robot English Teacher for Elementary School kids (7-12 years old). 
      Review this sentence and give super happy and encouraging feedback. 
      Use simple words, lots of emojis, and be very kind!
      If there is a small mistake, help them fix it nicely. 
      Sentence: "${sentence}"`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sorry, I couldn't check that right now. Keep practicing!";
  }
}
