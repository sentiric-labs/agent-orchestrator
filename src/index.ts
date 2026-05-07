import { getSpec, createIssue } from "./services/githubService";
import { generateContent } from "./services/aiService";

async function runSystem() {
    console.log("🚀 Sentiric Labs Ajan Orkestratörü Başlatıldı...");

    // 1. GitHub'dan sistem kurallarını ve Veri Ajanının özelliklerini çek
    console.log("📥 core-specifications'dan Anayasa okunuyor...");
    const systemRules = await getSpec("Spec-00_System_Rules.md");
    const dataAgentSpec = await getSpec("Spec-01_Intelligence_and_Data.md");

    const agentBrain = `${systemRules}\n\n${dataAgentSpec}`;

    // 2. Ajanın İlk Görevini Ver (FAZ 5)
    const task = `
    Bugün '@Wiliam-Louis' YouTube kanalı için ilk stratejiyi belirlemeni istiyorum. 
    Bu kanal sıfırdan kuruluyor. Sen bir LLM Data ajanısın. Özgürce analiz yap.
    Lütfen izleyici tatmini (satisfaction) odaklı algoritmaları göz önünde bulundurarak:
    1. Bu kanal için rekabetin az ama ilginin yüksek olduğu bir "Niche" (Niş) öner.
    2. Hedef kitlenin kim olduğunu tanımla.
    3. Spec-01 formatına uygun olarak İLK VİDEO fikrini üret.
    `;

    // 3. Gemini'ı Düşünmeye Sevk Et
    console.log("🧠 Veri Ajanı (Gemini) düşünüyor ve araştırıyor...");
    const aiResponse = await generateContent(agentBrain, task);

    // 4. Bulduğu Sonuçları content-engine'de Görev (Issue) Olarak Aç
    console.log("📝 content-engine reposunda Issue (Proje Kartı) açılıyor...");
    const issueUrl = await createIssue(
        "content-engine",
        "🎯 STRATEJİ: @Wiliam-Louis Kanalı Niche Belirleme ve İlk Fikir",
        aiResponse,
        ["status: backlog", "agent: data-behavior"]
    );

    console.log(`✅ BAŞARILI! Sistem kendi kendine ilk projeyi başlattı: ${issueUrl}`);
}

runSystem();
