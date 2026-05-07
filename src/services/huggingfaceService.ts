import { HfInference } from "@huggingface/inference";
import * as dotenv from "dotenv";
dotenv.config();

const hf = new HfInference(process.env.HF_TOKEN);

export async function generateBRoll(prompt: string): Promise<Buffer | null> {
    try {
        console.log(`🎨 [HuggingFace] Görsel üretiliyor: "${prompt}"`);
        const blob = await hf.textToImage({
            model: "stabilityai/stable-diffusion-xl-base-1.0",
            inputs: prompt,
            parameters: { negative_prompt: "blurry, text, watermark, low quality" }
        });
        const arrayBuffer = await blob.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error("❌ [HuggingFace] Görsel üretilemedi:", error);
        return null;
    }
}
