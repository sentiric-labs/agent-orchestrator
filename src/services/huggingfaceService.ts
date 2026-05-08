import * as dotenv from "dotenv";
dotenv.config();

export async function generateBRoll(prompt: string): Promise<Buffer | null> {
    try {
        console.log(`🎨 [HuggingFace] Görsel üretiliyor (Native Fetch + FLUX.1 devrede)...`);
        
        // SDXL kaldırıldığı için dünyanın en iyi ücretsiz ve hızlı FLUX modeline geçiyoruz.
        const MODEL_ID = "black-forest-labs/FLUX.1-schnell"; 
        const url = `https://api-inference.huggingface.co/models/${MODEL_ID}`;
        
        const makeRequest = async () => {
            return await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.HF_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    inputs: prompt
                    // Not: FLUX modelleri, SD gibi karmaşık 'negative_prompt' vb. ayarlara 
                    // ihtiyaç duymadan doğrudan prompt'u çok iyi anlar.
                })
            });
        };

        let response = await makeRequest();

        // 503 Hatası: Model uyuyorsa (Cold Start) uyanmasını bekle
        if (response.status === 503) {
            const errorData = await response.json();
            const waitTime = Math.ceil(errorData.estimated_time || 20); 
            console.log(`⏳ [HuggingFace] Model yükleniyor. Uyanması için ${waitTime} saniye bekleniyor...`);
            
            // Sistemi belirtilen saniye kadar duraklat
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
            
            console.log("🔄 [HuggingFace] Model hazır, istek tekrarlanıyor...");
            response = await makeRequest(); // İkinci deneme
        }

        // Eğer hala hata varsa, kapalı kutu değil GERÇEK hatayı ekrana bas
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
