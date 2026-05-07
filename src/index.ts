import { getSpec, createIssue, getOpenIssues, addComment, updateIssueLabels } from "./services/githubService";
import { generateContent } from "./services/aiService";

async function runSystem() {
    console.log("🚀 Sentiric Labs Ajan Orkestratörü Başlatıldı...");
    
    // Açık olan projeleri (Issues) bul
    const issues = await getOpenIssues("content-engine");
    
    if (issues.length === 0) {
        // Eğer hiç iş yoksa, Veri Ajanı yeni fikir bulsun (Geçen seferki gibi)
        console.log("🔍 Hiç açık görev yok. Data Ajanı yeni fikir üretiyor...");
        const systemRules = await getSpec("Spec-00_System_Rules.md");
        const dataSpec = await getSpec("Spec-01_Intelligence_and_Data.md");
        const task = "Yeni bir video fikri bul ve Spec-01 formatında sun.";
        const response = await generateContent(`${systemRules}\n\n${dataSpec}`, task);
        await createIssue("content-engine", "🎯 YENİ FİKİR", response, ["status: backlog"]);
        console.log("✅ Yeni proje oluşturuldu.");
        return;
    }

    // İlk açık projeyi al ve etiketlerine bak
    const currentIssue = issues[0];
    const labels = currentIssue.labels.map(l => typeof l === 'string' ? l : l.name);
    console.log(`📌 İşlenen Proje: #${currentIssue.number} - ${currentIssue.title}`);

    // --- AŞAMA 1: GÖRSEL AMBALAJ AJANI DEVREYE GİRER ---
    if (labels.includes("status: backlog") || labels.includes("status: conceptualization")) {
        console.log("🎨 Görsel Ambalaj Ajanı (Spec-02) uyanıyor...");
        const visualSpec = await getSpec("Spec-02_Visual_Packaging.md");
        const task = `Aşağıdaki video fikri için Spec-02 kurallarına göre Başlık (Title) ve Kapak (Thumbnail) tasarımı oluştur:\n\n${currentIssue.body}`;
        
        const response = await generateContent(visualSpec, task);
        
        await addComment("content-engine", currentIssue.number, `### 🎨 GÖRSEL AMBALAJ ONAYI\n\n${response}`);
        await updateIssueLabels("content-engine", currentIssue.number,["status: visual-ready", "agent: visual-packaging"]);
        console.log("✅ Ambalaj Ajanı görevini tamamladı ve projeyi Senaryo aşamasına devretti.");
    }
    
    // --- AŞAMA 2: SENARYO AJANI DEVREYE GİRER ---
    else if (labels.includes("status: visual-ready")) {
        console.log("✍️ Senaryo Ajanı (Spec-03) uyanıyor...");
        const scriptSpec = await getSpec("Spec-03_Experience_Design.md");
        const task = `Aşağıdaki video fikri ve görsel konsept için Spec-03 formatında tam bir Senaryo/Deneyim haritası çıkar:\n\n${currentIssue.body}`;
        
        const response = await generateContent(scriptSpec, task);
        
        await addComment("content-engine", currentIssue.number, `### ✍️ SENARYO VE KANCA ONAYI\n\n${response}`);
        await updateIssueLabels("content-engine", currentIssue.number, ["status: production", "agent: script-writer"]);
        console.log("✅ Senaryo Ajanı görevini tamamladı ve projeyi Üretim aşamasına devretti.");
    }
    
    else {
        console.log("⚙️ Bu projenin LLM ajanı işlemleri tamamlanmış. Operatör (İnsan) müdahalesi bekleniyor (status: production).");
    }
}

runSystem();
