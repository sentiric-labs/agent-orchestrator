import { HfInference } from "@huggingface/inference";
import * as dotenv from "dotenv";
dotenv.config();

const hf = new HfInference(process.env.HF_TOKEN);

export async function generateBRoll(prompt: string): Promise<Buffer | null> {
    try {
        console.log(`🎨[HuggingFace] Görsel üretiliyor (Bu işlem modelin uyanması için 1-2 dakika sürebilir)...`);
        console.log(`📝 Prompt: "${prompt}"`);
        
        const blob = await hf.textToImage(
            {
                // SDXL çok büyük bir modeldir. Beklemek istemezseniz burayı: "runwayml/stable-diffusion-v1-5" yapabilirsiniz.
                model: "stabilityai/stable-diffusion-xl-base-1.0",
                inputs: prompt,
                parameters: { negative_prompt: "blurry, text, watermark, low quality" }
            },
            {
                // 🔥 İŞTE HAYAT KURTARAN AYARLAR BURADA 🔥
                wait_for_model: true, // Model uyuyorsa (Cold Start), uyanana kadar bekle.
                use_cache: false      // Hep aynı resmi üretmemesi için cache'i kapat.
            }
        );
        
        const arrayBuffer = await blob.arrayBuffer();
        return Buffer.from(arrayBuffer);
        
    } catch (error: any) {
        console.error("❌ [HuggingFace] Görsel üretilemedi.");
        
        // Hatayı sessizce yutmak yerine gerçek sebebini ekrana yazdırıyoruz
        if (error.response) {
            console.error("🚨 API Yanıt Hatası:", error.response.status, error.response.statusText);
        } else {
            console.error("🚨 Sistem Hatası:", error.message || error);
        }
        return null;
    }
}
