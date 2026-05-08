import * as dotenv from "dotenv";
dotenv.config();

export async function generateBRoll(prompt: string): Promise<Buffer | null> {
    try {
        console.log(`🎨 [HuggingFace] Görsel üretiliyor (Native Fetch + SDXL devrede)...`);
        
        // SENİN BULDUĞUN MODEL: Şu an dünyadaki en iyi açık kaynak görsel modeli
        const MODEL_ID = "stabilityai/stable-diffusion-xl-base-1.0"; 
        const url = `https://api-inference.huggingface.co/models/${MODEL_ID}`;
        
        const makeRequest = async () => {
            return await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.HF_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: { 
                        negative_prompt: "blurry, text, watermark, low quality" 
                    },
                    // 🔥 KRİTİK NOKTA: Model uyuyorsa hata verme, uyanmasını bekle
                    options: { 
                        wait_for_model: true,
                        use_cache: false 
                    }
                })
            });
        };

        let response = await makeRequest();

        // 503 Hatası: Hugging Face "Model uyuyor, lütfen X saniye bekle" der
        if (response.status === 503) {
            const errorData = await response.json();
            const waitTime = Math.ceil(errorData.estimated_time || 45); // Tahmini süreyi al
            console.log(`⏳ [HuggingFace] Dev model uyuyor. Uyanması için ${waitTime} saniye bekleniyor...`);
            
            // Sistemi belirtilen saniye kadar duraklat
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
            
            console.log("🔄 [HuggingFace] Model uyandı, istek tekrarlanıyor...");
            response = await makeRequest(); // İkinci deneme
        }

        // Hala hata varsa (Örn: kota dolduysa) gizleme, doğrudan ekrana bas
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`🚨 HTTP Hatası: ${response.status} ${response.statusText}`);
            console.error(`🚨 HF Yanıt Detayı: ${errorText}`);
            return null;
        }

        console.log("✅ [HuggingFace] Görsel başarıyla üretildi!");
        
        // Başarılıysa görseli Buffer olarak döndür
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
        
    } catch (error: any) {
        console.error("❌ [HuggingFace] Kritik Sistem Hatası:", error.message || error);
        return null;
    }
}
