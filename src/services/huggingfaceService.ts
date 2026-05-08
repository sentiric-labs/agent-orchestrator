import * as dotenv from "dotenv";
dotenv.config();

/**
 * 🤖 [RESEARCH AGENT] KENDİ KENDİNİ İYİLEŞTİREN MOTOR
 * Hangi modelin açık/kapalı olduğunu tahmin etmek yerine,
 * sistem HF Hub'daki popüler modelleri çeker ve çalışanı bulana kadar dener.
 */
export async function generateBRoll(prompt: string): Promise<Buffer | null> {
    console.log(`🤖 [RESEARCH AGENT] Hugging Face'teki aktif modeller taranıyor...`);
    
    try {
        // 1. Hugging Face'ten şu an dünyadaki en popüler 10 'text-to-image' modelini sor
        const searchUrl = "https://huggingface.co/api/models?pipeline_tag=text-to-image&sort=likes&direction=-1&limit=10";
        const searchResponse = await fetch(searchUrl);
        
        if (!searchResponse.ok) {
            console.error("🚨 Modeller listelenemedi API'ye ulaşılamıyor.");
            return null;
        }

        const models = await searchResponse.json();
        const modelIds = models.map((m: any) => m.id);
        console.log(`📋 Test Edilecek Modeller: ${modelIds.join(", ")}`);

        // 2. Modelleri sırayla test et (Çalışanı bulana kadar)
        for (const modelId of modelIds) {
            console.log(`\n🧪 DENENİYOR: ${modelId}`);
            const url = `https://api-inference.huggingface.co/models/${modelId}`;
            
            let response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.HF_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ inputs: prompt })
            });

            // Uyku modundaysa hızlıca 10 saniye bekle, şans ver
            if (response.status === 503) {
                console.log(`⏳[${modelId}] Uyuyor. 10 saniye şans veriliyor...`);
                await new Promise(resolve => setTimeout(resolve, 10000));
                
                response = await fetch(url, { // Tekrar dene
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.HF_TOKEN}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ inputs: prompt })
                });
            }

            // Başarılıysa resmi al, aramayı bitir ve bu modeli kullan!
            if (response.ok) {
                console.log(`✅ BAŞARILI! Çalışan model bulundu ve görsel üretildi: ${modelId}`);
                const arrayBuffer = await response.arrayBuffer();
                return Buffer.from(arrayBuffer);
            } else {
                // Eğer yine o sinir bozucu 404'ü verirse, atlayıp sıradakine geçecek
                console.log(`❌ ATLANDI (Hata ${response.status}): ${modelId}`);
            }
        }
        
        console.error("🚨 Ücretsiz havuzdaki top 10 modelin hiçbiri şu an yanıt vermiyor.");
        return null;

    } catch (error: any) {
        console.error("❌ [Research Agent] Kritik Sistem Hatası:", error.message || error);
        return null;
    }
}
