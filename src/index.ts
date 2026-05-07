import { 
    getSpec, createIssue, getOpenIssues, addComment, 
    updateIssueLabels, getInsights, uploadAsset 
} from "./services/githubService";
import { generateContent } from "./services/aiService";
import { generateBRoll } from "./services/huggingfaceService";

async function runSystem() {
    console.log("🚀 [SENTIRIC LABS] Orkestratör Uyandırıldı...");

    try {
        const insights = await getInsights("behavior-engine");
        const systemMemory = insights.length > 0 
            ? insights.map(i => `[DERS #${i.number}]: ${i.body}`).join("\n\n") 
            : "Henüz geçmiş tecrübe kaydı yok.";

        const issues = await getOpenIssues("content-engine");

        if (issues.length === 0) {
            console.log("🔍 [DATA AGENT] Yeni proje başlatılıyor...");
            const dataSpec = await getSpec("Spec-01_Intelligence_and_Data.md");
            const response = await generateContent(dataSpec, `SİSTEM HAFIZASI:\n${systemMemory}\nGÖREV: Yeni bir video fikri bul.`);
            await createIssue("content-engine", "🎯 YENİ PROJE", response, ["status: backlog", "agent: data-behavior"]);
            return;
        }

        const currentIssue = issues[0];
        const labels = currentIssue.labels.map(l => typeof l === 'string' ? l : l.name || "");
        const issueNumber = currentIssue.number;

        console.log(`📌 [İŞLENİYOR] Proje #${issueNumber}`);

        if (labels.includes("status: backlog") || labels.includes("status: conceptualization")) {
            console.log("🎨 [VISUAL AGENT] Ambalaj tasarımı hazırlanıyor...");
            const visualSpec = await getSpec("Spec-02_Visual_Packaging.md");
            const response = await generateContent(visualSpec, `GÖREV: Tasarım Şartnamesi oluştur:\n${currentIssue.body}`);
            await addComment("content-engine", issueNumber, `### 🎨 GÖRSEL AMBALAJ TASARIMI\n\n${response}`);
            await updateIssueLabels("content-engine", issueNumber, ["status: visual-ready", "agent: visual-packaging"]);
        }
        
        else if (labels.includes("status: visual-ready")) {
            console.log("✍️ [SCRIPT AGENT] Senaryo yazılıyor...");
            const scriptSpec = await getSpec("Spec-03_Experience_Design.md");
            const response = await generateContent(scriptSpec, `HAFIZA:\n${systemMemory}\nGÖREV: Senaryoyu yaz:\n${currentIssue.body}`);
            await addComment("content-engine", issueNumber, `### ✍️ HAFIZA DESTEKLİ SENARYO\n\n${response}`);
            await updateIssueLabels("content-engine", issueNumber, ["status: production", "agent: script-writer"]);
        }
        
        // 🔥 YENİ EKLENEN AI PRODUCTION OPERATOR (HUGGINGFACE) 🔥
        else if (labels.includes("status: production")) {
            console.log("⚙️ [PRODUCTION AGENT] AI Kurgu / Üretim Başlıyor...");
            
            // 1. Gemini'ye senaryoyu okutup, İngilizce bir "Resim Üretme Komutu" (Prompt) yazdırıyoruz.
            const promptTask = `Aşağıdaki senaryoyu oku ve bu senaryoyu yansıtan 1 adet etkileyici, sinematik kapak/b-roll resmi için SADECE İngilizce bir görsel prompt yaz.\nSenaryo:\n${currentIssue.body}\nPrompt:`;
            const sdPrompt = await generateContent("Sen uzman bir sanat yönetmenisin.", promptTask);
            
            // 2. HuggingFace'i tetikliyoruz!
            const imageBuffer = await generateBRoll(sdPrompt.trim());
            
            if (imageBuffer) {
                // 3. Görseli "wiliam-louis-assets" deposuna kaydediyoruz!
                const fileName = `images/WL-${issueNumber}-${Date.now()}.png`;
                const assetUrl = await uploadAsset("wiliam-louis-assets", fileName, imageBuffer.toString("base64"), `Upload B-Roll for Project #${issueNumber}`);
                
                // 4. Issue'ya rapor bırakıp QA testine gönderiyoruz.
                const report = `### 🎬 OTONOM ÜRETİM TAMAMLANDI\n\n**HuggingFace AI** kullanılarak görsel varlıklar başarıyla üretildi ve repoya kaydedildi.\n\n* **Kullanılan Prompt:** \`${sdPrompt}\`\n* **Varlık Linki:** [Görseli İncele](${assetUrl})\n\nSistem denetim (QA) aşamasına gönderiliyor.`;
                await addComment("content-engine", issueNumber, report);
                await updateIssueLabels("content-engine", issueNumber, ["status: review", "agent: audit"]);
                console.log("✅ [PRODUCTION] Asset üretildi ve yüklendi.");
            } else {
                console.log("🚨 [PRODUCTION] Asset üretilemedi, sonraki döngüde tekrar denenecek.");
            }
        }

        else if (labels.includes("status: review")) {
            console.log("⚖️[QA AGENT] Denetim yapılıyor...");
            const qaSpec = await getSpec("Spec-04_Production_Blueprint.md");
            const response = await generateContent(qaSpec, `PROJE: ${currentIssue.body}\nKARAR: Onaylıyorsan 'ONAYLANDI' yaz.`);
            await addComment("content-engine", issueNumber, `### ⚖️ QA ONAY RAPORU\n\n${response}`);
            
            const isApproved = response.toUpperCase().includes("ONAYLANDI");
            await updateIssueLabels("content-engine", issueNumber, isApproved ? ["status: ready-to-publish", "agent: audit"] :["status: revision-needed", "agent: audit"]);
        }

    } catch (error) {
        console.error("🚨 [SİSTEM HATASI]:", error);
    }
}

runSystem();
