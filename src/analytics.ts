import { getSpec, createIssue } from "./services/githubService";
import { generateContent } from "./services/aiService";
import { Octokit } from "octokit";
import * as dotenv from "dotenv";
dotenv.config();

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const ORG = "sentiric-labs";

async function getLogData(repo: string, path: string): Promise<string> {
    try {
        const response = await octokit.rest.repos.getContent({ owner: ORG, repo: repo, path: path });
        if (!Array.isArray(response.data) && response.data.type === "file" && response.data.content) {
            return Buffer.from(response.data.content, "base64").toString("utf-8");
        }
        return "";
    } catch (error) {
        console.error("Log okuma hatası:", error);
        return "";
    }
}

async function runAnalytics() {
    console.log("📊 Analytics & Learning Ajanı Uyanıyor...");

    // 1. Spec-05'i ve Video Logunu Oku
    const analyticsSpec = await getSpec("Spec-05_Behavioral_Feedback_Loop.md");
    const logData = await getLogData("behavior-engine", "logs/video_001_performance.json");

    if (!logData) {
        console.log("Okunacak yeni veri bulunamadı.");
        return;
    }

    // 2. Gemini'a Görevi Ver
    const task = `Aşağıdaki JSON verisi, 7 gün önce yayınlanan ilk videomuzun performansını gösteriyor. 
    Lütfen Spec-05 kurallarına göre analiz et ve bir "Sistem Güncelleme Raporu" oluştur.
    Hangi aşamada (Data, Visual, Script, Production) hata yapıldığını veya neyin iyi çalıştığını belirt.
    
    VERİ:
    ${logData}`;

    console.log("🧠 Yapay Zeka Verileri Analiz Ediyor...");
    const report = await generateContent(analyticsSpec, task);

    // 3. Çıktıyı behavior-engine reposunda kalıcı bir Issue (Öğrenim Kartı) olarak kaydet
    const issueUrl = await createIssue(
        "behavior-engine",
        "🧠 SİSTEM GÜNCELLEMESİ: Video 001 Performans Analizi",
        report,
        ["type: insight", "agent: analytics"]
    );

    console.log(`✅ Analiz Tamamlandı! Öğrenme Raporu Oluşturuldu: ${issueUrl}`);
}

runAnalytics();
