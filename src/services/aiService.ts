import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

export async function generateContent(systemPrompt: string, taskPrompt: string): Promise<string> {
    try {
        const fullPrompt = `SİSTEM KURALLARI VE KARAKTERİN:\n${systemPrompt}\n\nŞU ANKİ GÖREVİN:\n${taskPrompt}`;
        
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        // ESKİ BERBAT KOD: return "Yapay Zeka Yanıt Hatası";
        // YENİ DOĞRU KOD: Hatayı doğrudan fırlat ki sistem dursun!
        console.error("❌ Gemini API Hatası:");
        throw error; 
    }
}
