import { Octokit } from "octokit";
import * as dotenv from "dotenv";
dotenv.config();

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const ORG = "sentiric-labs";

export async function getSpec(specName: string): Promise<string> {
    try {
        const response = await octokit.rest.repos.getContent({ owner: ORG, repo: "core-specifications", path: specName });
        if (!Array.isArray(response.data) && response.data.type === "file" && response.data.content) {
            return Buffer.from(response.data.content, "base64").toString("utf-8");
        }
        return "";
    } catch (error) {
        console.error(`❌ Hata: ${specName} okunamadı.`, error);
        return "";
    }
}

export async function createIssue(repo: string, title: string, body: string, labels: string[]): Promise<string> {
    const response = await octokit.rest.issues.create({ owner: ORG, repo, title, body, labels });
    return response.data.html_url;
}

// YENİ EKLENEN YETENEKLER AŞAĞIDADIR:

export async function getOpenIssues(repo: string) {
    const response = await octokit.rest.issues.listForRepo({ owner: ORG, repo, state: "open" });
    return response.data;
}

export async function addComment(repo: string, issueNumber: number, body: string) {
    await octokit.rest.issues.createComment({ owner: ORG, repo, issue_number: issueNumber, body });
}

export async function updateIssueLabels(repo: string, issueNumber: number, labels: string[]) {
    await octokit.rest.issues.setLabels({ owner: ORG, repo, issue_number: issueNumber, labels });
}

/**
 * Belirli bir repodaki etiketlenmiş analiz raporlarını getirir
 */
export async function getInsights(repo: string) {
    try {
        const response = await octokit.rest.issues.listForRepo({
            owner: ORG,
            repo: repo,
            labels: "type: insight",
            state: "all" // Hem açık hem kapalı raporları oku
        });
        return response.data;
    } catch (error) {
        console.error("❌ Insights okunamadı:", error);
        return [];
    }
}

export async function uploadAsset(repo: string, path: string, contentBase64: string, message: string): Promise<string> {
    try {
        const response = await octokit.rest.repos.createOrUpdateFileContents({
            owner: ORG,
            repo: repo,
            path: path,
            message: message,
            content: contentBase64
        });
        return response.data.content?.html_url || ""; 
    } catch (error) {
        console.error("❌ Asset yükleme hatası:", error);
        return "";
    }
}

export async function closeIssue(repo: string, issueNumber: number) {
    await octokit.rest.issues.update({ owner: ORG, repo, issue_number: issueNumber, state: "closed" });
}
