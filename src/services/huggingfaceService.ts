import * as dotenv from "dotenv";
dotenv.config();

export async function generateBRoll(prompt: string): Promise<Buffer | null> {
    try {
        console.log(`🎨 [HuggingFace] Görsel üretiliyor (Native Fetch motoru devrede)...`);
        console.log(`📝 Prompt: "${prompt}"`);
        
        // SDXL yerine lisans onayı istemeyen, daha hızlı v1.5 modelini kullanıyoruz
        const MODEL_ID = "runwayml/stable-diffusion-v1-5"; 
        const url = `https://api-inference.huggingface.co/models/${MODEL_ID}`;
        
        // İsteği atan fonksiyonumuz
        const makeRequest = async () => {
            return await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.HF_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: { negative_prompt: "blurry, text, watermark, low quality" }
                })
            });
        };

        let response = await makeRequest();

        // 503 Hatası: Model uyuyorsa (Cold Start) Hugging Face tahmini uyanma süresini söyler
        if (response.status === 503) {
            const errorData = await response.json();
            const waitTime = Math.ceil(errorData.estimated_time || 30);
            console.log(`⏳ [HuggingFace] Model uyuyor. Uyanması için ${waitTime} saniye bekleniyor...`);
            
            // Sistemi belirtilen saniye kadar duraklat
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
            
            console.log("🔄 [HuggingFace] Model uyandı, istek tekrarlanıyor...");
            response = await makeRequest(); // İkinci deneme
        }

        // Eğer hala hata varsa, kapalı kutu değil GERÇEK hatayı ekrana bas
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`🚨 HTTP Hatası: ${response.status} ${response.statusText}`);
            console.error(`🚨 HF Yanıt Detayı: ${errorText}`);
            return null;
        }

        // Başarılıysa görseli Buffer olarak döndür
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
        
    } catch (error: any) {
        console.error("❌ [HuggingFace] Kritik Sistem Hatası:", error.message || error);
        return null;
    }
}
