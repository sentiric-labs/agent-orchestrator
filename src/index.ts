import { 
    getSpec, 
    createIssue, 
    getOpenIssues, 
    addComment, 
    updateIssueLabels, 
    getInsights 
} from "./services/githubService";
import { generateContent } from "./services/aiService";

/**
 * SENTIRIC LABS - AJAN ORKESTRATÖRÜ ANA MOTORU (v1.1)
 * Bu motor, GitHub Issues üzerinden bir "State Machine" (Durum Makinesi) olarak çalışır.
 */

async function runSystem() {
    console.log("🚀 [SENTIRIC LABS] Orkestratör Uyandırıldı...");

    try {
        // --- 1. SİSTEM HAFIZASINI (MEMORY) YÜKLE ---
        const insights = await getInsights("behavior-engine");
        const systemMemory = insights.length > 0 
            ? insights.map(i => `[DERS #${i.number}]: ${i.body}`).join("\n\n") 
            : "Henüz geçmiş tecrübe kaydı yok. Bu ilk üretimlerden biridir.";

        // --- 2. MEVCUT GÖREVLERİ (ISSUES) KONTROL ET ---
        const issues = await getOpenIssues("content-engine");

        // --- 3. DURUM ANALİZİ VE AJAN TETİKLEME ---

        // SENARYO A: HİÇ AÇIK GÖREV YOKSA (YENİ PROJE BAŞLAT)
        if (issues.length === 0) {
            console.log("🔍 [DATA AGENT] İş akışı boş. Yeni fikir üretiliyor...");
            const systemRules = await getSpec("Spec-00_System_Rules.md");
            const dataSpec = await getSpec("Spec-01_Intelligence_and_Data.md");
            
            const taskPrompt = `
                SİSTEM HAFIZASI VE GEÇMİŞ HATALAR:\n${systemMemory}\n
                GÖREV: Yukarıdaki tecrübelere dayanarak, hataları tekrarlamayan, izleyici memnuniyeti odaklı yeni bir video fikri bul ve Spec-01 formatında sun.
            `;
            
            const response = await generateContent(`${systemRules}\n\n${dataSpec}`, taskPrompt);
            const issueUrl = await createIssue(
                "content-engine", 
                "🎯 YENİ PROJE: (Hafıza Destekli Strateji)", 
                response, 
                ["status: backlog", "agent: data-behavior"]
            );
            console.log(`✅ [DATA AGENT] Yeni proje başlatıldı: ${issueUrl}`);
            return;
        }

        // SENARYO B: MEVCUT GÖREVLERİ İŞLE (STATE MACHINE)
        const currentIssue = issues[0]; // Her seferinde en eski açık görevi işle
        const labels = currentIssue.labels.map(l => typeof l === 'string' ? l : l.name || "");
        const issueNumber = currentIssue.number;

        console.log(`📌 [İŞLENİYOR] Proje #${issueNumber}: "${currentIssue.title}"`);

        // --- STAGE 1: GÖRSEL AMBALAJ (VISUAL AGENT) ---
        if (labels.includes("status: backlog") || labels.includes("status: conceptualization")) {
            console.log("🎨 [VISUAL AGENT] Ambalaj tasarımı hazırlanıyor...");
            const visualSpec = await getSpec("Spec-02_Visual_Packaging.md");
            const task = `Aşağıdaki video fikri için Spec-02 kurallarına göre Başlık ve Kapak (Thumbnail) tasarımı oluştur:\n\n${currentIssue.body}`;
            
            const response = await generateContent(visualSpec, task);
            await addComment("content-engine", issueNumber, `### 🎨 GÖRSEL AMBALAJ TASARIMI\n\n${response}`);
            await updateIssueLabels("content-engine", issueNumber, ["status: visual-ready", "agent: visual-packaging"]);
            console.log("✅ [VISUAL AGENT] Ambalaj tamamlandı.");
        }
        
        // --- STAGE 2: SENARYO VE DENEYİM (SCRIPT AGENT) ---
        else if (labels.includes("status: visual-ready")) {
            console.log("✍️ [SCRIPT AGENT] Hafıza destekli senaryo yazılıyor...");
            const scriptSpec = await getSpec("Spec-03_Experience_Design.md");
            
            const task = `
                SİSTEM HAFIZASI VE KRİTİK UYARILAR:\n${systemMemory}\n
                VİDEO FİKRİ VE GÖRSEL VAAT:\n${currentIssue.body}\n
                GÖREV: Yukarıdaki hafıza kayıtlarındaki hataları yapmadan (örneğin tempo sorunlarını gidererek) Spec-03 formatında tam senaryoyu yaz.
            `;
            
            const response = await generateContent(scriptSpec, task);
            await addComment("content-engine", issueNumber, `### ✍️ HAFIZA DESTEKLİ SENARYO VE DENEYİM HARİTASI\n\n${response}`);
            await updateIssueLabels("content-engine", issueNumber, ["status: production", "agent: script-writer"]);
            console.log("✅ [SCRIPT AGENT] Senaryo üretildi.");
        }
        
        // --- STAGE 3: ÜRETİM (HUMAN OPERATOR) ---
        else if (labels.includes("status: production")) {
            console.log("⚙️ [PRODUCTION] Sistem beklemeye alındı. İnsan operatörün kurguyu bitirip etiketi 'status: review' yapması bekleniyor.");
        }

        // --- STAGE 4: KALİTE DENETİMİ (QA AUDIT AGENT) ---
        else if (labels.includes("status: review")) {
            console.log("⚖️ [QA AGENT] Denetim süreci başlatıldı...");
            const qaSpec = await getSpec("Spec-04_Production_Blueprint.md");
            const task = `
                Sen acımasız bir kalite denetçisisin. Aşağıdaki projeyi Spec-04 standartlarına göre denetle.
                PROJE: ${currentIssue.title}\n${currentIssue.body}\n
                KARAR: Eğer uygunsa sadece 'ONAYLANDI' yazarak raporunu sun. Değilse 'REVİZYON' diyerek eksikleri belirt.
            `;
            
            const response = await generateContent(qaSpec, task);
            await addComment("content-engine", issueNumber, `### ⚖️ QA DENETİM VE ONAY RAPORU\n\n${response}`);
            
            const isApproved = response.toUpperCase().includes("ONAYLANDI");
            const finalLabels = isApproved ? ["status: ready-to-publish", "agent: audit"] : ["status: revision-needed", "agent: audit"];
            
            await updateIssueLabels("content-engine", issueNumber, finalLabels);
            console.log(`✅ [QA AGENT] Karar verildi: ${isApproved ? "ONAYLANDI" : "REVİZYON"}`);
        }

    } catch (error) {
        console.error("🚨 [SİSTEM HATASI]:", error);
    }
}

// Motoru Ateşle
runSystem();
