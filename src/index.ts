import { getSpec, createIssue, getOpenIssues, addComment, updateIssueLabels } from "./services/githubService";
import { generateContent } from "./services/aiService";

async function runSystem() {
    console.log("🚀 Sentiric Labs Ajan Orkestratörü Başlatıldı...");
    
    const issues = await getOpenIssues("content-engine");
    
    if (issues.length === 0) {
        console.log("🔍 Hiç açık görev yok. Data Ajanı yeni fikir üretiyor...");
        const systemRules = await getSpec("Spec-00_System_Rules.md");
        const dataSpec = await getSpec("Spec-01_Intelligence_and_Data.md");
        const response = await generateContent(`${systemRules}\n\n${dataSpec}`, "Yeni bir video fikri bul ve Spec-01 formatında sun.");
        await createIssue("content-engine", "🎯 YENİ FİKİR", response,["status: backlog"]);
        return;
    }

    const currentIssue = issues[0];
    const labels = currentIssue.labels.map(l => typeof l === 'string' ? l : l.name);
    console.log(`📌 İşlenen Proje: #${currentIssue.number} - ${currentIssue.title}`);

    // --- AŞAMA 1: GÖRSEL AMBALAJ ---
    if (labels.includes("status: backlog") || labels.includes("status: conceptualization")) {
        console.log("🎨 Görsel Ambalaj Ajanı (Spec-02) uyanıyor...");
        const visualSpec = await getSpec("Spec-02_Visual_Packaging.md");
        const response = await generateContent(visualSpec, `Aşağıdaki video fikri için Spec-02 kurallarına göre Başlık ve Kapak tasarımı oluştur:\n\n${currentIssue.body}`);
        await addComment("content-engine", currentIssue.number, `### 🎨 GÖRSEL AMBALAJ ONAYI\n\n${response}`);
        await updateIssueLabels("content-engine", currentIssue.number,["status: visual-ready", "agent: visual-packaging"]);
    }
    
    // --- AŞAMA 2: SENARYO VE DENEYİM ---
    else if (labels.includes("status: visual-ready")) {
        console.log("✍️ Senaryo Ajanı (Spec-03) uyanıyor...");
        const scriptSpec = await getSpec("Spec-03_Experience_Design.md");
        const response = await generateContent(scriptSpec, `Aşağıdaki video fikri için Spec-03 formatında tam bir Senaryo/Deneyim haritası çıkar:\n\n${currentIssue.body}`);
        await addComment("content-engine", currentIssue.number, `### ✍️ SENARYO VE KANCA ONAYI\n\n${response}`);
        await updateIssueLabels("content-engine", currentIssue.number,["status: production", "agent: script-writer"]);
    }
    
    // --- AŞAMA 3: İNSAN OPERATÖR BEKLEMESİ ---
    else if (labels.includes("status: production")) {
        console.log("⚙️ Sistem 'status: production' aşamasında. İnsan operatörün kurguyu bitirip etiketi 'status: review' yapması bekleniyor.");
    }

    // --- AŞAMA 4: QA DENETİM VE ONAY (YENİ EKLENDİ) ---
    else if (labels.includes("status: review")) {
        console.log("⚖️ QA Denetçi Ajanı (Spec-04) uyanıyor...");
        const qaSpec = await getSpec("Spec-04_Production_Blueprint.md");
        const task = `Sen bir acımasız kalite denetçisisin (Spec-04). İnsan operatör aşağıdaki projeyi kurguladı ve onaya sundu. 
        Mevcut Başlık, Kapak ve Senaryo uyumunu kontrol et. Projede sistemin mantığına veya "Beklenti Yönetimine (Expectation Match)" aykırı bir şey var mı değerlendir.
        
        Eğer her şey kusursuzsa metnine tam olarak "ONAYLANDI" kelimesiyle başla. Eksik varsa "REVİZYON" kelimesiyle başla.
        
        PROJE DETAYLARI:
        ${currentIssue.title}
        ${currentIssue.body}
        `;
        
        const response = await generateContent(qaSpec, task);
        await addComment("content-engine", currentIssue.number, `### ⚖️ QA DENETİM RAPORU\n\n${response}`);
        
        if (response.includes("ONAYLANDI")) {
            await updateIssueLabels("content-engine", currentIssue.number,["status: ready-to-publish", "agent: audit"]);
            console.log("✅ Proje onaylandı ve yayınlanmaya hazır.");
        } else {
            await updateIssueLabels("content-engine", currentIssue.number, ["status: revision-needed", "agent: audit"]);
            console.log("❌ Proje revizyona gönderildi.");
        }
    }
}

runSystem();
