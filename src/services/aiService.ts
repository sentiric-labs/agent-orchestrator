import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
dotenv.config();

// Gemini API bağlantısını kur
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }); // Bedava ve süper hızlı sürüm

/**
 * Ajanın karakterini (System Prompt) ve görevi (User Prompt) birleştirip düşünmesini sağlar
 */
export async function generateContent(systemPrompt: string, taskPrompt: string): Promise<string> {
    try {
        // Modele kim olduğunu ve ne yapması gerektiğini söylüyoruz
        const fullPrompt = `SİSTEM KURALLARI VE KARAKTERİN:\n${systemPrompt}\n\nŞU ANKİ GÖREVİN:\n${taskPrompt}`;
        
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("❌ Gemini düşünürken bir hata oluştu:", error);
        return "Yapay Zeka Yanıt Hatası";
    }
}
